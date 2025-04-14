const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all maintenance records (empty array if no workspace access)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get workspace ID from query parameter or user's current workspace
    const workspaceId = req.query.workspaceId || 
                        (req.user && req.user.currentWorkspaceId);
    
    // If no workspace ID is provided and user doesn't have a current workspace,
    // return an empty array
    if (!workspaceId) {
      console.log('[API] No workspace ID provided or found for user. Returning empty maintenance array.');
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

    // Get maintenance records for puzzles in games in the workspace
    const maintenanceRecords = await prisma.maintenance.findMany({
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
    
    console.log(`[API] Returning ${maintenanceRecords.length} maintenance records for workspace ${workspaceId}`);
    res.json(maintenanceRecords);
  } catch (error) {
    console.error('[API] Error fetching maintenance records:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET a single maintenance record by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const maintenanceRecord = await prisma.maintenance.findUnique({
      where: { id: Number(id) },
      include: {
        puzzle: {
          include: {
            game: true
          }
        }
      }
    });

    if (!maintenanceRecord) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    res.json(maintenanceRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new maintenance record
router.post('/',
  [
    body('description').notEmpty().withMessage('Description is required'),
    body('fixDate').isISO8601().withMessage('Fix date must be a valid date'),
    body('puzzleId').isInt().withMessage('Puzzle ID must be an integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { description, status, fixDate, puzzleId } = req.body;
      const newRecord = await prisma.maintenance.create({
        data: {
          description,
          status: status || 'planned',
          fixDate: new Date(fixDate),
          puzzleId: Number(puzzleId)
        }
      });
      res.status(201).json(newRecord);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT update a maintenance record
router.put('/:id',
  [
    param('id').isInt().withMessage('Maintenance ID must be an integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { description, status, fixDate } = req.body;
      
      const updatedRecord = await prisma.maintenance.update({
        where: { id: Number(id) },
        data: {
          description,
          status,
          fixDate: fixDate ? new Date(fixDate) : undefined
        }
      });
      
      res.json(updatedRecord);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Maintenance record not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE a maintenance record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.maintenance.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 