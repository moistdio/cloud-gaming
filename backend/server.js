const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const containerRoutes = require('./routes/containers');
const userRoutes = require('./routes/users');
const { initDatabase } = require('./database/init');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Limit auf 100 Requests pro windowMs
  message: 'Zu viele Anfragen von dieser IP, bitte später versuchen.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Interner Serverfehler',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Etwas ist schief gelaufen'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint nicht gefunden',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM empfangen, Server wird heruntergefahren...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT empfangen, Server wird heruntergefahren...');
  process.exit(0);
});

// Server starten
async function startServer() {
  try {
    // Datenbank initialisieren
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server läuft auf Port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Fehler beim Starten des Servers:', error);
    process.exit(1);
  }
}

startServer(); 