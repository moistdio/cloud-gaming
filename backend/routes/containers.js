const express = require('express');
const Docker = require('dockerode');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Port-Konfiguration
const VNC_PORT_START = 11000;
const VNC_PORT_END = 11430;
const WEB_VNC_PORT_START = 12000;
const WEB_VNC_PORT_END = 12430;

// Alle Middleware-Funktionen benötigen Authentifizierung
router.use(authenticateToken);

// Hilfsfunktion: Nächsten verfügbaren Port finden
async function findAvailablePort(startPort, endPort, type = 'vnc') {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const column = type === 'vnc' ? 'vnc_port' : 'web_port';
    
    // Alle verwendeten Ports in dem Bereich abrufen
    db.all(
      `SELECT ${column} FROM containers WHERE ${column} >= ? AND ${column} <= ? ORDER BY ${column}`,
      [startPort, endPort],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        const usedPorts = rows.map(row => row[column]);
        
        // Ersten freien Port finden
        for (let port = startPort; port <= endPort; port++) {
          if (!usedPorts.includes(port)) {
            resolve(port);
            return;
          }
        }
        
        // Kein freier Port verfügbar
        reject(new Error(`Keine freien Ports im Bereich ${startPort}-${endPort} verfügbar`));
      }
    );
  });
}

// Hilfsfunktion: Container-Status prüfen
async function getContainerStatus(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info.State.Status;
  } catch (error) {
    return 'not_found';
  }
}

// GET /api/containers - Benutzer-Container abrufen
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    console.log(`Abrufen Container für Benutzer ${userId}`);

    // Container des Benutzers abrufen
    const container = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM containers WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!container) {
      console.log(`Kein Container für Benutzer ${userId} gefunden`);
      return res.json({
        container: null,
        message: 'Kein Container vorhanden'
      });
    }

    console.log(`Container gefunden für Benutzer ${userId}:`, container);

    // Aktuellen Container-Status prüfen
    const status = await getContainerStatus(container.container_id);
    
    // Wenn Container nicht existiert, aus Datenbank entfernen
    if (status === 'not_found') {
      console.log(`Container ${container.container_id} existiert nicht mehr, entferne aus Datenbank`);
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM containers WHERE id = ?',
          [container.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      return res.json({
        container: null,
        message: 'Kein Container vorhanden'
      });
    }
    
    // Status in Datenbank aktualisieren falls unterschiedlich
    if (status !== container.status) {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE containers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [status, container.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      container.status = status;
    }

    res.json({
      container: {
        id: container.id,
        name: container.container_name,
        status: container.status,
        vncPort: container.vnc_port,
        webVncPort: container.web_port,
        createdAt: container.created_at,
        lastAccessed: container.last_accessed
      }
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Container:', error);
    res.status(500).json({
      error: 'Container konnten nicht abgerufen werden'
    });
  }
});

// POST /api/containers/create - Container erstellen
router.post('/create', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { containerName } = req.body;
    const db = getDatabase();

    console.log(`Container-Erstellung angefordert für Benutzer ${userId}: "${containerName}"`);

    if (!containerName || containerName.trim().length === 0) {
      return res.status(400).json({
        error: 'Container-Name ist erforderlich'
      });
    }

    // Prüfen ob Benutzer bereits einen Container hat
    const existingContainer = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM containers WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingContainer) {
      console.log(`Benutzer ${userId} hat bereits einen Container`);
      return res.status(409).json({
        error: 'Sie haben bereits einen Container',
        message: 'Jeder Benutzer kann nur einen Container haben'
      });
    }

    // Verfügbare Ports finden
    const vncPort = await findAvailablePort(VNC_PORT_START, VNC_PORT_END, 'vnc');
    const webVncPort = await findAvailablePort(WEB_VNC_PORT_START, WEB_VNC_PORT_END, 'web');

    console.log(`Erstelle Container für Benutzer ${req.user.username}: VNC=${vncPort}, Web=${webVncPort}`);

    // Docker-Container erstellen
    const containerConfig = {
      Image: 'cloud-gaming-desktop:latest',
      name: `desktop-${userId}-${Date.now()}`,
      Env: [
        `VNC_PORT=${vncPort}`,
        `WEB_VNC_PORT=${webVncPort}`,
        `USER_ID=${userId}`,
        `DISPLAY=:1`
      ],
      ExposedPorts: {
        [`${vncPort}/tcp`]: {},
        [`${webVncPort}/tcp`]: {}
      },
      HostConfig: {
        PortBindings: {
          [`${vncPort}/tcp`]: [{ HostPort: vncPort.toString() }],
          [`${webVncPort}/tcp`]: [{ HostPort: webVncPort.toString() }]
        },
        Memory: 2 * 1024 * 1024 * 1024, // 2GB RAM Limit
        CpuShares: 1024, // Standard CPU-Anteil
        RestartPolicy: {
          Name: 'unless-stopped'
        }
      },
      WorkingDir: '/home/user',
      User: 'root'  // Als root starten für Setup
    };

    const container = await docker.createContainer(containerConfig);
    const containerInfo = await container.inspect();

    console.log(`Docker-Container erstellt: ${containerInfo.Id}`);

    // Container in Datenbank speichern
    const containerId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO containers (user_id, container_id, container_name, vnc_port, web_port, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, containerInfo.Id, containerName.trim(), vncPort, webVncPort, 'created'],
        function(err) {
          if (err) {
            console.error('Fehler beim Speichern in Datenbank:', err);
            reject(err);
          } else {
            console.log(`Container in Datenbank gespeichert mit ID: ${this.lastID}`);
            resolve(this.lastID);
          }
        }
      );
    });

    // Log erstellen
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [userId, 'CONTAINER_CREATED', `Container "${containerName}" erstellt (VNC: ${vncPort}, Web: ${webVncPort})`, req.ip],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`Container erfolgreich erstellt: ${containerInfo.Id} für Benutzer ${req.user.username}`);

    res.status(201).json({
      message: 'Container erfolgreich erstellt',
      container: {
        id: containerId,
        name: containerName.trim(),
        status: 'created',
        vncPort: vncPort,
        webVncPort: webVncPort,
        dockerId: containerInfo.Id
      }
    });

  } catch (error) {
    console.error('Fehler beim Erstellen des Containers:', error);
    res.status(500).json({
      error: 'Container konnte nicht erstellt werden',
      message: error.message
    });
  }
});

