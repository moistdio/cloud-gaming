import express, { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Register new user with invite code
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, inviteCode } = req.body;

  if (!email || !password || !inviteCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify invite code
    const invite = await prisma.invite.findUnique({
      where: { code: inviteCode },
      select: {
        id: true,
        used: true
      }
    });

    if (!invite || invite.used) {
      return res.status(400).json({ error: 'Invalid or used invite code' });
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and update invite in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
        }
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { used: true, usedById: user.id }
      });

      return user;
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: result.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}));

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true
      }
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
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}));

// Generate invite code (protected route)
router.post('/invite', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userId = req.user.id;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate a unique invite code
    let inviteCode;
    let existingInvite;
    do {
      inviteCode = Math.random().toString(36).substring(2, 15);
      existingInvite = await prisma.invite.findUnique({
        where: { code: inviteCode },
        select: { id: true }
      });
    } while (existingInvite);
    
    const invite = await prisma.invite.create({
      data: {
        code: inviteCode,
        used: false,
        createdById: userId
      }
    });

    res.json({ inviteCode: invite.code });
  } catch (error) {
    console.error('Invite generation error:', error);
    throw error;
  }
}));

export default router; 