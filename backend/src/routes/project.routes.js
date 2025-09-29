const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Project = require('../models/project.model');
const Board = require('../models/board.model');
const Activity = require('../models/activity.model');
const Notification = require('../models/notification.model');

// Middleware to check if user is authenticated
const authenticate = passport.authenticate('jwt', { session: false });

// Middleware to check if user is a member of the project
const isMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }
    
    req.project = project;
    next();
  } catch (error) {
    console.error('Error in isMember middleware:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if user is an admin or owner of the project
const isAdminOrOwner = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const member = project.members.find(
      member => member.user.toString() === req.user.id
    );
    
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ message: 'Not authorized to perform this action' });
    }
    
    req.project = project;
    next();
  } catch (error) {
    console.error('Error in isAdminOrOwner middleware:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post(
  '/',
  [
    authenticate,
    body('name').not().isEmpty().withMessage('Project name is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { name, description } = req.body;
      
      // Create new project
      const project = new Project({
        name,
        description,
        owner: req.user.id
      });
      
      // Save project
      await project.save();
      
      // Create default board for the project
      const board = new Board({
        title: 'Main Board',
        description: 'Default board for the project',
        project: project._id
      });
      
      // Save board
      await board.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'created',
        entityType: 'project',
        entityId: project._id,
        projectId: project._id,
        data: { projectName: name }
      });
      
      await activity.save();
      
      res.status(201).json({ project, board });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/projects
// @desc    Get all projects for the current user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    // Find all projects where user is a member
    const projects = await Project.find({
      'members.user': req.user.id
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', [authenticate, isMember], async (req, res) => {
  try {
    // Project is already fetched in the isMember middleware
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private/Admin or Owner
router.put(
  '/:id',
  [
    authenticate,
    isAdminOrOwner,
    body('name').optional().not().isEmpty().withMessage('Project name cannot be empty')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { name, description } = req.body;
      
      // Build update object
      const updateFields = {};
      if (name) updateFields.name = name;
      if (description !== undefined) updateFields.description = description;
      
      // Update project
      const project = await Project.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      )
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar');
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'updated',
        entityType: 'project',
        entityId: project._id,
        projectId: project._id,
        data: { 
          projectName: project.name,
          updates: updateFields
        }
      });
      
      await activity.save();
      
      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private/Owner
router.delete('/:id', [authenticate, isAdminOrOwner], async (req, res) => {
  try {
    // Check if user is the owner
    if (req.project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the project owner can delete the project' });
    }
    
    // Delete project
    await Project.findByIdAndDelete(req.params.id);
    
    // Delete all boards associated with the project
    await Board.deleteMany({ project: req.params.id });
    
    // Delete all activities associated with the project
    await Activity.deleteMany({ projectId: req.params.id });
    
    // Delete all notifications associated with the project
    await Notification.deleteMany({ projectId: req.params.id });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Private/Admin or Owner
router.post(
  '/:id/members',
  [
    authenticate,
    isAdminOrOwner,
    body('userId').not().isEmpty().withMessage('User ID is required'),
    body('role')
      .isIn(['admin', 'member'])
      .withMessage('Role must be either admin or member')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { userId, role } = req.body;
      
      // Check if user exists
      const user = await mongoose.model('User').findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user is already a member
      const isMember = req.project.members.some(
        member => member.user.toString() === userId
      );
      
      if (isMember) {
        return res.status(400).json({ message: 'User is already a member of this project' });
      }
      
      // Add member to project
      req.project.members.push({ user: userId, role });
      await req.project.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'joined',
        entityType: 'project',
        entityId: req.project._id,
        projectId: req.project._id,
        data: { 
          addedUser: userId,
          role: role
        }
      });
      
      await activity.save();
      
      // Create notification for the added user
      const notification = new Notification({
        recipient: userId,
        sender: req.user.id,
        type: 'project_invitation',
        message: `You have been added to the project "${req.project.name}"`,
        entityType: 'project',
        entityId: req.project._id,
        projectId: req.project._id
      });
      
      await notification.save();
      
      // Return updated project
      const updatedProject = await Project.findById(req.params.id)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar');
      
      res.json(updatedProject);
    } catch (error) {
      console.error('Error adding member to project:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/projects/:id/members/:userId
// @desc    Update member role
// @access  Private/Admin or Owner
router.put(
  '/:id/members/:userId',
  [
    authenticate,
    isAdminOrOwner,
    body('role')
      .isIn(['admin', 'member'])
      .withMessage('Role must be either admin or member')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { role } = req.body;
      const { userId } = req.params;
      
      // Check if user is the owner
      if (req.project.owner.toString() === userId) {
        return res.status(400).json({ message: 'Cannot change the role of the project owner' });
      }
      
      // Find member index
      const memberIndex = req.project.members.findIndex(
        member => member.user.toString() === userId
      );
      
      if (memberIndex === -1) {
        return res.status(404).json({ message: 'User is not a member of this project' });
      }
      
      // Update member role
      req.project.members[memberIndex].role = role;
      await req.project.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'updated',
        entityType: 'project',
        entityId: req.project._id,
        projectId: req.project._id,
        data: { 
          updatedUser: userId,
          newRole: role
        }
      });
      
      await activity.save();
      
      // Return updated project
      const updatedProject = await Project.findById(req.params.id)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar');
      
      res.json(updatedProject);
    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private/Admin or Owner
router.delete(
  '/:id/members/:userId',
  [authenticate, isAdminOrOwner],
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user is the owner
      if (req.project.owner.toString() === userId) {
        return res.status(400).json({ message: 'Cannot remove the project owner' });
      }
      
      // Check if user is a member
      const memberIndex = req.project.members.findIndex(
        member => member.user.toString() === userId
      );
      
      if (memberIndex === -1) {
        return res.status(404).json({ message: 'User is not a member of this project' });
      }
      
      // Remove member
      req.project.members.splice(memberIndex, 1);
      await req.project.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'left',
        entityType: 'project',
        entityId: req.project._id,
        projectId: req.project._id,
        data: { removedUser: userId }
      });
      
      await activity.save();
      
      // Return updated project
      const updatedProject = await Project.findById(req.params.id)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar');
      
      res.json(updatedProject);
    } catch (error) {
      console.error('Error removing member from project:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
