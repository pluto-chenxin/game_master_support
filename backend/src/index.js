const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const passport = require('passport');

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Import routes
const gamesRoutes = require('./routes/games');
const puzzlesRoutes = require('./routes/puzzles');
const hintsRoutes = require('./routes/hints');
const maintenanceRoutes = require('./routes/maintenance');
const uploadsRoutes = require('./routes/uploads');
const puzzleImagesRoutes = require('./routes/puzzleImages');
const reportsRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const workspacesRoutes = require('./routes/workspaces');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  exposedHeaders: ['X-Workspace-ID'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Make uploaded files accessible
app.use('/uploads', express.static('uploads'));

// Initialize Passport
app.use(passport.initialize());

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/puzzles', puzzlesRoutes);
app.use('/api/hints', hintsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/puzzle-images', puzzleImagesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/reports', reportsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Game Master Support API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma client disconnected');
  process.exit(0);
});

// Export app for testing
module.exports = app; 