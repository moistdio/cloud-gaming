const express = require('express');
const Docker = require('dockerode');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const docker = new Docker();

// Port-Range für VNC und Web-VNC
const VNC_PORT_START = 5900;
const WEB_VNC_PORT_START = 6080;
const MAX_CONTAINERS_PER_USER = 3;

// Alle Routes benötigen Authentifizierung
router.use(authenticateToken);

// Verfügbaren Port finden
async function findAvailablePort(startPort, usedPorts = []) {
  let port = startPort;
  while (usedPorts.includes(port)) {
    port++;
  }
  return port;
}

// Verwendete Ports aus der Datenbank abrufen
async function getUsedPorts() {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT vnc_port, web_port FROM containers WHERE status != "stopped"',
      [],
      (err, rows) => {
        if (err) reject(err);
        else {
          const ports = [];
          rows.forEach(row => {
            ports.push(row.vnc_port, row.web_port);
          });
          resolve(ports);
        }
      }
    );
  });
}

// Container erstellen
router.post('/create', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { containerName } = req.body;
    const db = getDatabase();

    // Prüfen ob Benutzer bereits maximale Anzahl Container hat
    const userContainers = await new Promise((resolve, reject) => {
      db.all(
        'SELECT COUNT(*) as count FROM containers WHERE user_id = ?',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0].count);
        }
      );
    });

    if (userContainers >= MAX_CONTAINERS_PER_USER) {
      return res.status(400).json({
        error: 'Container-Limit erreicht',
        message: `Maximal ${MAX_CONTAINERS_PER_USER} Container pro Benutzer erlaubt`
      });
    }

    // Verfügbare Ports finden
    const usedPorts = await getUsedPorts();
    const vncPort = await findAvailablePort(VNC_PORT_START, usedPorts);
    const webPort = await findAvailablePort(WEB_VNC_PORT_START, usedPorts);

    // Container-Name generieren falls nicht angegeben
    const finalContainerName = containerName || `desktop-${req.user.username}-${Date.now()}`;
    const containerId = uuidv4();

    // Docker Container erstellen
    const container = await docker.createContainer({
      Image: 'cloud-gaming-desktop:latest',
      name: finalContainerName,
      Env: [
        `VNC_PASSWORD=${uuidv4().substring(0, 8)}`,
        `DISPLAY=:1`,
        `VNC_PORT=${vncPort}`,
        `WEB_PORT=${webPort}`,
        `USER_ID=${userId}`,
        `USERNAME=${req.user.username}`
      ],
      ExposedPorts: {
        [`${vncPort}/tcp`]: {},
        [`${webPort}/tcp`]: {}
      },
      HostConfig: {
        PortBindings: {
          [`${vncPort}/tcp`]: [{ HostPort: vncPort.toString() }],
          [`${webPort}/tcp`]: [{ HostPort: webPort.toString() }]
        },
        Memory: 2 * 1024 * 1024 * 1024, // 2GB RAM
        CpuShares: 1024, // Standard CPU shares
        ShmSize: 512 * 1024 * 1024, // 512MB shared memory
        RestartPolicy: {
          Name: 'unless-stopped'
        }
      },
      WorkingDir: '/home/user',
      User: 'user'
    });

    // Container in Datenbank speichern
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO containers (user_id, container_id, container_name, vnc_port, web_port, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, container.id, finalContainerName, vncPort, webPort, 'created'],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`Container erstellt: ${finalContainerName} für Benutzer ${req.user.username}`);

    // Log erstellen
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [userId, 'CONTAINER_CREATED', `Container ${finalContainerName} erstellt`, req.ip],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.status(201).json({
      message: 'Container erfolgreich erstellt',
      container: {
        id: container.id,
        name: finalContainerName,
        vncPort,
        webPort,
        status: 'created',
        vncUrl: `vnc://localhost:${vncPort}`,
        webVncUrl: `http://localhost:${webPort}`
      }
    });

  } catch (error) {
    logger.error('Container-Erstellungsfehler:', error);
    res.status(500).json({
      error: 'Container-Erstellung fehlgeschlagen',
      message: error.message
    });
  }
});

// Container starten
router.post('/:containerId/start', async (req, res) => {
  try {
    const { containerId } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();

    // Container-Berechtigung prüfen
    const containerData = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM containers WHERE container_id = ? AND user_id = ?',
        [containerId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!containerData) {
      return res.status(404).json({
        error: 'Container nicht gefunden',
        message: 'Container existiert nicht oder gehört nicht zu diesem Benutzer'
      });
    }

    // Docker Container starten
    const container = docker.getContainer(containerId);
    await container.start();

    // Status in Datenbank aktualisieren
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE containers SET status = ?, last_accessed = CURRENT_TIMESTAMP WHERE container_id = ?',
        ['running', containerId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`Container gestartet: ${containerData.container_name} von Benutzer ${req.user.username}`);

    // Log erstellen
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [userId, 'CONTAINER_STARTED', `Container ${containerData.container_name} gestartet`, req.ip],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      message: 'Container erfolgreich gestartet',
      container: {
        id: containerId,
        name: containerData.container_name,
        status: 'running',
        vncPort: containerData.vnc_port,
        webPort: containerData.web_port,
        vncUrl: `vnc://localhost:${containerData.vnc_port}`,
        webVncUrl: `http://localhost:${containerData.web_port}`
      }
    });

  } catch (error) {
    logger.error('Container-Startfehler:', error);
    res.status(500).json({
      error: 'Container-Start fehlgeschlagen',
      message: error.message
    });
  }
});

