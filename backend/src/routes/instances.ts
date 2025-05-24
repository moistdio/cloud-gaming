import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { spawn } from 'child_process';

const router = express.Router();
const prisma = new PrismaClient();

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get user's instance
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userId = req.user.id;
  const instance = await prisma.instance.findUnique({
    where: { userId }
  });
  res.json(instance);
}));

// Start instance
router.post('/start', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userId = req.user.id;
  
  // Check if instance exists
  let instance = await prisma.instance.findUnique({
    where: { userId }
  });

  if (!instance) {
    // Create new instance
    instance = await prisma.instance.create({
      data: {
        userId,
        status: 'starting',
        containerId: '',
      }
    });

    // Start Docker container
    const containerName = `steam-${userId}`;
    const startContainer = spawn('docker', [
      'run',
      '-d',
      '--name', containerName,
      '--gpus', 'all',
      '--privileged',
      '-e', 'DISPLAY=:0',
      '-e', 'NVIDIA_VISIBLE_DEVICES=all',
      '-e', 'NVIDIA_DRIVER_CAPABILITIES=all',
      '-e', 'PULSE_SERVER=unix:/run/user/1000/pulse/native',
      '--group-add', 'input',
      '--device=/dev/input:/dev/input',
      '--device=/dev/nvidia0:/dev/nvidia0',
      '--device=/dev/nvidiactl:/dev/nvidiactl',
      '--device=/dev/nvidia-modeset:/dev/nvidia-modeset',
      '--device=/dev/nvidia-uvm:/dev/nvidia-uvm',
      '--device=/dev/nvidia-uvm-tools:/dev/nvidia-uvm-tools',
      '-v', `${containerName}-home:/home/steam`,
      '-v', '/tmp/.X11-unix:/tmp/.X11-unix',
      '-v', '/run/user/1000/pulse:/run/user/1000/pulse',
      '-p', '47989-48000:47989-48000/tcp',
      '-p', '47989-48000:47989-48000/udp',
      '-p', '5900:5900',
      'steam-sunshine-image'
    ]);

    // Handle container start errors
    startContainer.on('error', async (error) => {
      console.error('Container start error:', error);
      try {
        await prisma.instance.update({
          where: { id: instance!.id },
          data: { status: 'error' }
        });
      } catch (dbError) {
        console.error('Database update error:', dbError);
        throw dbError;
      }
    });

    // Handle container close
    startContainer.on('close', async (code) => {
      try {
        if (code === 0) {
          await prisma.instance.update({
            where: { id: instance!.id },
            data: {
              status: 'running',
              containerId: containerName
            }
          });
        } else {
          console.error(`Container exited with code ${code}`);
          await prisma.instance.update({
            where: { id: instance!.id },
            data: { status: 'error' }
          });
        }
      } catch (dbError) {
        console.error('Database update error:', dbError);
        throw dbError;
      }
    });
  }

  res.json(instance);
}));

// Stop instance
router.post('/stop', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userId = req.user.id;
  const instance = await prisma.instance.findUnique({
    where: { userId }
  });

  if (!instance || !instance.containerId) {
    return res.status(404).json({ error: 'No running instance found' });
  }

  // Stop Docker container
  const stopContainer = spawn('docker', ['stop', instance.containerId]);
  
  // Handle container stop errors
  stopContainer.on('error', async (error) => {
    console.error('Container stop error:', error);
    throw error;
  });

  // Handle container close
  stopContainer.on('close', async (code) => {
    try {
      if (code === 0) {
        await prisma.instance.update({
          where: { id: instance.id },
          data: { status: 'stopped' }
        });
        res.json({ status: 'stopped' });
      } else {
        console.error(`Container stop exited with code ${code}`);
        throw new Error(`Container stop failed with code ${code}`);
      }
    } catch (dbError) {
      console.error('Database update error:', dbError);
      throw dbError;
    }
  });
}));

// Get instance status
router.get('/status', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userId = req.user.id;
  const instance = await prisma.instance.findUnique({
    where: { userId },
    select: { status: true, containerId: true }
  });
  res.json(instance);
}));

export default router; 