const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all games (filtered by workspace if authenticated)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get workspace ID from query parameter or user's current workspace
    const workspaceId = req.query.workspaceId || 
                        (req.user && req.user.currentWorkspaceId);
    
    // If no workspace ID is provided and user doesn't have a current workspace,
    // return an empty array
    if (!workspaceId) {
      console.log('[API] No workspace ID provided or found for user. Returning empty games array.');
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

    // Get games for the workspace
    const games = await prisma.game.findMany({
      where: { workspaceId: Number(workspaceId) },
      include: {
        _count: {
          select: { puzzles: true }
        }
      }
    });
    
    console.log(`[API] Returning ${games.length} games for workspace ${workspaceId}`);
    res.json(games);
  } catch (error) {
    console.error('[API] Error fetching games:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET a single game by ID (checking workspace access)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const game = await prisma.game.findUnique({
      where: { id: Number(id) },
      include: {
        puzzles: {
          include: {
            _count: {
              select: { hints: true, maintenance: true }
            }
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user has access to this game's workspace
    if (req.user && req.user.currentWorkspaceId !== game.workspaceId) {
      return res.status(403).json({ message: 'You do not have access to this game' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new game
router.post('/',
  [
    requireAuth,
    body('name').notEmpty().withMessage('Name is required'),
    body('genre').notEmpty().withMessage('Genre is required'),
    body('workspaceId').optional().isInt().withMessage('Workspace ID must be an integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, genre, releaseDate, purchaseDate, description, imageUrl, workspaceId } = req.body;
      
      // Get workspace ID from request, body, or user's current workspace
      const gameWorkspaceId = workspaceId || 
                             (req.query.workspaceId) || 
                             (req.user && req.user.currentWorkspaceId);
      
      if (!gameWorkspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required' });
      }

      // Check if user has access to this workspace
      // This is a simplified check. In a real app, you'd use the more robust requireWorkspaceAccess middleware
      const userWorkspace = await prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId: Number(gameWorkspaceId)
          }
        }
      });

      if (!userWorkspace) {
        return res.status(403).json({ error: 'You do not have access to this workspace' });
      }

      const newGame = await prisma.game.create({
        data: {
          name,
          genre,
          releaseDate: releaseDate ? new Date(releaseDate) : null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          description,
          imageUrl,
          workspaceId: Number(gameWorkspaceId)
        }
      });
      res.status(201).json(newGame);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT update a game
router.put('/:id',
  [
    requireAuth,
    param('id').isInt().withMessage('Game ID must be an integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      
      // First check if game exists and user has access
      const existingGame = await prisma.game.findUnique({
        where: { id: Number(id) }
      });

      if (!existingGame) {
        return res.status(404).json({ message: 'Game not found' });
      }

      // Check workspace access
      const userWorkspace = await prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId: existingGame.workspaceId
          }
        }
      });

      if (!userWorkspace) {
        return res.status(403).json({ error: 'You do not have access to this game' });
      }

      const { name, genre, releaseDate, purchaseDate, description, imageUrl } = req.body;
      
      const updatedGame = await prisma.game.update({
        where: { id: Number(id) },
        data: {
          name,
          genre,
          releaseDate: releaseDate ? new Date(releaseDate) : null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          description,
          imageUrl
        }
      });
      
      res.json(updatedGame);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Game not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE a game
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if game exists and user has access
    const game = await prisma.game.findUnique({
      where: { id: Number(id) }
    });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check workspace access
    const userWorkspace = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: game.workspaceId
        }
      }
    });

    if (!userWorkspace) {
      return res.status(403).json({ error: 'You do not have access to this game' });
    }
    
    await prisma.game.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET all puzzles for a game
router.get('/:id/puzzles', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if game exists and user has access
    const game = await prisma.game.findUnique({
      where: { id: Number(id) }
    });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check workspace access
    const userWorkspace = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: game.workspaceId
        }
      }
    });

    if (!userWorkspace) {
      return res.status(403).json({ error: 'You do not have access to this game' });
    }
    
    const puzzles = await prisma.puzzle.findMany({
      where: { gameId: Number(id) },
      include: {
        hints: true,
        maintenance: true
      }
    });
    res.json(puzzles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 