// POST /api/containers/start - Container starten
router.post('/start', async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    // Container des Benutzers abrufen
    const containerRecord = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM containers WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!containerRecord) {
      return res.status(404).json({
        error: 'Kein Container gefunden',
        message: 'Sie müssen zuerst einen Container erstellen'
      });
    }

    const container = docker.getContainer(containerRecord.container_id);
    
    // Container-Status prüfen
    const info = await container.inspect();
    
    if (info.State.Status === 'running') {
      return res.status(400).json({
        error: 'Container läuft bereits'
      });
    }

    // Container starten
    await container.start();
    
    // Status in Datenbank aktualisieren
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE containers SET status = ?, updated_at = CURRENT_TIMESTAMP, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
        ['running', containerRecord.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log erstellen
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [userId, 'CONTAINER_STARTED', `Container "${containerRecord.container_name}" gestartet`, req.ip],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`Container gestartet: ${containerRecord.container_id} für Benutzer ${req.user.username}`);

    res.json({
      message: 'Container erfolgreich gestartet',
      container: {
        id: containerRecord.id,
        name: containerRecord.container_name,
        status: 'running',
        vncPort: containerRecord.vnc_port,
        webVncPort: containerRecord.web_port,
        vncUrl: `vnc://localhost:${containerRecord.vnc_port}`,
        webVncUrl: `http://localhost:${containerRecord.web_port}`
      }
    });

  } catch (error) {
    console.error('Fehler beim Starten des Containers:', error);
    res.status(500).json({
      error: 'Container konnte nicht gestartet werden',
      message: error.message
    });
  }
});

// POST /api/containers/stop - Container stoppen
router.post('/stop', async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    // Container des Benutzers abrufen
    const containerRecord = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM containers WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!containerRecord) {
      return res.status(404).json({
        error: 'Kein Container gefunden'
      });
    }

    const container = docker.getContainer(containerRecord.container_id);
    
    // Container-Status prüfen
    const info = await container.inspect();
    
    if (info.State.Status !== 'running') {
      return res.status(400).json({
        error: 'Container läuft nicht'
      });
    }

    // Container stoppen
    await container.stop();
    
    // Status in Datenbank aktualisieren
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE containers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['exited', containerRecord.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log erstellen
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [userId, 'CONTAINER_STOPPED', `Container "${containerRecord.container_name}" gestoppt`, req.ip],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`Container gestoppt: ${containerRecord.container_id} für Benutzer ${req.user.username}`);

    res.json({
      message: 'Container erfolgreich gestoppt',
      container: {
        id: containerRecord.id,
        name: containerRecord.container_name,
        status: 'exited'
      }
    });

  } catch (error) {
    console.error('Fehler beim Stoppen des Containers:', error);
    res.status(500).json({
      error: 'Container konnte nicht gestoppt werden',
      message: error.message
    });
  }
});

// DELETE /api/containers - Container löschen
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    // Container des Benutzers abrufen
    const containerRecord = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM containers WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!containerRecord) {
      return res.status(404).json({
        error: 'Kein Container gefunden'
      });
    }

    const container = docker.getContainer(containerRecord.container_id);
    
    try {
      // Container stoppen falls er läuft
      const info = await container.inspect();
      if (info.State.Status === 'running') {
        await container.stop();
      }
      
      // Container löschen
      await container.remove();
    } catch (dockerError) {
      // Container existiert möglicherweise nicht mehr in Docker
      console.warn(`Docker-Container ${containerRecord.container_id} konnte nicht gelöscht werden:`, dockerError.message);
    }
    
    // Container aus Datenbank entfernen
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM containers WHERE id = ?',
        [containerRecord.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log erstellen
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [userId, 'CONTAINER_DELETED', `Container "${containerRecord.container_name}" gelöscht`, req.ip],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`Container gelöscht: ${containerRecord.container_id} für Benutzer ${req.user.username}`);

    res.json({
      message: 'Container erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Fehler beim Löschen des Containers:', error);
    res.status(500).json({
      error: 'Container konnte nicht gelöscht werden',
      message: error.message
    });
  }
});

// GET /api/containers/logs - Container-Logs abrufen (Admin)
router.get('/logs', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: 'Zugriff verweigert',
        message: 'Nur Administratoren können alle Container-Logs einsehen'
      });
    }

    const db = getDatabase();
    const { limit = 50, offset = 0 } = req.query;

    const logs = await new Promise((resolve, reject) => {
      db.all(
        `SELECT l.*, u.username, c.container_name 
         FROM logs l 
         LEFT JOIN users u ON l.user_id = u.id 
         LEFT JOIN containers c ON l.user_id = c.user_id 
         WHERE l.action LIKE 'CONTAINER_%' 
         ORDER BY l.created_at DESC 
         LIMIT ? OFFSET ?`,
        [parseInt(limit), parseInt(offset)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({
      logs: logs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: logs.length
      }
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Container-Logs:', error);
    res.status(500).json({
      error: 'Container-Logs konnten nicht abgerufen werden'
    });
  }
});

module.exports = router; 