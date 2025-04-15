const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'puzzle-' + uniqueSuffix + ext);
  }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter
});

// Upload route for single image
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Return the file path to be stored in the database
    const filePath = `/api/uploads/${req.file.filename}`;
    res.json({ 
      filePath,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload route for multiple images
router.post('/multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Return array of file paths
    const uploads = req.files.map(file => ({
      filePath: `/api/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));
    
    res.json({ uploads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get uploaded image
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(__dirname, '../../uploads', filename);
  
  // Check if file exists
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ message: 'Image not found' });
  }
});

// Delete uploaded image
router.delete('/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(__dirname, '../../uploads', filename);
  
  // Check if file exists
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Image not found' });
  }
});

module.exports = router; 