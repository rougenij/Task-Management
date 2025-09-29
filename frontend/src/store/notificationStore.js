import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  
  // Fetch notifications
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/notifications');
      const notifications = response.data;
      
      // Count unread notifications
      const unreadCount = notifications.filter(n => !n.read).length;
      
      set({ 
        notifications, 
        unreadCount,
        isLoading: false 
      });
      
      return notifications;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch notifications';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      set(state => {
        const updatedNotifications = state.notifications.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        );
        
        // Recalculate unread count
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return { 
          notifications: updatedNotifications,
          unreadCount
        };
      });
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark notification as read';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      
      set(state => {
        const updatedNotifications = state.notifications.map(n => ({ ...n, read: true }));
        
        return { 
          notifications: updatedNotifications,
          unreadCount: 0
        };
      });
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark all notifications as read';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  
  // Add a new notification (from socket)
  addNotification: (notification) => {
    set(state => ({ 
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },
  
  // Clear error
  clearError: () => set({ error: null }),
}));
