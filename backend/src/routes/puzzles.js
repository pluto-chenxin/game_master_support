const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// GET all puzzles
router.get('/', async (req, res) => {
  try {
    const puzzles = await prisma.puzzle.findMany({
      include: {
        game: true,
        _count: {
          select: { hints: true, maintenance: true }
        }
      }
    });
    res.json(puzzles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET a single puzzle by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const puzzle = await prisma.puzzle.findUnique({
      where: { id: Number(id) },
      include: {
        game: true,
        hints: true,
        maintenance: true
      }
    });

    if (!puzzle) {
      return res.status(404).json({ message: 'Puzzle not found' });
    }

    res.json(puzzle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new puzzle
router.post('/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('gameId').isInt().withMessage('Game ID must be an integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, status, difficulty, gameId, imageUrl } = req.body;
      const newPuzzle = await prisma.puzzle.create({
        data: {
          title,
          description: description || '',
          status: status || 'active',
          difficulty: difficulty || 1,
          gameId: Number(gameId),
          imageUrl
        }
      });
      res.status(201).json(newPuzzle);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT update a puzzle
router.put('/:id',
  [
    param('id').isInt().withMessage('Puzzle ID must be an integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { title, description, status, difficulty, imageUrl } = req.body;
      
      const updatedPuzzle = await prisma.puzzle.update({
        where: { id: Number(id) },
        data: {
          title,
          description,
          status,
          difficulty: difficulty ? Number(difficulty) : undefined,
          imageUrl
        }
      });
      
      res.json(updatedPuzzle);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Puzzle not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE a puzzle
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.puzzle.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Puzzle not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET all hints for a puzzle
router.get('/:id/hints', async (req, res) => {
  try {
    const { id } = req.params;
    const hints = await prisma.hint.findMany({
      where: { puzzleId: Number(id) }
    });
    res.json(hints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all maintenance records for a puzzle
router.get('/:id/maintenance', async (req, res) => {
  try {
    const { id } = req.params;
    const maintenance = await prisma.maintenance.findMany({
      where: { puzzleId: Number(id) }
    });
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 