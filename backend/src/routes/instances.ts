import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { spawn, ChildProcess } from 'child_process';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

interface Instance {
  id: string;
  userId: string;
  status: string;
  containerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
router.post('/start', authenticateToken, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userId = req.user.id;
  
  let instance;
  try {
    // Check if instance exists
    instance = await prisma.instance.findUnique({
      where: { userId }
    });

    if (instance?.status === 'running') {
      return res.status(400).json({ error: 'Instance is already running' });
    }

    // Create or update instance
    instance = await prisma.instance.upsert({
      where: { userId },
      update: { status: 'starting', containerId: null },
      create: {
        userId,
        status: 'starting',
        containerId: null,
      }
    });

    // Start Docker container
    const containerName = `steam-${userId}`;
    
    // First check if container exists
    const checkContainer = spawn('docker', ['ps', '-a', '--filter', `name=${containerName}`, '--format', '{{.ID}}']);
    
    let containerId = '';
    checkContainer.stdout.on('data', (data) => {
      containerId = data.toString().trim();
    });

    let errorOutput = '';
    checkContainer.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    const updatedInstance = await new Promise((resolve, reject) => {
      checkContainer.on('error', (error) => {
        console.error('Container check error:', error);
        reject(new Error(`Failed to check container: ${error.message}`));
      });

      checkContainer.on('close', async (code) => {
        if (code !== 0) {
          console.error(`Container check failed with code ${code}`);
          console.error('Error output:', errorOutput);
          reject(new Error(`Container check failed with code ${code}. Error: ${errorOutput}`));
          return;
        }

        try {
          if (containerId) {
            // Container exists, try to remove it first
            const removeContainer = spawn('docker', ['rm', '-f', containerName]);
            await new Promise((resolveRemove, rejectRemove) => {
              removeContainer.on('error', rejectRemove);
              removeContainer.on('close', (code) => {
                if (code === 0) {
                  resolveRemove(null);
                } else {
                  rejectRemove(new Error(`Failed to remove container: exit code ${code}`));
                }
              });
            });
          }

          // Start new container
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
            // Map Moonlight TCP ports
            '-p', '7400:47989/tcp',
            '-p', '7401:47990/tcp',
            '-p', '7402:47991/tcp',
            '-p', '7403:47992/tcp',
            '-p', '7404:47993/tcp',
            '-p', '7405:47994/tcp',
            '-p', '7406:47995/tcp',
            '-p', '7407:47996/tcp',
            '-p', '7408:47997/tcp',
            '-p', '7409:47998/tcp',
            '-p', '7410:47999/tcp',
            '-p', '7411:48000/tcp',
            // Map Moonlight UDP ports
            '-p', '7400:47989/udp',
            '-p', '7401:47990/udp',
            '-p', '7402:47991/udp',
            '-p', '7403:47992/udp',
            '-p', '7404:47993/udp',
            '-p', '7405:47994/udp',
            '-p', '7406:47995/udp',
            '-p', '7407:47996/udp',
            '-p', '7408:47997/udp',
            '-p', '7409:47998/udp',
            '-p', '7410:47999/udp',
            '-p', '7411:48000/udp',
            // VNC port
            '-p', '7301-7399:5900',  // VNC ports for user instances
            'cloud-gaming-steam'
          ]);

          let startErrorOutput = '';
          startContainer.stderr.on('data', (data) => {
            startErrorOutput += data.toString();
          });

          startContainer.on('error', async (error) => {
            console.error('Container start error:', error);
            try {
              await prisma.instance.update({
                where: { id: instance!.id },
                data: { status: 'error' }
              });
              reject(error);
            } catch (dbError) {
              console.error('Database update error:', dbError);
              reject(dbError);
            }
          });

          startContainer.on('close', async (code) => {
            try {
              if (code === 0) {
                const updatedInstance = await prisma.instance.update({
                  where: { id: instance!.id },
                  data: {
                    status: 'running',
                    containerId: containerName
                  }
                });
                resolve(updatedInstance);
              } else {
                console.error(`Container exited with code ${code}`);
                console.error('Container error output:', startErrorOutput);
                await prisma.instance.update({
                  where: { id: instance!.id },
                  data: { status: 'error' }
                });
                reject(new Error(`Container start failed with code ${code}. Error: ${startErrorOutput}`));
              }
            } catch (dbError) {
              console.error('Database update error:', dbError);
              reject(dbError);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    res.json(updatedInstance);

  } catch (error) {
    console.error('Start instance error:', error);
    // Try to update instance status to error if possible
    if (instance?.id) {
      try {
        await prisma.instance.update({
          where: { id: instance.id },
          data: { status: 'error' }
        });
      } catch (dbError) {
        console.error('Failed to update instance status:', dbError);
      }
    }
    next(error);
  }
}));

// Stop instance
router.post('/stop', authenticateToken, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  let instance: Instance | null = null;
  try {
    const userId = req.user.id;
    instance = await prisma.instance.findUnique({
      where: { userId }
    });

    if (!instance || !instance.containerId) {
      return res.status(404).json({ error: 'No running instance found' });
    }

    if (instance.status === 'stopped') {
      return res.status(400).json({ error: 'Instance is already stopped' });
    }

    const updatedInstance = await new Promise<Instance>((resolve, reject) => {
      // Stop Docker container
      const stopContainer = spawn('docker', ['stop', instance!.containerId!]);
      
      let errorOutput = '';
      stopContainer.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      // Handle container stop errors
      stopContainer.on('error', async (error: Error) => {
        console.error('Container stop error:', error);
        try {
          await prisma.instance.update({
            where: { id: instance!.id },
            data: { status: 'error' }
          });
        } catch (dbError) {
          console.error('Database update error:', dbError);
        }
        reject(error);
      });

      // Handle container close
      stopContainer.on('close', async (code: number) => {
        try {
          if (code === 0) {
            const updatedInstance = await prisma.instance.update({
              where: { id: instance!.id },
              data: { status: 'stopped' }
            });
            resolve(updatedInstance);
          } else {
            console.error(`Container stop exited with code ${code}`);
            console.error('Container error output:', errorOutput);
            await prisma.instance.update({
              where: { id: instance!.id },
              data: { status: 'error' }
            });
            reject(new Error(`Container stop failed with code ${code}. Error: ${errorOutput}`));
          }
        } catch (dbError) {
          console.error('Database update error:', dbError);
          reject(dbError);
        }
      });
    });

    res.json(updatedInstance);
  } catch (error) {
    console.error('Stop instance error:', error);
    // Try to update instance status to error if possible
    if (instance?.id) {
      try {
        await prisma.instance.update({
          where: { id: instance.id },
          data: { status: 'error' }
        });
      } catch (dbError) {
        console.error('Failed to update instance status:', dbError);
      }
    }
    next(error);
  }
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