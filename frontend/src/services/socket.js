import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket;

export const initSocket = () => {
  const token = useAuthStore.getState().token;
  
  if (!token) return null;
  
  // Close existing socket if it exists
  if (socket) socket.close();
  
  // Create new socket connection
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  // Socket event listeners
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

// Join a project room
export const joinProject = (projectId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('join:project', projectId);
  }
};

// Leave a project room
export const leaveProject = (projectId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('leave:project', projectId);
  }
};

// Join a board room
export const joinBoard = (boardId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('join:board', boardId);
  }
};

// Leave a board room
export const leaveBoard = (boardId) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('leave:board', boardId);
  }
};

// Emit task update
export const emitTaskUpdate = (data) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('task:update', data);
  }
};

// Emit task move
export const emitTaskMove = (data) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('task:move', data);
  }
};

// Emit new comment
export const emitNewComment = (data) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('comment:new', data);
  }
};
