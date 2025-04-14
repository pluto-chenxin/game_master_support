const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all reports
router.get('/', requireAuth, async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 10, 
      sortOrder = 'desc',
      search = '',
      workspaceId
    } = req.query;
    
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Base query
    const whereClause = {};
    
    // Add workspace filter if provided or from user context
    const requestWorkspaceId = workspaceId || (req.user && req.user.currentWorkspaceId);
    if (requestWorkspaceId) {
      // Join through games to filter by workspace
      whereClause.game = {
        workspaceId: Number(requestWorkspaceId)
      };
    }
    
    // Add status filter if provided
    if (status && ['open', 'in-progress', 'resolved'].includes(status)) {
      whereClause.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count for pagination
    const totalReports = await prisma.report.count({
      where: whereClause
    });
    
    // Get paginated reports
    const reports = await prisma.report.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        reportDate: true,
        status: true,
        resolution: true,
        resolvedAt: true,
        gameId: true,
        puzzleId: true,
        createdAt: true,
        updatedAt: true,
        images: true,
        priority: true,
        game: { select: { name: true, workspaceId: true } },
        puzzle: { select: { title: true } }
      },
      orderBy: { reportDate: sortOrder },
      skip,
      take
    });
    
    // Log all reports with their priorities for debugging
    console.log("Reports being sent to client:", reports.map(r => ({
      id: r.id,
      title: r.title,
      priority: r.priority
    })));
    
    // Return paginated results with metadata
    res.json({
      reports,
      total: totalReports,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(totalReports / take)
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET reports for a specific game
router.get('/game/:gameId', requireAuth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { 
      status, 
      page = 1, 
      limit = 10, 
      sortOrder = 'desc',
      search = '' 
    } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Base query for game
    const whereClause = { gameId: Number(gameId) };
    
    // Add status filter if provided
    if (status && ['open', 'in-progress', 'resolved'].includes(status)) {
      whereClause.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count for pagination
    const totalReports = await prisma.report.count({
      where: whereClause
    });
    
    // Get paginated reports
    const reports = await prisma.report.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        reportDate: true,
        status: true,
        resolution: true,
        resolvedAt: true,
        gameId: true,
        puzzleId: true,
        createdAt: true,
        updatedAt: true,
        images: true,
        priority: true,
        puzzle: { select: { title: true } }
      },
      orderBy: { reportDate: sortOrder },
      skip,
      take
    });
    
    // Return paginated results with metadata
    res.json({
      reports,
      total: totalReports,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(totalReports / take)
    });
  } catch (error) {
    console.error('Error fetching game reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET reports for a specific puzzle
router.get('/puzzle/:puzzleId', requireAuth, async (req, res) => {
  try {
    const { puzzleId } = req.params;
    const { 
      status, 
      page = 1, 
      limit = 10, 
      sortOrder = 'desc',
      search = '' 
    } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Base query for puzzle
    const whereClause = { puzzleId: Number(puzzleId) };
    
    // Add status filter if provided
    if (status && ['open', 'in-progress', 'resolved'].includes(status)) {
      whereClause.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Get total count for pagination
    const totalReports = await prisma.report.count({
      where: whereClause
    });
    
    // Get paginated reports
    const reports = await prisma.report.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        reportDate: true,
        status: true,
        resolution: true,
        resolvedAt: true,
        gameId: true,
        puzzleId: true,
        createdAt: true,
        updatedAt: true,
        images: true,
        priority: true,
        game: { select: { name: true } }
      },
      orderBy: { reportDate: sortOrder },
      skip,
      take
    });
    
    // Return paginated results with metadata
    res.json({
      reports,
      total: totalReports,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(totalReports / take)
    });
  } catch (error) {
    console.error('Error fetching puzzle reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET report statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const { range, workspaceId } = req.query;
    let startDate = new Date();
    
    // Calculate the date range
    switch (range) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // Default to 30 days if invalid range
        startDate.setDate(startDate.getDate() - 30);
    }

    // Base query
    const whereClause = {
      reportDate: { gte: startDate }
    };

    // Add workspace filter if provided or from user context
    const requestWorkspaceId = workspaceId || (req.user && req.user.currentWorkspaceId);
    if (requestWorkspaceId) {
      whereClause.game = {
        workspaceId: Number(requestWorkspaceId)
      };
    }

    // Get reports within the date range
    const reports = await prisma.report.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        reportDate: true,
        status: true,
        gameId: true,
        puzzleId: true,
        images: true,
        game: { select: { name: true, workspaceId: true } },
        puzzle: { select: { title: true, id: true } }
      }
    });

    // Structure for game-based statistics
    const gameStats = {};

    // Process reports into statistics
    reports.forEach(report => {
      const gameId = report.gameId;
      
      if (!gameStats[gameId]) {
        gameStats[gameId] = {
          gameId,
          gameName: report.game.name,
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
          puzzles: {}
        };
      }
      
      // Increment game counters
      gameStats[gameId].total++;
      if (report.status === 'open') {
        gameStats[gameId].open++;
      } else if (report.status === 'in-progress') {
        gameStats[gameId].inProgress++;
      } else if (report.status === 'resolved') {
        gameStats[gameId].resolved++;
      }

      // If report is for a puzzle, track puzzle stats too
      if (report.puzzleId) {
        const puzzleId = report.puzzleId;
        
        if (!gameStats[gameId].puzzles[puzzleId]) {
          gameStats[gameId].puzzles[puzzleId] = {
            id: puzzleId,
            title: report.puzzle.title,
            total: 0,
            open: 0,
            inProgress: 0,
            resolved: 0
          };
        }
        
        // Increment puzzle counters
        gameStats[gameId].puzzles[puzzleId].total++;
        if (report.status === 'open') {
          gameStats[gameId].puzzles[puzzleId].open++;
        } else if (report.status === 'in-progress') {
          gameStats[gameId].puzzles[puzzleId].inProgress++;
        } else if (report.status === 'resolved') {
          gameStats[gameId].puzzles[puzzleId].resolved++;
        }
      }
    });

    // Convert to array and format puzzles as arrays
    const formattedStats = Object.values(gameStats).map(game => {
      game.puzzles = Object.values(game.puzzles);
      return game;
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Error generating report statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET a specific report by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Set no-cache headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        title: true,
        description: true,
        reportDate: true,
        status: true,
        resolution: true,
        resolvedAt: true,
        gameId: true,
        puzzleId: true,
        createdAt: true,
        updatedAt: true,
        images: true,
        priority: true,
        game: { select: { name: true } },
        puzzle: { select: { title: true } }
      }
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    console.log(`GET report ${id} details:`, {
      id: report.id,
      title: report.title,
      priority: report.priority
    });
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE a new report
router.post('/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('gameId').isInt().withMessage('Game ID must be an integer'),
    body('puzzleId').optional().isInt().withMessage('Puzzle ID must be an integer if provided'),
    body('reportDate').optional().isISO8601().withMessage('Report date must be a valid date'),
    body('imageUrls').optional().isArray().withMessage('Image URLs must be an array'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high')
  ],
  async (req, res) => {
    try {
      // First validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        console.log('Request body:', req.body);
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, gameId, puzzleId, reportDate, imageUrls, priority = 'high' } = req.body;
      console.log('Creating report with data:', { title, description, gameId, puzzleId, reportDate, imageUrls, priority });
      
      // Verify game exists
      const game = await prisma.game.findUnique({
        where: { id: Number(gameId) }
      });
      
      if (!game) {
        console.log(`Game with ID ${gameId} not found`);
        return res.status(404).json({ message: 'Game not found' });
      }
      
      // Verify puzzle exists if provided
      if (puzzleId) {
        const puzzle = await prisma.puzzle.findUnique({
          where: { id: Number(puzzleId) }
        });
        
        if (!puzzle) {
          console.log(`Puzzle with ID ${puzzleId} not found`);
          return res.status(404).json({ message: 'Puzzle not found' });
        }
        
        // Verify puzzle belongs to the specified game
        if (puzzle.gameId !== Number(gameId)) {
          console.log(`Puzzle ${puzzleId} does not belong to game ${gameId}`);
          return res.status(400).json({ message: 'Puzzle does not belong to the specified game' });
        }
      }
      
      // Create the report and its images in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create the report
        const report = await prisma.report.create({
          data: {
            title,
            description,
            reportDate: reportDate ? new Date(reportDate) : new Date(),
            status: 'open',
            priority: priority || 'high',
            gameId: Number(gameId),
            puzzleId: puzzleId ? Number(puzzleId) : null,
          }
        });
        
        // Create report images if provided
        if (imageUrls && imageUrls.length > 0) {
          await prisma.reportImage.createMany({
            data: imageUrls.map(imageUrl => ({
              imageUrl,
              reportId: report.id
            }))
          });
        }
        
        // Return the created report with its images
        return await prisma.report.findUnique({
          where: { id: report.id },
          include: {
            images: true
          }
        });
      });
      
      console.log('Report created successfully with ID:', result.id);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating report:', error.message);
      if (error.name === 'PrismaClientValidationError') {
        return res.status(400).json({ error: 'Invalid data format. Please check your input.' });
      }
      res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
  }
);

