const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Starting debug server...');
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DB_PATH:', process.env.DB_PATH);

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Test endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Debug server is running'
  });
});

// Test database
app.get('/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const { initDatabase } = require('./database/init');
    await initDatabase();
    console.log('Database connection successful');
    res.json({ status: 'Database OK' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// Test auth routes
app.get('/test-auth', (req, res) => {
  try {
    console.log('Testing auth routes...');
    const authRoutes = require('./routes/auth');
    console.log('Auth routes loaded successfully');
    res.json({ status: 'Auth routes OK' });
  } catch (error) {
    console.error('Auth routes error:', error);
    res.status(500).json({ 
      error: 'Auth routes failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// Test container routes
app.get('/test-containers', (req, res) => {
  try {
    console.log('Testing container routes...');
    const containerRoutes = require('./routes/containers');
    console.log('Container routes loaded successfully');
    res.json({ status: 'Container routes OK' });
  } catch (error) {
    console.error('Container routes error:', error);
    res.status(500).json({ 
      error: 'Container routes failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message,
    stack: err.stack
  });
});

// Start server
console.log('Starting server on port', PORT);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Debug server running on port ${PORT}`);
  console.log(`Test endpoints:`);
  console.log(`- http://localhost:${PORT}/health`);
  console.log(`- http://localhost:${PORT}/test-db`);
  console.log(`- http://localhost:${PORT}/test-auth`);
  console.log(`- http://localhost:${PORT}/test-containers`);
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