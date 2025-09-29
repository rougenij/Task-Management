const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');

const Comment = require('../models/comment.model');
const Task = require('../models/task.model');
const Board = require('../models/board.model');
const Project = require('../models/project.model');
const Activity = require('../models/activity.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');

// Middleware to check if user is authenticated
const authenticate = passport.authenticate('jwt', { session: false });

// Middleware to check if user can access the task for comments
const canAccessTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    
    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }
    
    const task = await Task.findById(taskId);
    
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

// Helper function to extract mentions from comment content
const extractMentions = async (content) => {
  // Match @username pattern
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions = [];
  let match;
  
  // Find all mentions in the content
  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    
    // Find user by username
    const user = await User.findOne({ 
      $or: [
        { name: new RegExp(`^${username}$`, 'i') },
        { email: new RegExp(`^${username}@`, 'i') }
      ]
    });
    
    if (user) {
      mentions.push(user._id);
    }
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post(
  '/',
  [
    authenticate,
    canAccessTask,
    body('content').not().isEmpty().withMessage('Comment content is required'),
    body('taskId').not().isEmpty().withMessage('Task ID is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { content, taskId } = req.body;
      
      // Extract mentions from content
      const mentions = await extractMentions(content);
      
      // Create new comment
      const comment = new Comment({
        content,
        task: taskId,
        author: req.user.id,
        mentions
      });
      
      // Save comment
      await comment.save();
      
      // Create activity log
      const activity = new Activity({
        user: req.user.id,
        action: 'commented',
        entityType: 'comment',
        entityId: comment._id,
        projectId: req.project._id,
        boardId: req.board._id,
        data: { 
          taskTitle: req.task.title,
          commentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        }
      });
      
      await activity.save();
      
      // Create notifications for mentioned users
      if (mentions.length > 0) {
        const notifications = mentions.map(userId => ({
          recipient: userId,
          sender: req.user.id,
          type: 'mentioned',
          message: `You were mentioned in a comment on task "${req.task.title}"`,
          entityType: 'comment',
          entityId: comment._id,
          projectId: req.project._id
        }));
        
        await Notification.insertMany(notifications);
      }
      
      // Create notification for task creator if different from comment author
      if (req.task.createdBy.toString() !== req.user.id) {
        const notification = new Notification({
          recipient: req.task.createdBy,
          sender: req.user.id,
          type: 'comment_added',
          message: `New comment on your task "${req.task.title}"`,
          entityType: 'comment',
          entityId: comment._id,
          projectId: req.project._id
        });
        
        await notification.save();
      }
      
      // Return comment with populated fields
      const populatedComment = await Comment.findById(comment._id)
        .populate('author', 'name email avatar')
        .populate('mentions', 'name email avatar');
      
      res.status(201).json(populatedComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/comments/task/:taskId
// @desc    Get all comments for a task
// @access  Private
router.get('/task/:taskId', [authenticate, canAccessTask], async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .sort({ createdAt: 1 });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private
router.put(
  '/:id',
  [
    authenticate,
    body('content').not().isEmpty().withMessage('Comment content is required')
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { content } = req.body;
      
      // Find comment
      const comment = await Comment.findById(req.params.id);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // Check if user is the author of the comment
      if (comment.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this comment' });
      }
      
      // Extract new mentions from content
      const newMentions = await extractMentions(content);
      
      // Update comment
      comment.content = content;
      comment.mentions = newMentions;
      comment.updatedAt = Date.now();
      
      await comment.save();
      
      // Create notifications for newly mentioned users
      const oldMentions = comment.mentions.map(mention => mention.toString());
      const brandNewMentions = newMentions.filter(
        mention => !oldMentions.includes(mention.toString())
      );
      
      if (brandNewMentions.length > 0) {
        // Get task info for notification
        const task = await Task.findById(comment.task);
        
        const notifications = brandNewMentions.map(userId => ({
          recipient: userId,
          sender: req.user.id,
          type: 'mentioned',
          message: `You were mentioned in an updated comment on task "${task.title}"`,
          entityType: 'comment',
          entityId: comment._id,
          projectId: task.project
        }));
        
        await Notification.insertMany(notifications);
      }
      
      // Return updated comment with populated fields
      const updatedComment = await Comment.findById(comment._id)
        .populate('author', 'name email avatar')
        .populate('mentions', 'name email avatar');
      
      res.json(updatedComment);
    } catch (error) {
      console.error('Error updating comment:', error);
      
      if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Find comment
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Get task, board, and project info for access control
    const task = await Task.findById(comment.task);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const board = await Board.findById(task.board);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    const project = await Project.findById(board.project);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the author of the comment or an admin/owner of the project
    const isAuthor = comment.author.toString() === req.user.id;
    
    const projectMember = project.members.find(
      member => member.user.toString() === req.user.id
    );
    
    const isAdminOrOwner = projectMember && 
      (projectMember.role === 'admin' || projectMember.role === 'owner');
    
    if (!isAuthor && !isAdminOrOwner) {
      return res.status(403).json({ 
        message: 'Not authorized to delete this comment' 
      });
    }
    
    // Delete comment
    await Comment.findByIdAndDelete(req.params.id);
    
    // Create activity log
    const activity = new Activity({
      user: req.user.id,
      action: 'deleted',
      entityType: 'comment',
      entityId: req.params.id,
      projectId: project._id,
      boardId: board._id,
      data: { 
        taskTitle: task.title,
        commentAuthor: comment.author
      }
    });
    
    await activity.save();
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
