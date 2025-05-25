const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Simple Cloud Gaming Backend...');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Simple backend is running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'API is working'
  });
});

// Simple auth endpoints
app.post('/api/auth/register', (req, res) => {
  console.log('Registration attempt:', req.body);
  
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      error: 'Alle Felder sind erforderlich'
    });
  }
  
  // Simulate successful registration
  res.status(201).json({
    message: 'Benutzer erfolgreich registriert',
    user: {
      id: 1,
      username,
      email,
      isAdmin: true // First user is admin
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      error: 'Benutzername und Passwort erforderlich'
    });
  }
  
  // Simulate successful login
  res.json({
    message: 'Anmeldung erfolgreich',
    token: 'dummy-jwt-token',
    user: {
      id: 1,
      username,
      email: `${username}@example.com`,
      isAdmin: true
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  console.log('Logout request');
  res.json({
    message: 'Erfolgreich abgemeldet'
  });
});

app.get('/api/auth/validate', (req, res) => {
  console.log('Token validation request');
  res.json({
    valid: true,
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      isAdmin: true
    }
  });
});

// Simple container endpoints
app.get('/api/containers', (req, res) => {
  console.log('Get containers request');
  res.json({
    container: null,
    message: 'Kein Container vorhanden'
  });
});

app.post('/api/containers/create', (req, res) => {
  console.log('Create container request:', req.body);
  res.status(201).json({
    message: 'Container erfolgreich erstellt',
    container: {
      id: 1,
      name: req.body.containerName || 'Test Container',
      status: 'created',
      vncPort: 11000,
      webVncPort: 12000
    }
  });
});

app.post('/api/containers/start', (req, res) => {
  console.log('Start container request');
  res.json({
    message: 'Container erfolgreich gestartet',
    container: {
      id: 1,
      status: 'running',
      vncPort: 11000,
      webVncPort: 12000
    }
  });
});

app.post('/api/containers/stop', (req, res) => {
  console.log('Stop container request');
  res.json({
    message: 'Container erfolgreich gestoppt',
    container: {
      id: 1,
      status: 'exited'
    }
  });
});

app.delete('/api/containers', (req, res) => {
  console.log('Delete container request');
  res.json({
    message: 'Container erfolgreich gelöscht'
  });
});

// Users endpoint
app.get('/api/users', (req, res) => {
  console.log('Get users request');
  res.json({
    users: [
      {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        isAdmin: true,
        createdAt: new Date().toISOString()
      }
    ]
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

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Interner Serverfehler',
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple backend running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- GET  /health`);
  console.log(`- GET  /api/health`);
  console.log(`- POST /api/auth/register`);
  console.log(`- POST /api/auth/login`);
  console.log(`- POST /api/auth/logout`);
  console.log(`- GET  /api/auth/validate`);
  console.log(`- GET  /api/containers`);
  console.log(`- POST /api/containers/create`);
  console.log(`- GET  /api/users`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
}); 