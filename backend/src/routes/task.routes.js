const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Task = require('../models/task.model');
const Board = require('../models/board.model');
const Project = require('../models/project.model');
const Activity = require('../models/activity.model');
const Notification = require('../models/notification.model');

// Middleware to check if user is authenticated
const authenticate = passport.authenticate('jwt', { session: false });

// Middleware to check if user can access the task
const canAccessTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Get the board to check access
    const board = await Board.findById(task.board);
    
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
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }
    
    req.task = task;
    req.board = board;
    req.project = project;
    next();
  } catch (error) {
    console.error('Error in canAccessTask middleware:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/',
  [
    authenticate,
    body('title').not().isEmpty().withMessage('Task title is required'),
    body('boardId').not().isEmpty().withMessage('Board ID is required'),
    body('columnId').not().isEmpty().withMessage('Column ID is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { 
        title, 
        description, 
        boardId, 
        columnId,
        assignedTo,
        dueDate,
        labels
      } = req.body;
      
      // Check if board exists and user has access
      const board = await Board.findById(boardId);
      
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }
      
      // Check if column exists in the board
      const columnIndex = board.columns.findIndex(
        column => column._id.toString() === columnId
      );
      
      if (columnIndex === -1) {
        return res.status(404).json({ message: 'Column not found in this board' });
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
        return res.status(403).json({ message: 'Not authorized to create tasks in this board' });
      }
      
      // Create new task
      const task = new Task({
        title,
        description,
        board: boardId,
        column: columnId,
        assignedTo: assignedTo || [],
        dueDate: dueDate || null,
        labels: labels || [],
        createdBy: req.user.id,
        order: board.columns[columnIndex].taskIds.length
      });
      
      // Save task
      await task.save();
      
      // Add task to column
      board.columns[columnIndex].taskIds.push(task._id);
      await board.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'created',
        entityType: 'task',
        entityId: task._id,
        projectId: project._id,
        boardId: board._id,
        data: { 
          taskTitle: title,
          boardTitle: board.title,
          columnTitle: board.columns[columnIndex].title
        }
      });
      
      await activity.save();
      
      // Create notifications for assigned users
      if (assignedTo && assignedTo.length > 0) {
        const notifications = assignedTo.map(userId => ({
          recipient: userId,
          sender: req.user.id,
          type: 'task_assigned',
          message: `You have been assigned to the task "${title}"`,
          entityType: 'task',
          entityId: task._id,
          projectId: project._id
        }));
        
        await Notification.insertMany(notifications);
      }
      
      // Return task with populated fields
      const populatedTask = await Task.findById(task._id)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar');
      
      res.status(201).json(populatedTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', [authenticate, canAccessTask], async (req, res) => {
  try {
    // Task is already fetched in the canAccessTask middleware
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put(
  '/:id',
  [
    authenticate,
    canAccessTask,
    body('title').optional().not().isEmpty().withMessage('Task title cannot be empty')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { 
        title, 
        description, 
        assignedTo,
        dueDate,
        labels
      } = req.body;
      
      // Build update object
      const updateFields = {};
      if (title) updateFields.title = title;
      if (description !== undefined) updateFields.description = description;
      if (assignedTo) updateFields.assignedTo = assignedTo;
      if (dueDate !== undefined) updateFields.dueDate = dueDate;
      if (labels) updateFields.labels = labels;
      
      // Update task
      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      )
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar');
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'updated',
        entityType: 'task',
        entityId: updatedTask._id,
        projectId: req.project._id,
        boardId: req.board._id,
        data: { 
          taskTitle: updatedTask.title,
          updates: updateFields
        }
      });
      
      await activity.save();
      
      // Create notifications for newly assigned users
      if (assignedTo && req.task.assignedTo.toString() !== assignedTo.toString()) {
        // Find newly assigned users
        const newAssignees = assignedTo.filter(
          userId => !req.task.assignedTo.includes(userId)
        );
        
        if (newAssignees.length > 0) {
          const notifications = newAssignees.map(userId => ({
            recipient: userId,
            sender: req.user.id,
            type: 'task_assigned',
            message: `You have been assigned to the task "${updatedTask.title}"`,
            entityType: 'task',
            entityId: updatedTask._id,
            projectId: req.project._id
          }));
          
          await Notification.insertMany(notifications);
        }
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', [authenticate, canAccessTask], async (req, res) => {
  try {
    // Remove task from column
    const columnIndex = req.board.columns.findIndex(
      column => column._id.toString() === req.task.column.toString()
    );
    
    if (columnIndex !== -1) {
      const taskIndex = req.board.columns[columnIndex].taskIds.findIndex(
        taskId => taskId.toString() === req.params.id
      );
      
      if (taskIndex !== -1) {
        req.board.columns[columnIndex].taskIds.splice(taskIndex, 1);
        await req.board.save();
      }
    }
    
    // Delete task
    await Task.findByIdAndDelete(req.params.id);
    
    // Create activity log
    const activity = new Activity({
      user: req.user.id,
      action: 'deleted',
      entityType: 'task',
      entityId: req.params.id,
      projectId: req.project._id,
      boardId: req.board._id,
      data: { 
        taskTitle: req.task.title
      }
    });
    
    await activity.save();
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id/move
// @desc    Move task to another column
// @access  Private
router.put(
  '/:id/move',
  [
    authenticate,
    canAccessTask,
    body('columnId').not().isEmpty().withMessage('Target column ID is required'),
    body('order').isNumeric().withMessage('Order must be a number')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { columnId, order } = req.body;
      
      // Check if column exists in the board
      const targetColumnIndex = req.board.columns.findIndex(
        column => column._id.toString() === columnId
      );
      
      if (targetColumnIndex === -1) {
        return res.status(404).json({ message: 'Target column not found' });
      }
      
      // Find current column
      const sourceColumnIndex = req.board.columns.findIndex(
        column => column._id.toString() === req.task.column.toString()
      );
      
      // Remove task from source column
      if (sourceColumnIndex !== -1) {
        const taskIndex = req.board.columns[sourceColumnIndex].taskIds.findIndex(
          taskId => taskId.toString() === req.params.id
        );
        
        if (taskIndex !== -1) {
          req.board.columns[sourceColumnIndex].taskIds.splice(taskIndex, 1);
        }
      }
      
      // Add task to target column at specified order
      const targetTaskIds = req.board.columns[targetColumnIndex].taskIds;
      targetTaskIds.splice(order, 0, req.task._id);
      
      // Save board
      await req.board.save();
      
      // Update task column and order
      req.task.column = columnId;
      req.task.order = order;
      await req.task.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'moved',
        entityType: 'task',
        entityId: req.task._id,
        projectId: req.project._id,
        boardId: req.board._id,
        data: { 
          taskTitle: req.task.title,
          fromColumn: sourceColumnIndex !== -1 ? req.board.columns[sourceColumnIndex].title : 'Unknown',
          toColumn: req.board.columns[targetColumnIndex].title
        }
      });
      
      await activity.save();
      
      res.json({ 
        task: req.task,
        board: req.board
      });
    } catch (error) {
      console.error('Error moving task:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
