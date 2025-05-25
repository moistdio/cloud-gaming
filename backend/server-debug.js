console.log('🚀 Starting server debug...');

try {
  console.log('📦 Loading express...');
  const express = require('express');
  console.log('✅ Express loaded');

  console.log('📦 Loading cors...');
  const cors = require('cors');
  console.log('✅ CORS loaded');

  console.log('📦 Loading helmet...');
  const helmet = require('helmet');
  console.log('✅ Helmet loaded');

  console.log('📦 Loading rate-limit...');
  const rateLimit = require('express-rate-limit');
  console.log('✅ Rate limit loaded');

  console.log('📦 Loading dotenv...');
  require('dotenv').config();
  console.log('✅ Dotenv loaded');

  console.log('📦 Loading database...');
  const { initDatabase } = require('./database/init');
  console.log('✅ Database module loaded');

  console.log('📦 Loading logger...');
  const logger = require('./utils/logger');
  console.log('✅ Logger loaded');

  console.log('📦 Loading routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
  
  const containerRoutes = require('./routes/containers');
  console.log('✅ Container routes loaded');
  
  const userRoutes = require('./routes/users');
  console.log('✅ User routes loaded');

  console.log('🏗️ Creating Express app...');
  const app = express();
  const PORT = process.env.PORT || 3001;
  console.log(`✅ Express app created, PORT: ${PORT}`);

  // Basic middleware
  console.log('🔧 Setting up middleware...');
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3003',
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  console.log('✅ Middleware configured');

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  console.log('✅ Health endpoint configured');

  // Routes
  console.log('🛣️ Setting up routes...');
  app.use('/api/auth', authRoutes);
  app.use('/api/containers', containerRoutes);
  app.use('/api/users', userRoutes);
  console.log('✅ Routes configured');

  // Error handling
  app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: err.message
    });
  });

  // Start server function
  async function startServer() {
    try {
      console.log('🗄️ Initializing database...');
      await initDatabase();
      console.log('✅ Database initialized');
      
      console.log(`🚀 Starting server on port ${PORT}...`);
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error('❌ Error starting server:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }

  console.log('🎯 Calling startServer...');
  startServer();

} catch (error) {
  console.error('❌ Critical error during startup:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
} 