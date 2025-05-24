import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import instanceRoutes from './routes/instances.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 7200;

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  // Log the full error details
  if (reason instanceof Error) {
    console.error('Error details:', {
      name: reason.name,
      message: reason.message,
      stack: reason.stack
    });
  }
});

// Async handler wrapper to catch promise rejections
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware
app.use(cors());
app.use(express.json());

// Database connection test with retry
async function testDbConnection(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('Successfully connected to database');
      return;
    } catch (error) {
      console.error(`Failed to connect to database (attempt ${i + 1}/${retries}):`, error);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/instances', instanceRoutes);

// Health check endpoint
app.get('/api/health', asyncHandler(async (req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', database: 'connected' });
}));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  // Handle specific types of errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ 
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred with the database'
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Authentication error',
      message: 'Invalid authentication token'
    });
  }
  
  // Default error response
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start server
async function startServer() {
  try {
    await testDbConnection();
    
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer().catch(async (error) => {
  console.error('Fatal error during startup:', error);
  await prisma.$disconnect();
  process.exit(1);
}); 