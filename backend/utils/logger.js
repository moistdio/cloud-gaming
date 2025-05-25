const winston = require('winston');
const path = require('path');

// Log-Verzeichnis erstellen falls es nicht existiert
const logDir = path.join(__dirname, '../logs');
require('fs').mkdirSync(logDir, { recursive: true });

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format für bessere Lesbarkeit
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Logger erstellen
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'cloud-gaming-backend' },
  transports: [
    // Fehler-Logs in separate Datei
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Alle Logs in combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// In Development auch Console-Output
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Unhandled exceptions und rejections loggen
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log')
  })
);

process.on('unhandledRejection', (ex) => {
  throw ex;
});

module.exports = logger; 