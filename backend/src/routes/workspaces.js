const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireWorkspaceAccess } = require('../middleware/auth');
const crypto = require('crypto');
// Make nodemailer optional to prevent server crashes
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.warn('Nodemailer not available. Email functionality will be disabled.');
}
const dotenv = require('dotenv');

dotenv.config();
const prisma = new PrismaClient();
const router = express.Router();

// Get all workspaces for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userWorkspaces = await prisma.userWorkspace.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        workspace: true
      }
    });

    // Format the response
    const workspaces = userWorkspaces.map(uw => ({
      id: uw.workspace.id,
      name: uw.workspace.name,
      description: uw.workspace.description,
      role: uw.role,
      createdAt: uw.workspace.createdAt,
      updatedAt: uw.workspace.updatedAt
    }));

    res.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get workspace by ID (requires workspace access)
router.get('/:workspaceId', requireAuth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Check if user has access to this workspace
    const userWorkspace = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: parseInt(workspaceId)
        }
      },
      include: {
        workspace: {
          include: {
            games: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!userWorkspace) {
      return res.status(403).json({ error: 'You do not have access to this workspace' });
    }

    // Format the response
    const workspace = {
      id: userWorkspace.workspace.id,
      name: userWorkspace.workspace.name,
      description: userWorkspace.workspace.description,
      role: userWorkspace.role,
      createdAt: userWorkspace.workspace.createdAt,
      updatedAt: userWorkspace.workspace.updatedAt,
      games: userWorkspace.workspace.games
    };

    res.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new workspace (any authenticated user can create)
router.post(
  '/',
  [
    requireAuth,
    body('name').notEmpty().withMessage('Workspace name is required'),
    body('description').optional()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description } = req.body;

      // Create workspace with the current user as admin
      const workspace = await prisma.workspace.create({
        data: {
          name,
          description,
          users: {
            create: {
              userId: req.user.id,
              role: 'ADMIN' // Creator becomes admin of the workspace
            }
          }
        }
      });

      res.status(201).json({
        message: 'Workspace created successfully',
        workspace
      });
    } catch (error) {
      console.error('Error creating workspace:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Update a workspace (admin only)
router.put(
  '/:workspaceId',
  [
    requireAuth,
    body('name').optional(),
    body('description').optional()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { workspaceId } = req.params;
      const { name, description } = req.body;

      // Check if user has admin access to this workspace
      const userWorkspace = await prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId: parseInt(workspaceId)
          }
        }
      });

      if (!userWorkspace || !['ADMIN', 'SUPER_ADMIN'].includes(userWorkspace.role)) {
        return res.status(403).json({ error: 'Only admins can update workspaces' });
      }

      // Update workspace
      const updatedWorkspace = await prisma.workspace.update({
        where: { id: parseInt(workspaceId) },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description })
        }
      });

      res.json({
        message: 'Workspace updated successfully',
        workspace: updatedWorkspace
      });
    } catch (error) {
      console.error('Error updating workspace:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Add a user to a workspace (admin only)
router.post(
  '/:workspaceId/users',
  [
    requireAuth,
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['USER', 'ADMIN']).withMessage('Role must be USER or ADMIN')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { workspaceId } = req.params;
      const { email, role } = req.body;

      // Check if user has admin access to this workspace
      const userWorkspace = await prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId: parseInt(workspaceId)
          }
        }
      });

      if (!userWorkspace || !['ADMIN', 'SUPER_ADMIN'].includes(userWorkspace.role)) {
        return res.status(403).json({ error: 'Only admins can add users to workspaces' });
      }

      // Find user by email
      const userToAdd = await prisma.user.findUnique({
        where: { email }
      });

      if (!userToAdd) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is already in workspace
      const existingMembership = await prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: userToAdd.id,
            workspaceId: parseInt(workspaceId)
          }
        }
      });

      if (existingMembership) {
        return res.status(400).json({ error: 'User is already a member of this workspace' });
      }

      // Add user to workspace
      await prisma.userWorkspace.create({
        data: {
          userId: userToAdd.id,
          workspaceId: parseInt(workspaceId),
          role
        }
      });

      res.status(201).json({
        message: 'User added to workspace successfully'
      });
    } catch (error) {
      console.error('Error adding user to workspace:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Remove a user from a workspace (admin only)
router.delete(
  '/:workspaceId/users/:userId',
  requireAuth,
  async (req, res) => {
    try {
      const { workspaceId, userId } = req.params;

      // Check if user has admin access to this workspace
      const userWorkspace = await prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: req.user.id,
            workspaceId: parseInt(workspaceId)
          }
        }
      });

      if (!userWorkspace || !['ADMIN', 'SUPER_ADMIN'].includes(userWorkspace.role)) {
        return res.status(403).json({ error: 'Only admins can remove users from workspaces' });
      }

      // Check if we're not removing the last admin
      if (parseInt(userId) === req.user.id) {
        const adminCount = await prisma.userWorkspace.count({
          where: {
            workspaceId: parseInt(workspaceId),
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          }
        });

        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot remove the last admin from a workspace' });
        }
      }

      // Remove user from workspace
      await prisma.userWorkspace.delete({
        where: {
          userId_workspaceId: {
            userId: parseInt(userId),
            workspaceId: parseInt(workspaceId)
          }
        }
      });

      res.json({
        message: 'User removed from workspace successfully'
      });
    } catch (error) {
      console.error('Error removing user from workspace:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all users in a workspace (members can view)
router.get('/:workspaceId/users', requireAuth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    console.log(`[API] Fetching users for workspace ${workspaceId}, requested by user ${req.user.id}`);

    // Check if user has access to this workspace
    const userWorkspace = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: parseInt(workspaceId)
        }
      }
    });

    if (!userWorkspace) {
      console.log(`[API] Access denied: User ${req.user.id} does not have access to workspace ${workspaceId}`);
      return res.status(403).json({ error: 'You do not have access to this workspace' });
    }

    console.log(`[API] User ${req.user.id} has role ${userWorkspace.role} in workspace ${workspaceId}`);

    // Get all users in the workspace
    const workspaceUsers = await prisma.userWorkspace.findMany({
      where: {
        workspaceId: parseInt(workspaceId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    console.log(`[API] Found ${workspaceUsers.length} users in workspace ${workspaceId}`);

    // Format the response
    const users = workspaceUsers.map(wu => ({
      id: wu.user.id,
      name: wu.user.name,
      email: wu.user.email,
      globalRole: wu.user.role,
      workspaceRole: wu.role
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching workspace users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Invite a user to a workspace (admin only)
router.post('/:workspaceId/invite', requireAuth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;
    
    console.log(`[API] Inviting user ${email} to workspace ${workspaceId} with role ${role}`);

    // Check if user has admin access to this workspace
    const userWorkspace = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: parseInt(workspaceId)
        }
      },
      include: {
        workspace: true
      }
    });

    if (!userWorkspace || !['ADMIN', 'SUPER_ADMIN'].includes(userWorkspace.role)) {
      console.log(`[API] Access denied: User ${req.user.id} does not have admin rights to workspace ${workspaceId}`);
      return res.status(403).json({ error: 'Only admins can invite users to workspaces' });
    }

    const workspaceName = userWorkspace.workspace.name;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`[API] User with email ${email} found, checking for existing membership`);
      
      // Check if user is already in workspace
      const existingMembership = await prisma.userWorkspace.findUnique({
        where: {
          userId_workspaceId: {
            userId: existingUser.id,
            workspaceId: parseInt(workspaceId)
          }
        }
      });

      if (existingMembership) {
        console.log(`[API] User ${existingUser.id} is already a member of workspace ${workspaceId}`);
        return res.status(400).json({ error: 'User is already a member of this workspace' });
      }

      // Add existing user to workspace
      const membership = await prisma.userWorkspace.create({
        data: {
          userId: existingUser.id,
          workspaceId: parseInt(workspaceId),
          role
        }
      });

      console.log(`[API] Existing user ${existingUser.id} added to workspace ${workspaceId} with role ${role}`);
      
      // Send notification email (best effort)
      try {
        if (nodemailer) {
          await sendWorkspaceInviteEmail(
            email, 
            req.user.name || 'A workspace admin', 
            workspaceName, 
            null, 
            true
          );
        } else {
          console.log(`[API] Email would be sent to ${email} notifying they were added to workspace ${workspaceName}`);
        }
      } catch (emailError) {
        console.error('[API] Error sending notification email:', emailError);
      }

      return res.status(201).json({
        message: 'Existing user added to workspace successfully'
      });
    } else {
      console.log(`[API] User with email ${email} not found, creating invitation`);
      
      // Create invitation token
      const token = crypto.randomBytes(20).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invitation
      try {
        const invitation = await prisma.workspaceInvitation.create({
          data: {
            email,
            role,
            token,
            expiresAt,
            workspaceId: parseInt(workspaceId),
            inviterId: req.user.id
          }
        });

        console.log(`[API] Created invitation with token ${token} for email ${email} to workspace ${workspaceId}`);
        
        // Send invitation email (best effort)
        try {
          if (nodemailer) {
            await sendWorkspaceInviteEmail(
              email, 
              req.user.name || 'A workspace admin', 
              workspaceName, 
              token
            );
          } else {
            console.log(`[API] Email would be sent to ${email} with invitation link for workspace ${workspaceName}`);
            console.log(`[API] Invitation URL would be: http://localhost:3000/invitations/${token}`);
          }
        } catch (emailError) {
          console.error('[API] Error sending invitation email:', emailError);
        }

        return res.status(201).json({
          message: 'Invitation sent successfully',
          invitationUrl: `http://localhost:3000/invitations/${token}`
        });
      } catch (error) {
        console.error('[API] Error creating invitation:', error);
        return res.status(500).json({ error: 'Failed to create invitation' });
      }
    }
  } catch (error) {
    console.error('Error inviting user to workspace:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept workspace invitation (no auth required - based on token)
router.get('/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log(`[API] Verifying invitation token: ${token}`);

    // Find invitation by token
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true }
    });

    if (!invitation) {
      console.log(`[API] Invitation not found for token: ${token}`);
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    if (invitation.expiresAt < new Date()) {
      console.log(`[API] Invitation expired for token: ${token}`);
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    if (invitation.used) {
      console.log(`[API] Invitation already used for token: ${token}`);
      return res.status(400).json({ error: 'Invitation has already been used' });
    }

    // Return invitation details
    console.log(`[API] Returning invitation details for token: ${token}`);
    res.json({
      email: invitation.email,
      workspaceName: invitation.workspace.name,
      role: invitation.role
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept workspace invitation and register (no auth required - based on token)
router.post('/invitations/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;
    
    console.log(`[API] Processing invitation acceptance for token: ${token}`);

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find invitation by token
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true }
    });

    if (!invitation) {
      console.log(`[API] Invitation not found for token: ${token}`);
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    if (invitation.expiresAt < new Date()) {
      console.log(`[API] Invitation expired for token: ${token}`);
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    if (invitation.used) {
      console.log(`[API] Invitation already used for token: ${token}`);
      return res.status(400).json({ error: 'Invitation has already been used' });
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {
      console.log(`[API] User already exists with email: ${invitation.email}`);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user and add to workspace
    const user = await prisma.user.create({
      data: {
        name,
        email: invitation.email,
        password: hashedPassword,
        role: 'USER', // Default role for new users
        workspaces: {
          create: {
            workspaceId: invitation.workspaceId,
            role: invitation.role
          }
        }
      }
    });

    // Mark invitation as used
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { used: true }
    });

    console.log(`[API] Created new user ${user.id} from invitation and added to workspace ${invitation.workspaceId}`);

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const payload = {
      user: {
        id: user.id
      }
    };

    const jwtToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default_secret_key_change_this',
      { expiresIn: '12h' }
    );

    res.json({
      message: 'Account created and joined workspace successfully',
      token: jwtToken
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email sending helper function
async function sendWorkspaceInviteEmail(email, inviterName, workspaceName, token, existingUser = false) {
  try {
    // If nodemailer is not available, log message and return
    if (!nodemailer) {
      console.log(`[Email not sent - nodemailer unavailable] Would send email to ${email} for workspace ${workspaceName}`);
      return;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASSWORD || 'password'
      }
    });

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    let subject, text, html;
    
    if (existingUser) {
      // Email for existing users
      subject = `You've been added to ${workspaceName}`;
      text = `Hi there,\n\n${inviterName} has added you to the "${workspaceName}" workspace in Game Master Support. You can access it by logging in to your account.\n\nBest regards,\nThe Game Master Support Team`;
      html = `
        <p>Hi there,</p>
        <p>${inviterName} has added you to the "${workspaceName}" workspace in Game Master Support.</p>
        <p>You can access it by logging in to your account at <a href="${appUrl}/login">${appUrl}/login</a>.</p>
        <p>Best regards,<br>The Game Master Support Team</p>
      `;
    } else {
      // Email for new users
      subject = `Invitation to join ${workspaceName} on Game Master Support`;
      text = `Hi there,\n\n${inviterName} has invited you to join the "${workspaceName}" workspace in Game Master Support. Click the following link to accept the invitation and create your account: ${appUrl}/invitations/${token}\n\nThis link will expire in 7 days.\n\nBest regards,\nThe Game Master Support Team`;
      html = `
        <p>Hi there,</p>
        <p>${inviterName} has invited you to join the "${workspaceName}" workspace in Game Master Support.</p>
        <p><a href="${appUrl}/invitations/${token}">Click here to accept the invitation and create your account</a></p>
        <p>Or copy and paste this URL into your browser: ${appUrl}/invitations/${token}</p>
        <p>This invitation link will expire in 7 days.</p>
        <p>Best regards,<br>The Game Master Support Team</p>
      `;
    }

    // If EMAIL_DISABLE_SENDING is set, just log instead of sending
    if (process.env.EMAIL_DISABLE_SENDING === 'true') {
      console.log('Email would be sent:', {
        to: email,
        subject,
        text
      });
      return;
    }

    // Send email
    await transporter.sendMail({
      from: `"Game Master Support" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com'}>`,
      to: email,
      subject,
      text,
      html
    });

    console.log(`[API] Email sent successfully to ${email}`);
  } catch (error) {
    console.error('[API] Error sending invitation email:', error);
    // Don't throw, just log - we don't want to fail the invite if email fails
  }
}

module.exports = router; 