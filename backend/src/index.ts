import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import instanceRoutes from './routes/instances.js';
import { prisma } from './lib/prisma.js';
import { Server } from 'http';

dotenv.config();

const app = express();
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
  } else {
    console.error('Non-Error rejection reason:', JSON.stringify(reason, null, 2));
  }
});

// Async handler wrapper
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
      
      // Test query to verify connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database query test successful');
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
    stack: err.stack,
    details: err
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
async function startServer(): Promise<Server> {
  let server: Server;
  try {
    console.log('Starting server initialization...');
    console.log('Testing database connection...');
    await testDbConnection();
    
    console.log('Setting up Express server...');
    await new Promise<Server>((resolve, reject) => {
      try {
        server = app.listen(port, () => {
          console.log(`Server running on port ${port}`);
          resolve(server);
        });

        // Handle server errors
        server.on('error', (error: NodeJS.ErrnoException) => {
          console.error('Server error:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          
          if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use`);
          }
          reject(error);
        });

        // Handle server close
        server.on('close', async () => {
          console.log('Server is shutting down');
          await prisma.$disconnect();
        });

      } catch (error) {
        reject(error);
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('Non-Error rejection reason:', JSON.stringify(error, null, 2));
    }
    await prisma.$disconnect();
    process.exit(1);
  }

  return server!;
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
console.log('Initializing application...');
startServer().catch(async (error) => {
  console.error('Fatal error during startup:', error);
  if (error instanceof Error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } else {
    console.error('Non-Error rejection reason:', JSON.stringify(error, null, 2));
  }
  await prisma.$disconnect();
  process.exit(1);
}); 