const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Store active connections
const activeUsers = new Map();

const socketHandler = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);
    
    // Add user to active users
    activeUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      userId: socket.user._id,
      name: socket.user.name
    });
    
    // Join personal room for direct messages
    socket.join(`user:${socket.user._id}`);
    
    // Emit updated online users
    io.emit('users:online', Array.from(activeUsers.values()));

    // Handle joining project rooms
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`${socket.user.name} joined project room: ${projectId}`);
    });
    
    // Handle leaving project rooms
    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`${socket.user.name} left project room: ${projectId}`);
    });
    
    // Handle joining board rooms
    socket.on('join:board', (boardId) => {
      socket.join(`board:${boardId}`);
      console.log(`${socket.user.name} joined board room: ${boardId}`);
    });
    
    // Handle leaving board rooms
    socket.on('leave:board', (boardId) => {
      socket.leave(`board:${boardId}`);
      console.log(`${socket.user.name} left board room: ${boardId}`);
    });
    
    // Handle task updates
    socket.on('task:update', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:updated', data);
    });
    
    // Handle task movement
    socket.on('task:move', (data) => {
      socket.to(`board:${data.boardId}`).emit('task:moved', data);
    });
    
    // Handle new comments
    socket.on('comment:new', (data) => {
      socket.to(`board:${data.boardId}`).emit('comment:added', data);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user._id})`);
      
      // Remove user from active users
      activeUsers.delete(socket.user._id.toString());
      
      // Emit updated online users
      io.emit('users:online', Array.from(activeUsers.values()));
    });
  });
};

module.exports = socketHandler;
