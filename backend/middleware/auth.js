const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Zugriff verweigert',
        message: 'Kein Authentifizierungs-Token bereitgestellt'
      });
    }

    // Token verifizieren
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Benutzer aus Datenbank laden
    const db = getDatabase();
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, is_active FROM users WHERE id = ?',
        [decoded.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({
        error: 'Ungültiger Token',
        message: 'Benutzer nicht gefunden'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Konto deaktiviert',
        message: 'Ihr Konto wurde deaktiviert'
      });
    }

    // Benutzerinformationen an Request anhängen
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Ungültiger Token',
        message: 'Token ist nicht gültig'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token abgelaufen',
        message: 'Bitte melden Sie sich erneut an'
      });
    }

    logger.error('Authentifizierungsfehler:', error);
    res.status(500).json({
      error: 'Authentifizierung fehlgeschlagen',
      message: 'Interner Serverfehler'
    });
  }
}

// Optional: Middleware für Admin-Berechtigung
async function requireAdmin(req, res, next) {
  try {
    // Hier könnten wir eine Admin-Rolle aus der Datenbank prüfen
    // Für jetzt nehmen wir an, dass bestimmte Benutzernamen Admins sind
    const adminUsers = ['admin', 'administrator', 'root'];
    
    if (!adminUsers.includes(req.user.username)) {
      return res.status(403).json({
        error: 'Zugriff verweigert',
        message: 'Administrator-Berechtigung erforderlich'
      });
    }

    next();

  } catch (error) {
    logger.error('Admin-Berechtigungsfehler:', error);
    res.status(500).json({
      error: 'Berechtigungsprüfung fehlgeschlagen'
    });
  }
}

module.exports = {
  authenticateToken,
  requireAdmin
}; 