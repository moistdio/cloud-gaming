import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// Register new user with invite code
router.post('/register', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

// Generate invite code (protected route)
router.post('/invite', async (req, res) => {
  try {
    const inviteCode = Math.random().toString(36).substring(2, 15);
    
    await prisma.invite.create({
      data: {
        code: inviteCode,
        used: false
      }
    });

    res.json({ inviteCode });
  } catch (error) {
    console.error('Invite generation error:', error);
    res.status(500).json({ error: 'Error generating invite code' });
  }
});

export default router; 