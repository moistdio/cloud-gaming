const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase, checkFirstUserAdmin } = require('../database/init');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';

// Validation middleware
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Benutzername muss 3-30 Zeichen lang sein und darf nur Buchstaben, Zahlen, _ und - enthalten'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Passwort muss mindestens 8 Zeichen lang sein und Groß-, Kleinbuchstaben sowie Zahlen enthalten')
];

const validateLogin = [
  body('username').notEmpty().withMessage('Benutzername erforderlich'),
  body('password').notEmpty().withMessage('Passwort erforderlich')
];

// Registrierung
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validierungsfehler',
        details: errors.array()
      });
    }

    const { username, email, password } = req.body;
    const db = getDatabase();

    console.log(`Registrierungsversuch: ${username} (${email})`);

    // Prüfen ob Benutzer bereits existiert
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      console.log(`Registrierung fehlgeschlagen - Benutzer existiert bereits: ${username}`);
      return res.status(409).json({
        error: 'Benutzer existiert bereits',
        message: 'Benutzername oder E-Mail bereits vergeben'
      });
    }

    // Passwort hashen
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Benutzer erstellen
    const userId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Prüfen ob dies der erste Benutzer ist und ihn zum Admin machen
    const isFirstUser = await checkFirstUserAdmin(userId);

    console.log(`Neuer Benutzer registriert: ${username} (ID: ${userId})${isFirstUser ? ' - ADMINISTRATOR' : ''}`);

    // Log erstellen
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
        [userId, 'USER_REGISTERED', `Benutzer ${username} registriert${isFirstUser ? ' (Administrator)' : ''}`, req.ip],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.status(201).json({
      message: 'Benutzer erfolgreich registriert',
      user: {
        id: userId,
        username,
        email,
        isAdmin: isFirstUser
      }
    });

  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({
      error: 'Registrierung fehlgeschlagen',
      message: 'Interner Serverfehler'
    });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validierungsfehler',
        details: errors.array()
      });
    }

    const { username, password } = req.body;
    const db = getDatabase();

    console.log(`Login-Versuch: ${username}`);

    // Benutzer finden
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, password_hash, is_active, is_admin FROM users WHERE username = ? OR email = ?',
        [username, username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      console.log(`Login fehlgeschlagen - Benutzer nicht gefunden: ${username}`);
      return res.status(401).json({
        error: 'Anmeldung fehlgeschlagen',
        message: 'Ungültige Anmeldedaten'
      });
    }

    if (!user.is_active) {
      console.log(`Login fehlgeschlagen - Konto deaktiviert: ${username}`);
      return res.status(403).json({
        error: 'Konto deaktiviert',
        message: 'Ihr Konto wurde deaktiviert'
      });
    }

    // Passwort prüfen
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log(`Login fehlgeschlagen - Falsches Passwort: ${username}`);
      return res.status(401).json({
        error: 'Anmeldung fehlgeschlagen',
        message: 'Ungültige Anmeldedaten'
      });
    }

    // JWT Token erstellen
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        isAdmin: user.is_admin
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Session erstellen
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [user.id, sessionToken, expiresAt.toISOString(), req.ip, req.get('User-Agent')],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Last login aktualisieren
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
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
        [user.id, 'USER_LOGIN', `Benutzer ${user.username} angemeldet`, req.ip],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`Erfolgreicher Login: ${user.username} (ID: ${user.id})`);

    res.json({
      message: 'Anmeldung erfolgreich',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin
      }
    });

  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({
      error: 'Anmeldung fehlgeschlagen',
      message: 'Interner Serverfehler'
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Kein Token bereitgestellt'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDatabase();

    // Session löschen
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM sessions WHERE user_id = ?',
        [decoded.userId],
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
        [decoded.userId, 'USER_LOGOUT', `Benutzer ${decoded.username} abgemeldet`, req.ip],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`Benutzer abgemeldet: ${decoded.username}`);

    res.json({
      message: 'Erfolgreich abgemeldet'
    });

  } catch (error) {
    console.error('Logout-Fehler:', error);
    res.status(500).json({
      error: 'Abmeldung fehlgeschlagen'
    });
  }
});

// Token validieren
router.get('/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Kein Token bereitgestellt'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDatabase();

    // Benutzer prüfen
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, is_active, is_admin FROM users WHERE id = ?',
        [decoded.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Ungültiger Token'
      });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Ungültiger oder abgelaufener Token'
      });
    }

    console.error('Token-Validierungsfehler:', error);
    res.status(500).json({
      error: 'Token-Validierung fehlgeschlagen'
    });
  }
});

module.exports = router; 