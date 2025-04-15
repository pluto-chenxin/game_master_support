const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// GET all images for a puzzle
router.get('/puzzle/:puzzleId', async (req, res) => {
  try {
    const { puzzleId } = req.params;
    const images = await prisma.puzzleImage.findMany({
      where: { puzzleId: Number(puzzleId) },
      orderBy: { isPrimary: 'desc' } // Primary images first
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new images for a puzzle
router.post('/', 
  [
    body('puzzleId').isInt().withMessage('Puzzle ID must be an integer'),
    body('images').isArray().withMessage('Images must be an array')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { puzzleId, images } = req.body;
      
      // Get current images count
      const currentImages = await prisma.puzzleImage.findMany({
        where: { puzzleId: Number(puzzleId) }
      });
      
      // Determine if first image should be primary
      const shouldBePrimary = currentImages.length === 0;
      
      // Create all images
      const imagePromises = images.map((image, index) => {
        return prisma.puzzleImage.create({
          data: {
            imageUrl: image.imageUrl,
            caption: image.caption || null,
            isPrimary: shouldBePrimary && index === 0, // First image is primary if none exist
            puzzleId: Number(puzzleId)
          }
        });
      });
      
      const createdImages = await Promise.all(imagePromises);
      res.status(201).json(createdImages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT update a puzzle image
router.put('/:id',
  [
    param('id').isInt().withMessage('Image ID must be an integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { caption, isPrimary } = req.body;
      
      // If setting as primary, unset all other images as primary
      if (isPrimary) {
        const image = await prisma.puzzleImage.findUnique({
          where: { id: Number(id) }
        });
        
        if (image) {
          await prisma.puzzleImage.updateMany({
            where: { 
              puzzleId: image.puzzleId,
              id: { not: Number(id) }
            },
            data: { isPrimary: false }
          });
        }
      }
      
      const updatedImage = await prisma.puzzleImage.update({
        where: { id: Number(id) },
        data: { caption, isPrimary }
      });
      
      res.json(updatedImage);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Image not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE a puzzle image
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it's a primary image
    const image = await prisma.puzzleImage.findUnique({
      where: { id: Number(id) }
    });
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Delete the image
    await prisma.puzzleImage.delete({
      where: { id: Number(id) }
    });
    
    // If it was a primary image, set a new primary if other images exist
    if (image.isPrimary) {
      const remainingImages = await prisma.puzzleImage.findMany({
        where: { puzzleId: image.puzzleId },
        take: 1
      });
      
      if (remainingImages.length > 0) {
        await prisma.puzzleImage.update({
          where: { id: remainingImages[0].id },
          data: { isPrimary: true }
        });
      }
    }
    
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 