import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user: JWTUser;
    }
  }
}

// Types
interface UserSession {
  userId: string;
  sessionId: string;
  containerId: string;
  containerName: string;
  vncPort: number;
  sunshinePort: number;
  status: 'starting' | 'running' | 'stopping' | 'stopped';
  createdAt: Date;
  lastActivity: Date;
}

interface StreamingRequest {
  userId: string;
  gameId?: string;
  quality: string;
  fps: number;
}

interface JWTUser {
  id: string;
  email: string;
  username: string;
}

// Docker container creation options type
interface ContainerCreateOptions {
  Image: string;
  name: string;
  Env: string[];
  ExposedPorts: Record<string, {}>;
  HostConfig: {
    PortBindings: Record<string, Array<{ HostPort: string }>>;
    Memory: number;
    CpuShares: number;
    AutoRemove: boolean;
    NetworkMode: string;
  };
}

// Setup
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const docker = new Docker();
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'orchestrator.log' })
  ]
});

// In-memory session store (in production, use Redis)
const activeSessions = new Map<string, UserSession>();
const portPool = new Set<number>();

// Initialize port pool (VNC: 8000-8100, Sunshine: 8100-8200)
for (let i = 8000; i < 8100; i++) {
  portPool.add(i);
}
for (let i = 8100; i < 8200; i++) {
  portPool.add(i);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user as JWTUser;
    next();
  });
};

// Utility functions
function getAvailablePort(): number | null {
  for (const port of portPool) {
    portPool.delete(port);
    return port;
  }
  return null;
}

function releasePort(port: number): void {
  portPool.add(port);
}

async function createUserContainer(userId: string, sessionId: string, options: StreamingRequest): Promise<UserSession> {
  const vncPort = getAvailablePort();
  const sunshinePort = getAvailablePort();
  
  if (!vncPort || !sunshinePort) {
    throw new Error('No available ports for new session');
  }

  const containerName = `cloudstream-user-${userId}-${sessionId}`;
  
  try {
    logger.info(`Creating container for user ${userId}, session ${sessionId}`);
    
    const containerOptions: ContainerCreateOptions = {
      Image: 'cloudstream-streaming:latest',
      name: containerName,
      Env: [
        `DISPLAY=:0`,
        `USER_ID=${userId}`,
        `SESSION_ID=${sessionId}`,
        `STREAMING_QUALITY=${options.quality}`,
        `STREAMING_FPS=${options.fps}`,
        `XDG_RUNTIME_DIR=/tmp/runtime-${userId}`
      ],
      ExposedPorts: {
        '5900/tcp': {},
        '47989/tcp': {},
        '47989/udp': {}
      },
      HostConfig: {
        PortBindings: {
          '5900/tcp': [{ HostPort: vncPort.toString() }],
          '47989/tcp': [{ HostPort: sunshinePort.toString() }],
          '47989/udp': [{ HostPort: sunshinePort.toString() }]
        },
        Memory: 4 * 1024 * 1024 * 1024, // 4GB
        CpuShares: 1024,
        AutoRemove: true,
        NetworkMode: 'cloudstream-network'
      }
    };

    const container = await docker.createContainer(containerOptions as any);
    await container.start();
    
    const session: UserSession = {
      userId,
      sessionId,
      containerId: (container as any).id || '',
      containerName,
      vncPort,
      sunshinePort,
      status: 'starting',
      createdAt: new Date(),
      lastActivity: new Date()
    };

    activeSessions.set(sessionId, session);
    
    // Wait for container to be ready
    setTimeout(async () => {
      try {
        const containerInfo = await container.inspect();
        if (containerInfo.State.Running) {
          session.status = 'running';
          logger.info(`Container ${containerName} is now running`);
          
          // Notify client
          io.to(`user-${userId}`).emit('session-ready', {
            sessionId,
            vncPort,
            sunshinePort,
            vncUrl: `${process.env.SERVER_IP || 'localhost'}:${vncPort}`,
            sunshineUrl: `${process.env.SERVER_IP || 'localhost'}:${sunshinePort}`
          });
        }
      } catch (error) {
        logger.error(`Failed to verify container status: ${error}`);
        session.status = 'stopped';
      }
    }, 10000); // Wait 10 seconds for startup

    return session;
  } catch (error) {
    // Release ports if container creation failed
    releasePort(vncPort);
    releasePort(sunshinePort);
    throw error;
  }
}

async function stopUserContainer(sessionId: string): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  try {
    session.status = 'stopping';
    
    const container = docker.getContainer(session.containerId);
    await container.stop();
    
    // Release ports
    releasePort(session.vncPort);
    releasePort(session.sunshinePort);
    
    // Remove from active sessions
    activeSessions.delete(sessionId);
    
    logger.info(`Stopped container for session ${sessionId}`);
  } catch (error) {
    logger.error(`Failed to stop container for session ${sessionId}: ${error}`);
    throw error;
  }
}

// Routes
app.post('/api/streaming/start', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { gameId, quality = '1080p', fps = 60 } = req.body;
    const userId = req.user.id;
    
    // Check if user already has an active session
    const existingSession = Array.from(activeSessions.values())
      .find(session => session.userId === userId && session.status !== 'stopped');
    
    if (existingSession) {
      return res.json({
        success: true,
        sessionId: existingSession.sessionId,
        vncPort: existingSession.vncPort,
        sunshinePort: existingSession.sunshinePort,
        status: existingSession.status
      });
    }

    const sessionId = uuidv4();
    const session = await createUserContainer(userId, sessionId, {
      userId,
      gameId,
      quality,
      fps
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      vncPort: session.vncPort,
      sunshinePort: session.sunshinePort,
      status: session.status
    });
  } catch (error) {
    logger.error(`Failed to start streaming session: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to start streaming session'
    });
  }
});

app.post('/api/streaming/stop', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;
    
    const session = activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await stopUserContainer(sessionId);
    
    res.json({
      success: true,
      message: 'Session stopped successfully'
    });
  } catch (error) {
    logger.error(`Failed to stop streaming session: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to stop streaming session'
    });
  }
});

app.get('/api/streaming/sessions', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user.id;
  const userSessions = Array.from(activeSessions.values())
    .filter(session => session.userId === userId)
    .map(session => ({
      sessionId: session.sessionId,
      status: session.status,
      vncPort: session.vncPort,
      sunshinePort: session.sunshinePort,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }));

  res.json({
    success: true,
    sessions: userSessions
  });
});

app.get('/api/streaming/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    activeSessions: activeSessions.size,
    availablePorts: portPool.size,
    uptime: process.uptime()
  });
});

// WebSocket handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined room`);
  });

  socket.on('session-heartbeat', (sessionId) => {
    const session = activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Cleanup inactive sessions
setInterval(async () => {
  const now = new Date();
  const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

  for (const [sessionId, session] of activeSessions.entries()) {
    const timeSinceActivity = now.getTime() - session.lastActivity.getTime();
    
    if (timeSinceActivity > inactiveThreshold) {
      logger.info(`Cleaning up inactive session: ${sessionId}`);
      try {
        await stopUserContainer(sessionId);
      } catch (error) {
        logger.error(`Failed to cleanup session ${sessionId}: ${error}`);
      }
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  
  // Stop all active sessions
  for (const sessionId of activeSessions.keys()) {
    try {
      await stopUserContainer(sessionId);
    } catch (error) {
      logger.error(`Failed to stop session during shutdown: ${error}`);
    }
  }
  
  await redis.quit();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 7003;
server.listen(PORT, () => {
  logger.info(`Streaming Orchestrator running on port ${PORT}`);
});

// Connect to Redis
redis.connect().catch(console.error); 