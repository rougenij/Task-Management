import { create } from 'zustand';
import api from '../services/api';
import { emitNewComment } from '../services/socket';

export const useTaskStore = create((set, get) => ({
  currentTask: null,
  comments: [],
  isLoading: false,
  error: null,
  
  // Fetch a task by ID
  fetchTask: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/tasks/${taskId}`);
      set({ currentTask: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch task';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Fetch comments for a task
  fetchComments: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/comments/task/${taskId}`);
      set({ comments: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch comments';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Add a comment to a task
  addComment: async (taskId, content) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/comments', { taskId, content });
      const newComment = response.data;
      
      set(state => ({ 
        comments: [...state.comments, newComment],
        isLoading: false 
      }));
      
      // Emit new comment via socket
      emitNewComment({
        commentId: newComment._id,
        taskId,
        boardId: get().currentTask?.board
      });
      
      return newComment;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add comment';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Update a comment
  updateComment: async (commentId, content) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/comments/${commentId}`, { content });
      const updatedComment = response.data;
      
      set(state => ({ 
        comments: state.comments.map(c => 
          c._id === commentId ? updatedComment : c
        ),
        isLoading: false 
      }));
      
      return updatedComment;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update comment';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Delete a comment
  deleteComment: async (commentId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/comments/${commentId}`);
      
      set(state => ({ 
        comments: state.comments.filter(c => c._id !== commentId),
        isLoading: false 
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete comment';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Handle new comment from socket
  handleNewComment: (data) => {
    const { taskId } = data;
    const currentTaskId = get().currentTask?._id;
    
    // If we're viewing the task that got a new comment, fetch the comments
    if (currentTaskId === taskId) {
      get().fetchComments(taskId);
    }
  },
  
  // Clear current task
  clearCurrentTask: () => {
    set({ currentTask: null, comments: [] });
  },
  
  // Clear error
  clearError: () => set({ error: null }),
}));
