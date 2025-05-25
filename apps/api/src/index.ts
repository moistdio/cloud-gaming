import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://148.251.51.138:7000',
    'http://148.251.51.138:7080',
    process.env.CORS_ORIGIN
  ].filter((origin): origin is string => Boolean(origin)),
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'CloudStream API'
  });
});

// API routes
app.use('/api/auth', authRoutes);

app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'CloudStream API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP cloudstream_api_status API status
# TYPE cloudstream_api_status gauge
cloudstream_api_status 1

# HELP cloudstream_active_sessions_total Total active streaming sessions
# TYPE cloudstream_active_sessions_total gauge
cloudstream_active_sessions_total 0
`);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CloudStream API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🌐 CORS enabled for: localhost:3000, 148.251.51.138:7000, 148.251.51.138:7080`);
});

export default app; 