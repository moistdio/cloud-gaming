const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/database.sqlite');

let db = null;

function getDatabase() {
  if (!db) {
    throw new Error('Datenbank nicht initialisiert');
  }
  return db;
}

async function initDatabase() {
  return new Promise((resolve, reject) => {
    // Sicherstellen, dass das Datenverzeichnis existiert
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logger.error('Fehler beim Öffnen der Datenbank:', err);
        reject(err);
        return;
      }
      
      logger.info(`Datenbank verbunden: ${DB_PATH}`);
      
      // Tabellen erstellen und migrieren
      createTablesAndMigrate()
        .then(() => {
          logger.info('Datenbank erfolgreich initialisiert');
          resolve();
        })
        .catch(reject);
    });
  });
}

async function createTablesAndMigrate() {
  return new Promise((resolve, reject) => {
    const queries = [
      // Benutzer-Tabelle (ohne is_admin erstmal)
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME
      )`,
      
      // Container-Tabelle
      `CREATE TABLE IF NOT EXISTS containers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        container_id TEXT UNIQUE NOT NULL,
        container_name TEXT NOT NULL,
        vnc_port INTEGER NOT NULL,
        web_port INTEGER NOT NULL,
        status TEXT DEFAULT 'stopped',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Sessions-Tabelle
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,
      
      // Logs-Tabelle
      `CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )`
    ];

    let completed = 0;
    const total = queries.length;

    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err) {
          logger.error(`Fehler beim Erstellen der Tabelle ${index + 1}:`, err);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === total) {
          // Nach dem Erstellen der Tabellen, Migrationen durchführen
          runMigrations()
            .then(() => createIndexes())
            .then(resolve)
            .catch(reject);
        }
      });
    });
  });
}

async function runMigrations() {
  return new Promise((resolve, reject) => {
    logger.info('Führe Datenbankmigrationen durch...');
    
    // Prüfe ob is_admin Spalte existiert
    db.get("PRAGMA table_info(users)", (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Prüfe alle Spalten der users Tabelle
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          reject(err);
          return;
        }
        
        const hasIsAdmin = columns.some(col => col.name === 'is_admin');
        
        if (!hasIsAdmin) {
          logger.info('Füge is_admin Spalte zur users Tabelle hinzu...');
          db.run("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0", (err) => {
            if (err) {
              logger.error('Fehler beim Hinzufügen der is_admin Spalte:', err);
              reject(err);
              return;
            }
            logger.info('is_admin Spalte erfolgreich hinzugefügt');
            resolve();
          });
        } else {
          logger.info('is_admin Spalte existiert bereits');
          resolve();
        }
      });
    });
  });
}

async function createIndexes() {
  return new Promise((resolve, reject) => {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin)',
      'CREATE INDEX IF NOT EXISTS idx_containers_user_id ON containers(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at)'
    ];

    let completed = 0;
    const total = indexes.length;

    indexes.forEach((indexQuery) => {
      db.run(indexQuery, (err) => {
        if (err) {
          logger.error('Fehler beim Erstellen des Index:', err);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
  });
}

// Prüfen ob der erste Benutzer Admin werden soll
async function checkFirstUserAdmin(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM users WHERE id < ?',
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Wenn dies der erste Benutzer ist, mache ihn zum Admin
        if (row.count === 0) {
          db.run(
            'UPDATE users SET is_admin = 1 WHERE id = ?',
            [userId],
            (updateErr) => {
              if (updateErr) {
                reject(updateErr);
                return;
              }
              logger.info(`Erster Benutzer (ID: ${userId}) wurde zum Administrator ernannt`);
              resolve(true);
            }
          );
        } else {
          resolve(false);
        }
      }
    );
  });
}

function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        logger.error('Fehler beim Schließen der Datenbank:', err);
      } else {
        logger.info('Datenbankverbindung geschlossen');
      }
    });
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  checkFirstUserAdmin
}; 