// Container stoppen
router.post('/:containerId/stop', async (req, res) => {
  try {
    const { containerId } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();

    // Container-Berechtigung prüfen
    const containerData = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM containers WHERE container_id = ? AND user_id = ?',
        [containerId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!containerData) {
      return res.status(404).json({
        error: 'Container nicht gefunden'
      });
    }

    // Docker Container stoppen
    const container = docker.getContainer(containerId);
    await container.stop();

    // Status in Datenbank aktualisieren
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE containers SET status = ? WHERE container_id = ?',
        ['stopped', containerId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`Container gestoppt: ${containerData.container_name} von Benutzer ${req.user.username}`);

    res.json({
      message: 'Container erfolgreich gestoppt',
      container: {
        id: containerId,
        status: 'stopped'
      }
    });

  } catch (error) {
    logger.error('Container-Stoppfehler:', error);
    res.status(500).json({
      error: 'Container-Stopp fehlgeschlagen',
      message: error.message
    });
  }
});

// Container löschen
router.delete('/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();

    // Container-Berechtigung prüfen
    const containerData = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM containers WHERE container_id = ? AND user_id = ?',
        [containerId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!containerData) {
      return res.status(404).json({
        error: 'Container nicht gefunden'
      });
    }

    // Docker Container löschen
    const container = docker.getContainer(containerId);
    try {
      await container.stop();
    } catch (e) {
      // Container ist bereits gestoppt
    }
    await container.remove();

    // Container aus Datenbank entfernen
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM containers WHERE container_id = ?',
        [containerId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logger.info(`Container gelöscht: ${containerData.container_name} von Benutzer ${req.user.username}`);

    res.json({
      message: 'Container erfolgreich gelöscht'
    });

  } catch (error) {
    logger.error('Container-Löschfehler:', error);
    res.status(500).json({
      error: 'Container-Löschung fehlgeschlagen',
      message: error.message
    });
  }
});

// Container auflisten
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    const containers = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM containers WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Docker-Status für jeden Container abrufen
    const containersWithStatus = await Promise.all(
      containers.map(async (containerData) => {
        try {
          const container = docker.getContainer(containerData.container_id);
          const info = await container.inspect();
          
          return {
            ...containerData,
            dockerStatus: info.State.Status,
            vncUrl: `vnc://localhost:${containerData.vnc_port}`,
            webVncUrl: `http://localhost:${containerData.web_port}`
          };
        } catch (error) {
          return {
            ...containerData,
            dockerStatus: 'not_found',
            vncUrl: `vnc://localhost:${containerData.vnc_port}`,
            webVncUrl: `http://localhost:${containerData.web_port}`
          };
        }
      })
    );

    res.json({
      containers: containersWithStatus,
      total: containersWithStatus.length,
      maxAllowed: MAX_CONTAINERS_PER_USER
    });

  } catch (error) {
    logger.error('Container-Auflistungsfehler:', error);
    res.status(500).json({
      error: 'Container-Auflistung fehlgeschlagen',
      message: error.message
    });
  }
});

// Container-Details abrufen
router.get('/:containerId', async (req, res) => {
  try {
    const { containerId } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();

    // Container-Berechtigung prüfen
    const containerData = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM containers WHERE container_id = ? AND user_id = ?',
        [containerId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!containerData) {
      return res.status(404).json({
        error: 'Container nicht gefunden'
      });
    }

    // Docker-Informationen abrufen
    try {
      const container = docker.getContainer(containerId);
      const info = await container.inspect();
      const stats = await container.stats({ stream: false });

      res.json({
        container: {
          ...containerData,
          dockerInfo: {
            status: info.State.Status,
            startedAt: info.State.StartedAt,
            finishedAt: info.State.FinishedAt,
            restartCount: info.RestartCount
          },
          stats: {
            cpuUsage: stats.cpu_stats,
            memoryUsage: stats.memory_stats,
            networkIO: stats.networks
          },
          vncUrl: `vnc://localhost:${containerData.vnc_port}`,
          webVncUrl: `http://localhost:${containerData.web_port}`
        }
      });

    } catch (error) {
      res.json({
        container: {
          ...containerData,
          dockerInfo: { status: 'not_found' },
          vncUrl: `vnc://localhost:${containerData.vnc_port}`,
          webVncUrl: `http://localhost:${containerData.web_port}`
        }
      });
    }

  } catch (error) {
    logger.error('Container-Detail-Fehler:', error);
    res.status(500).json({
      error: 'Container-Details konnten nicht abgerufen werden',
      message: error.message
    });
  }
});

module.exports = router; 