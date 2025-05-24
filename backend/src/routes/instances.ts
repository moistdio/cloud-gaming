import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { spawn } from 'child_process';

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

const router = express.Router();
const prisma = new PrismaClient();

// Get user's instance
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const instance = await prisma.instance.findUnique({
      where: { userId }
    });
    res.json(instance);
  } catch (error) {
    console.error('Error fetching instance:', error);
    res.status(500).json({ error: 'Error fetching instance' });
  }
});

// Start instance
router.post('/start', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
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

      startContainer.on('close', async (code) => {
        if (code === 0) {
          await prisma.instance.update({
            where: { id: instance!.id },
            data: {
              status: 'running',
              containerId: containerName
            }
          });
        } else {
          await prisma.instance.update({
            where: { id: instance!.id },
            data: { status: 'error' }
          });
        }
      });
    }

    res.json(instance);
  } catch (error) {
    console.error('Error starting instance:', error);
    res.status(500).json({ error: 'Error starting instance' });
  }
});

// Stop instance
router.post('/stop', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const instance = await prisma.instance.findUnique({
      where: { userId }
    });

    if (!instance || !instance.containerId) {
      return res.status(404).json({ error: 'No running instance found' });
    }

    // Stop Docker container
    const stopContainer = spawn('docker', ['stop', instance.containerId]);
    
    stopContainer.on('close', async (code) => {
      if (code === 0) {
        await prisma.instance.update({
          where: { id: instance.id },
          data: { status: 'stopped' }
        });
        res.json({ status: 'stopped' });
      } else {
        res.status(500).json({ error: 'Error stopping instance' });
      }
    });
  } catch (error) {
    console.error('Error stopping instance:', error);
    res.status(500).json({ error: 'Error stopping instance' });
  }
});

// Get instance status
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const instance = await prisma.instance.findUnique({
      where: { userId },
      select: { status: true, containerId: true }
    });
    res.json(instance);
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Error fetching status' });
  }
});

export default router; 