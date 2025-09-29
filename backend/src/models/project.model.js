const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    }
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

// Add owner as a member with 'owner' role when creating a project
projectSchema.pre('save', function(next) {
  if (this.isNew) {
    // Check if owner is already in members
    const ownerExists = this.members.some(member => 
      member.user.toString() === this.owner.toString() && member.role === 'owner'
    );
    
    if (!ownerExists) {
      this.members.push({
        user: this.owner,
        role: 'owner'
      });
    }
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
