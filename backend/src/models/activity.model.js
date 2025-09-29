const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'created', 
      'updated', 
      'deleted', 
      'moved', 
      'assigned', 
      'unassigned',
      'commented',
      'added_label',
      'removed_label',
      'added_attachment',
      'removed_attachment',
      'joined',
      'left'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['task', 'comment', 'board', 'project', 'column']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board'
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { updatedAt: false }
});

// Index for faster queries
activitySchema.index({ projectId: 1, createdAt: -1 });
activitySchema.index({ boardId: 1, createdAt: -1 });
activitySchema.index({ entityId: 1, entityType: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
