const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

console.log('🚀 Starting Cloud Gaming Backend...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_PATH: process.env.DB_PATH
});

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Limit auf 100 Requests pro windowMs
  message: 'Zu viele Anfragen von dieser IP, bitte später versuchen.'
});

// Middleware
console.log('Setting up middleware...');
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Load and register routes with error handling
console.log('Loading routes...');

// Auth routes
try {
  console.log('Loading auth routes...');
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Container routes (optional - may fail if Docker not available)
try {
  console.log('Loading container routes...');
  const containerRoutes = require('./routes/containers');
  app.use('/api/containers', containerRoutes);
  console.log('✅ Container routes loaded successfully');
} catch (error) {
  console.error('⚠️ Failed to load container routes:', error.message);
  console.warn('Container functionality will be disabled');
  
  // Provide fallback container endpoints
  app.get('/api/containers', (req, res) => {
    res.json({ container: null, message: 'Container-Service nicht verfügbar' });
  });
  app.post('/api/containers/*', (req, res) => {
    res.status(503).json({ error: 'Container-Service nicht verfügbar' });
  });
}

// User routes
try {
  console.log('Loading user routes...');
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  console.log('✅ User routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load user routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Interner Serverfehler',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Etwas ist schief gelaufen'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Not found:', req.originalUrl);
  res.status(404).json({
    error: 'Endpoint nicht gefunden',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM empfangen, Server wird heruntergefahren...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT empfangen, Server wird heruntergefahren...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Server starten
async function startServer() {
  try {
    console.log('Initializing database...');
    const { initDatabase } = require('./database/init');
    await initDatabase();
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server läuft auf Port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Available endpoints:');
      console.log('- GET  /health');
      console.log('- GET  /api/health');
      console.log('- POST /api/auth/register');
      console.log('- POST /api/auth/login');
      console.log('- GET  /api/containers');
      console.log('- POST /api/containers/create');
      console.log('- GET  /api/users');
      console.log('🎉 Server ready for connections!');
    });
  } catch (error) {
    console.error('❌ Fehler beim Starten des Servers:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

startServer(); 