const express = require('express');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');
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
    logger.error('Profil-Abruffehler:', error);
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
    logger.error('Log-Abruffehler:', error);
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
    logger.error('Session-Abruffehler:', error);
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
    logger.error('Session-Löschfehler:', error);
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
    logger.error('Sessions-Löschfehler:', error);
    res.status(500).json({
      error: 'Sessions konnten nicht beendet werden'
    });
  }
});

module.exports = router; 