const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Alle Routes benötigen Authentifizierung
router.use(authenticateToken);

// Benutzerprofil abrufen
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, created_at, last_login FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({
        error: 'Benutzer nicht gefunden'
      });
    }

    // Container-Statistiken abrufen
    const containerStats = await new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status = "running" THEN 1 ELSE 0 END) as running FROM containers WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    res.json({
      user: {
        ...user,
        containerStats: {
          total: containerStats.total || 0,
          running: containerStats.running || 0
        }
      }
    });

  } catch (error) {
    console.error('Profil-Abruffehler:', error);
    res.status(500).json({
      error: 'Profil konnte nicht abgerufen werden'
    });
  }
});

// Benutzer-Aktivitätslogs abrufen
router.get('/logs', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;
    const db = getDatabase();

    const logs = await new Promise((resolve, reject) => {
      db.all(
        'SELECT action, details, ip_address, created_at FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, parseInt(limit), parseInt(offset)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const totalLogs = await new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM logs WHERE user_id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });

    res.json({
      logs,
      pagination: {
        total: totalLogs,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalLogs
      }
    });

  } catch (error) {
    console.error('Log-Abruffehler:', error);
    res.status(500).json({
      error: 'Logs konnten nicht abgerufen werden'
    });
  }
});

// Benutzer-Sessions abrufen
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    const sessions = await new Promise((resolve, reject) => {
      db.all(
        'SELECT session_token, expires_at, created_at, ip_address, user_agent FROM sessions WHERE user_id = ? AND expires_at > datetime("now") ORDER BY created_at DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Session-Token für Sicherheit kürzen
    const safeSessions = sessions.map(session => ({
      ...session,
      session_token: session.session_token.substring(0, 8) + '...'
    }));

    res.json({
      sessions: safeSessions,
      total: safeSessions.length
    });

  } catch (error) {
    console.error('Session-Abruffehler:', error);
    res.status(500).json({
      error: 'Sessions konnten nicht abgerufen werden'
    });
  }
});

// Session beenden
router.delete('/sessions/:sessionToken', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionToken } = req.params;
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM sessions WHERE user_id = ? AND session_token = ?',
        [userId, sessionToken],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      message: 'Session erfolgreich beendet'
    });

  } catch (error) {
    console.error('Session-Löschfehler:', error);
    res.status(500).json({
      error: 'Session konnte nicht beendet werden'
    });
  }
});

// Alle Sessions beenden (außer der aktuellen)
router.delete('/sessions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentSessionToken = req.headers['x-session-token'];
    const db = getDatabase();

    let query = 'DELETE FROM sessions WHERE user_id = ?';
    let params = [userId];

    if (currentSessionToken) {
      query += ' AND session_token != ?';
      params.push(currentSessionToken);
    }

    await new Promise((resolve, reject) => {
      db.run(query, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      message: 'Alle anderen Sessions erfolgreich beendet'
    });

  } catch (error) {
    console.error('Session-Löschfehler:', error);
    res.status(500).json({
      error: 'Sessions konnten nicht beendet werden'
    });
  }
});

// Dashboard-Statistiken abrufen
router.get('/dashboard-stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const isAdmin = req.user.isAdmin;
    const db = getDatabase();

    // Benutzer-spezifische Statistiken
    const userStats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(c.id) as total_containers,
          SUM(CASE WHEN c.status = 'running' THEN 1 ELSE 0 END) as running_containers,
          MAX(c.created_at) as last_container_created,
          COUNT(l.id) as total_actions
        FROM users u
        LEFT JOIN containers c ON u.id = c.user_id
        LEFT JOIN logs l ON u.id = l.user_id
        WHERE u.id = ?`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Benutzer-Informationen
    const userInfo = await new Promise((resolve, reject) => {
      db.get(
        'SELECT username, email, created_at, last_login, is_admin FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Letzte Aktivitäten des Benutzers
    const recentActivities = await new Promise((resolve, reject) => {
      db.all(
        'SELECT action, details, created_at FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    let systemStats = null;
    
    // System-weite Statistiken nur für Admins
    if (isAdmin) {
      systemStats = await new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            COUNT(DISTINCT u.id) as total_users,
            COUNT(c.id) as total_containers,
            SUM(CASE WHEN c.status = 'running' THEN 1 ELSE 0 END) as running_containers,
            COUNT(l.id) as total_actions,
            COUNT(DISTINCT DATE(l.created_at)) as active_days
          FROM users u
          LEFT JOIN containers c ON u.id = c.user_id
          LEFT JOIN logs l ON u.id = l.user_id`,
          [],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      // Top-Benutzer nach Container-Aktivität
      const topUsers = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            u.username,
            COUNT(c.id) as container_count,
            COUNT(l.id) as action_count,
            MAX(l.created_at) as last_activity
          FROM users u
          LEFT JOIN containers c ON u.id = c.user_id
          LEFT JOIN logs l ON u.id = l.user_id
          GROUP BY u.id, u.username
          ORDER BY action_count DESC
          LIMIT 5`,
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Container-Status-Verteilung
      const containerStatusDistribution = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            status,
            COUNT(*) as count
          FROM containers
          GROUP BY status`,
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Aktivitäten der letzten 7 Tage
      const weeklyActivity = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            DATE(created_at) as date,
            COUNT(*) as actions
          FROM logs
          WHERE created_at >= datetime('now', '-7 days')
          GROUP BY DATE(created_at)
          ORDER BY date DESC`,
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      systemStats.topUsers = topUsers;
      systemStats.containerStatusDistribution = containerStatusDistribution;
      systemStats.weeklyActivity = weeklyActivity;
    }

    // Port-Nutzung berechnen
    const portUsage = await new Promise((resolve, reject) => {
      db.all(
        'SELECT vnc_port, web_port FROM containers WHERE status = "running"',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const usedPorts = portUsage.length;
    const maxPorts = 430; // 11000-11430
    const portUtilization = Math.round((usedPorts / maxPorts) * 100);

    res.json({
      user: {
        ...userInfo,
        stats: {
          totalContainers: userStats.total_containers || 0,
          runningContainers: userStats.running_containers || 0,
          lastContainerCreated: userStats.last_container_created,
          totalActions: userStats.total_actions || 0
        },
        recentActivities
      },
      system: systemStats,
      resources: {
        portUtilization,
        usedPorts,
        maxPorts,
        availablePorts: maxPorts - usedPorts
      },
      serverInfo: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      }
    });

  } catch (error) {
    console.error('Dashboard-Statistiken-Fehler:', error);
    res.status(500).json({
      error: 'Dashboard-Statistiken konnten nicht abgerufen werden'
    });
  }
});

module.exports = router; 