// UPDATE a report
router.put('/:id',
  [
    param('id').isInt().withMessage('Report ID must be an integer'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('status').optional().isIn(['open', 'in-progress', 'resolved']).withMessage('Status must be open, in-progress, or resolved'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('resolution').optional(),
    body('reportDate').optional().isISO8601().withMessage('Report date must be a valid date'),
    body('imageUrls').optional().isArray().withMessage('Image URLs must be an array')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const reportId = Number(id);
      const { title, description, status, priority, resolution, reportDate, imageUrls } = req.body;
      
      console.log('Updating report:', reportId, 'with data:', { title, description, status, priority, resolution, reportDate });
      
      // Check if report exists
      const existingReport = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          images: true
        }
      });
      
      if (!existingReport) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      // Update the report and its images in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Prepare update data for the report
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (reportDate !== undefined) updateData.reportDate = new Date(reportDate);
        if (priority !== undefined) updateData.priority = priority;
        
        console.log('Update data being applied:', updateData);
        
        // Handle status change and resolution
        if (status !== undefined) {
          updateData.status = status;
          
          // If status is changing to resolved, set resolvedAt date
          if (status === 'resolved' && existingReport.status !== 'resolved') {
            updateData.resolvedAt = new Date();
          }
          
          // If status is changing from resolved, clear resolvedAt
          if (status !== 'resolved' && existingReport.status === 'resolved') {
            updateData.resolvedAt = null;
          }
        }
        
        if (resolution !== undefined) {
          updateData.resolution = resolution;
        }
        
        // Update the report
        const updatedReport = await prisma.report.update({
          where: { id: reportId },
          data: updateData
        });
        
        // Update report images if provided
        if (imageUrls !== undefined) {
          // Delete all existing images
          await prisma.reportImage.deleteMany({
            where: { reportId }
          });
          
          // Create new images if there are any
          if (imageUrls && imageUrls.length > 0) {
            await prisma.reportImage.createMany({
              data: imageUrls.map(imageUrl => ({
                imageUrl,
                reportId
              }))
            });
          }
        }
        
        // Return the updated report with its images
        return await prisma.report.findUnique({
          where: { id: reportId },
          include: {
            images: true
          }
        });
      });
      
      console.log('Report updated successfully:', { 
        id: result.id, 
        status: result.status, 
        priority: result.priority 
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE a report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reportId = Number(id);
    
    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Delete the report
    await prisma.report.delete({
      where: { id: reportId }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 