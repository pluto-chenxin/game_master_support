const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all hints (empty array if no workspace access)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get workspace ID from query parameter or user's current workspace
    const workspaceId = req.query.workspaceId || 
                        (req.user && req.user.currentWorkspaceId);
    
    // If no workspace ID is provided and user doesn't have a current workspace,
    // return an empty array
    if (!workspaceId) {
      console.log('[API] No workspace ID provided or found for user. Returning empty hints array.');
      return res.json([]);
    }

    // Check if user has access to this workspace
    const userHasAccess = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: Number(workspaceId)
        }
      }
    });

    if (!userHasAccess) {
      console.log(`[API] User ${req.user.id} doesn't have access to workspace ${workspaceId}`);
      return res.json([]);
    }

    // Get hints for puzzles in games in the workspace
    const hints = await prisma.hint.findMany({
      include: {
        puzzle: {
          include: {
            game: true
          }
        }
      },
      where: {
        puzzle: {
          game: {
            workspaceId: Number(workspaceId)
          }
        }
      }
    });
    
    console.log(`[API] Returning ${hints.length} hints for workspace ${workspaceId}`);
    res.json(hints);
  } catch (error) {
    console.error('[API] Error fetching hints:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET a single hint by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hint = await prisma.hint.findUnique({
      where: { id: Number(id) },
      include: {
        puzzle: {
          include: {
            game: true
          }
        }
      }
    });

    if (!hint) {
      return res.status(404).json({ message: 'Hint not found' });
    }

    res.json(hint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new hint
router.post('/',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('puzzleId').isInt().withMessage('Puzzle ID must be an integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { content, isPremium, isUsed, puzzleId } = req.body;
      const newHint = await prisma.hint.create({
        data: {
          content,
          isPremium: isPremium || false,
          isUsed: isUsed || false,
          puzzleId: Number(puzzleId)
        }
      });
      res.status(201).json(newHint);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT update a hint
router.put('/:id',
  [
    param('id').isInt().withMessage('Hint ID must be an integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { content, isPremium, isUsed } = req.body;
      
      const updatedHint = await prisma.hint.update({
        where: { id: Number(id) },
        data: {
          content,
          isPremium,
          isUsed
        }
      });
      
      res.json(updatedHint);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Hint not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE a hint
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.hint.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Hint not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 