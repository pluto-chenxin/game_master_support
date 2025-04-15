const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configure JWT strategy for Passport
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

// Setup JWT strategy
passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Find the user by ID from JWT payload
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user) {
        return done(null, false);
      }

      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Extract workspace ID from headers and add to request
const extractWorkspaceId = (req, res, next) => {
  const workspaceId = req.headers['x-workspace-id'];
  
  if (workspaceId) {
    req.user = req.user || {};
    req.user.currentWorkspaceId = parseInt(workspaceId, 10);
  }
  
  next();
};

// Authentication middleware
const requireAuth = [
  passport.authenticate('jwt', { session: false }),
  extractWorkspaceId
];

// Middleware to check if user has access to a workspace
const requireWorkspaceAccess = (requiredRole = 'USER') => {
  return async (req, res, next) => {
    try {
      const workspaceId = parseInt(req.params.workspaceId || req.body.workspaceId);
      
      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required' });
      }
      
      // Check if user has access to the workspace
      const userWorkspace = await prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId
          }
        }
      });
      
      if (!userWorkspace) {
        return res.status(403).json({ error: 'You do not have access to this workspace' });
      }
      
      // Check if user has required role
      const roleHierarchy = {
        'USER': 1,
        'ADMIN': 2,
        'SUPER_ADMIN': 3
      };
      
      if (roleHierarchy[userWorkspace.role] < roleHierarchy[requiredRole]) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      // Add workspace to request
      req.workspace = { id: workspaceId, role: userWorkspace.role };
      next();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
};

module.exports = {
  passport,
  requireAuth,
  requireWorkspaceAccess
}; 