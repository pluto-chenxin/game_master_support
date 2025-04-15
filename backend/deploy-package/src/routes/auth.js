const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Register new user
router.post(
  '/register',
  [
    // Validation rules
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'USER' // Default role
        }
      });

      // Create default workspace for new user if it's the first user
      const usersCount = await prisma.user.count();
      if (usersCount === 1) {
        const workspace = await prisma.workspace.create({
          data: {
            name: 'Default Workspace',
            description: 'Default workspace created automatically',
            users: {
              create: {
                userId: newUser.id,
                role: 'SUPER_ADMIN' // First user is super admin
              }
            }
          }
        });
      }

      // Generate JWT token
      const token = generateToken(newUser.id);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          workspaces: {
            include: {
              workspace: true
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = generateToken(user.id);

      // Format workspaces for response
      const workspaces = user.workspaces.map(uw => ({
        id: uw.workspace.id,
        name: uw.workspace.name,
        description: uw.workspace.description,
        role: uw.role
      }));

      // Remove password from response
      const { password: _, workspaces: __, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        workspaces,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get current user (requires authentication)
router.get('/me', requireAuth, async (req, res) => {
  try {
    // Find user with workspaces
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        workspaces: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format workspaces for response
    const workspaces = user.workspaces.map(uw => ({
      id: uw.workspace.id,
      name: uw.workspace.name,
      description: uw.workspace.description,
      role: uw.role
    }));

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      workspaces
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 