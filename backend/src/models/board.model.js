const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  taskIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }]
}, { _id: true });

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  columns: [columnSchema],
  columnOrder: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create default columns when a new board is created
boardSchema.pre('save', function(next) {
  if (this.isNew && this.columns.length === 0) {
    // Create default columns: To Do, In Progress, Done
    const todoColumn = {
      _id: new mongoose.Types.ObjectId(),
      title: 'To Do',
      order: 0,
      taskIds: []
    };
    
    const inProgressColumn = {
      _id: new mongoose.Types.ObjectId(),
      title: 'In Progress',
      order: 1,
      taskIds: []
    };
    
    const doneColumn = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Done',
      order: 2,
      taskIds: []
    };
    
    this.columns = [todoColumn, inProgressColumn, doneColumn];
    this.columnOrder = [todoColumn._id, inProgressColumn._id, doneColumn._id];
  }
  next();
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
