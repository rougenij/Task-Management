const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Board = require('../models/board.model');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const Activity = require('../models/activity.model');

// Middleware to check if user is authenticated
const authenticate = passport.authenticate('jwt', { session: false });

// Middleware to check if user can access the board
const canAccessBoard = async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Get the project to check membership
    const project = await Project.findById(board.project);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is a member of the project
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this board' });
    }
    
    req.board = board;
    req.project = project;
    next();
  } catch (error) {
    console.error('Error in canAccessBoard middleware:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/boards
// @desc    Create a new board
// @access  Private
router.post(
  '/',
  [
    authenticate,
    body('title').not().isEmpty().withMessage('Board title is required'),
    body('projectId').not().isEmpty().withMessage('Project ID is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { title, description, projectId } = req.body;
      
      // Check if project exists and user is a member
      const project = await Project.findById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const isMember = project.members.some(
        member => member.user.toString() === req.user.id
      );
      
      if (!isMember) {
        return res.status(403).json({ message: 'Not authorized to create a board in this project' });
      }
      
      // Create new board
      const board = new Board({
        title,
        description,
        project: projectId
      });
      
      // Save board
      await board.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'created',
        entityType: 'board',
        entityId: board._id,
        projectId: projectId,
        boardId: board._id,
        data: { boardTitle: title }
      });
      
      await activity.save();
      
      res.status(201).json(board);
    } catch (error) {
      console.error('Error creating board:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/boards/project/:projectId
// @desc    Get all boards for a project
// @access  Private
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if project exists and user is a member
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const isMember = project.members.some(
      member => member.user.toString() === req.user.id
    );
    
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access boards in this project' });
    }
    
    // Get all boards for the project
    const boards = await Board.find({ project: projectId }).sort({ createdAt: -1 });
    
    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/boards/:id
// @desc    Get board by ID with tasks
// @access  Private
router.get('/:id', [authenticate, canAccessBoard], async (req, res) => {
  try {
    // Get all tasks for the board
    const tasks = await Task.find({ board: req.params.id })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    // Create response object with board and tasks
    const response = {
      ...req.board.toObject(),
      tasks
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/boards/:id
// @desc    Update board
// @access  Private
router.put(
  '/:id',
  [
    authenticate,
    canAccessBoard,
    body('title').optional().not().isEmpty().withMessage('Board title cannot be empty')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { title, description } = req.body;
      
      // Build update object
      const updateFields = {};
      if (title) updateFields.title = title;
      if (description !== undefined) updateFields.description = description;
      
      // Update board
      const board = await Board.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      );
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'updated',
        entityType: 'board',
        entityId: board._id,
        projectId: board.project,
        boardId: board._id,
        data: { 
          boardTitle: board.title,
          updates: updateFields
        }
      });
      
      await activity.save();
      
      res.json(board);
    } catch (error) {
      console.error('Error updating board:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/boards/:id
// @desc    Delete board
// @access  Private
router.delete('/:id', [authenticate, canAccessBoard], async (req, res) => {
  try {
    // Check if user is admin or owner in the project
    const member = req.project.members.find(
      member => member.user.toString() === req.user.id
    );
    
    if (!member || (member.role !== 'admin' && member.role !== 'owner')) {
      return res.status(403).json({ message: 'Not authorized to delete this board' });
    }
    
    // Delete board
    await Board.findByIdAndDelete(req.params.id);
    
    // Delete all tasks associated with the board
    await Task.deleteMany({ board: req.params.id });
    
    // Create activity log
    const activity = new Activity({
      user: req.user.id,
      action: 'deleted',
      entityType: 'board',
      entityId: req.params.id,
      projectId: req.project._id,
      data: { boardTitle: req.board.title }
    });
    
    await activity.save();
    
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/boards/:id/columns
// @desc    Add column to board
// @access  Private
router.post(
  '/:id/columns',
  [
    authenticate,
    canAccessBoard,
    body('title').not().isEmpty().withMessage('Column title is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { title } = req.body;
      
      // Create new column
      const newColumn = {
        _id: new mongoose.Types.ObjectId(),
        title,
        order: req.board.columns.length,
        taskIds: []
      };
      
      // Add column to board
      req.board.columns.push(newColumn);
      req.board.columnOrder.push(newColumn._id);
      
      // Save board
      await req.board.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'created',
        entityType: 'column',
        entityId: newColumn._id,
        projectId: req.project._id,
        boardId: req.board._id,
        data: { 
          columnTitle: title,
          boardTitle: req.board.title
        }
      });
      
      await activity.save();
      
      res.status(201).json(req.board);
    } catch (error) {
      console.error('Error adding column:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/boards/:id/columns/:columnId
// @desc    Update column
// @access  Private
router.put(
  '/:id/columns/:columnId',
  [
    authenticate,
    canAccessBoard,
    body('title').optional().not().isEmpty().withMessage('Column title cannot be empty')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { columnId } = req.params;
      const { title } = req.body;
      
      // Find column index
      const columnIndex = req.board.columns.findIndex(
        column => column._id.toString() === columnId
      );
      
      if (columnIndex === -1) {
        return res.status(404).json({ message: 'Column not found' });
      }
      
      // Update column title
      req.board.columns[columnIndex].title = title;
      
      // Save board
      await req.board.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'updated',
        entityType: 'column',
        entityId: columnId,
        projectId: req.project._id,
        boardId: req.board._id,
        data: { 
          columnTitle: title,
          boardTitle: req.board.title
        }
      });
      
      await activity.save();
      
      res.json(req.board);
    } catch (error) {
      console.error('Error updating column:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/boards/:id/columns/:columnId
// @desc    Delete column
// @access  Private
router.delete(
  '/:id/columns/:columnId',
  [authenticate, canAccessBoard],
  async (req, res) => {
    try {
      const { columnId } = req.params;
      
      // Find column index
      const columnIndex = req.board.columns.findIndex(
        column => column._id.toString() === columnId
      );
      
      if (columnIndex === -1) {
        return res.status(404).json({ message: 'Column not found' });
      }
      
      // Get column details for activity log
      const columnTitle = req.board.columns[columnIndex].title;
      
      // Delete all tasks in the column
      const taskIds = req.board.columns[columnIndex].taskIds;
      if (taskIds.length > 0) {
        await Task.deleteMany({ _id: { $in: taskIds } });
      }
      
      // Remove column from board
      req.board.columns.splice(columnIndex, 1);
      
      // Remove column from columnOrder
      const orderIndex = req.board.columnOrder.findIndex(
        id => id.toString() === columnId
      );
      
      if (orderIndex !== -1) {
        req.board.columnOrder.splice(orderIndex, 1);
      }
      
      // Save board
      await req.board.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'deleted',
        entityType: 'column',
        entityId: columnId,
        projectId: req.project._id,
        boardId: req.board._id,
        data: { 
          columnTitle,
          boardTitle: req.board.title
        }
      });
      
      await activity.save();
      
      res.json(req.board);
    } catch (error) {
      console.error('Error deleting column:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/boards/:id/columns/reorder
// @desc    Reorder columns
// @access  Private
router.put(
  '/:id/columns/reorder',
  [
    authenticate,
    canAccessBoard,
    body('columnOrder').isArray().withMessage('Column order must be an array')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { columnOrder } = req.body;
      
      // Validate that all column IDs exist
      const validColumnIds = req.board.columns.map(column => column._id.toString());
      const allIdsValid = columnOrder.every(id => validColumnIds.includes(id));
      
      if (!allIdsValid) {
        return res.status(400).json({ message: 'Invalid column IDs in order array' });
      }
      
      // Update column order
      req.board.columnOrder = columnOrder.map(id => mongoose.Types.ObjectId(id));
      
      // Update column order values
      columnOrder.forEach((columnId, index) => {
        const columnIndex = req.board.columns.findIndex(
          column => column._id.toString() === columnId
        );
        
        if (columnIndex !== -1) {
          req.board.columns[columnIndex].order = index;
        }
      });
      
      // Save board
      await req.board.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'updated',
        entityType: 'board',
        entityId: req.board._id,
        projectId: req.project._id,
        boardId: req.board._id,
        data: { 
          boardTitle: req.board.title,
          action: 'reordered columns'
        }
      });
      
      await activity.save();
      
      res.json(req.board);
    } catch (error) {
      console.error('Error reordering columns:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
