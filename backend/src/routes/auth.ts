import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Register new user with invite code
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, inviteCode } = req.body;

  // Verify invite code
  const invite = await prisma.invite.findUnique({
    where: { code: inviteCode, used: false }
  });

  if (!invite) {
    return res.status(400).json({ error: 'Invalid or used invite code' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    }
  });

  // Mark invite as used
  await prisma.invite.update({
    where: { id: invite.id },
    data: { used: true, usedById: user.id }
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  res.json({ token });
}));

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  res.json({ token });
}));

// Generate invite code (protected route)
router.post('/invite', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const userId = req.user.id;
  const inviteCode = Math.random().toString(36).substring(2, 15);
  
  await prisma.invite.create({
    data: {
      code: inviteCode,
      used: false,
      createdById: userId
    }
  });

  res.json({ inviteCode });
}));

export default router; 