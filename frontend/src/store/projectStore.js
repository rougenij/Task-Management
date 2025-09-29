import { create } from 'zustand';
import api from '../services/api';

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  
  // Fetch all projects
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/projects');
      set({ projects: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch projects';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Fetch a single project by ID
  fetchProject: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/projects/${projectId}`);
      set({ currentProject: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch project';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Create a new project
  createProject: async (projectData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/projects', projectData);
      const newProject = response.data.project;
      
      set(state => ({ 
        projects: [...state.projects, newProject],
        currentProject: newProject,
        isLoading: false 
      }));
      
      return newProject;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create project';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Update a project
  updateProject: async (projectId, projectData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/projects/${projectId}`, projectData);
      const updatedProject = response.data;
      
      set(state => ({ 
        projects: state.projects.map(p => 
          p._id === projectId ? updatedProject : p
        ),
        currentProject: updatedProject,
        isLoading: false 
      }));
      
      return updatedProject;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update project';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Delete a project
  deleteProject: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/projects/${projectId}`);
      
      set(state => ({ 
        projects: state.projects.filter(p => p._id !== projectId),
        currentProject: state.currentProject?._id === projectId ? null : state.currentProject,
        isLoading: false 
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete project';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Add member to project
  addProjectMember: async (projectId, userId, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/projects/${projectId}/members`, { 
        userId, 
        role 
      });
      
      const updatedProject = response.data;
      
      set(state => ({ 
        projects: state.projects.map(p => 
          p._id === projectId ? updatedProject : p
        ),
        currentProject: updatedProject,
        isLoading: false 
      }));
      
      return updatedProject;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add member';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Update member role
  updateMemberRole: async (projectId, userId, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/projects/${projectId}/members/${userId}`, { 
        role 
      });
      
      const updatedProject = response.data;
      
      set(state => ({ 
        projects: state.projects.map(p => 
          p._id === projectId ? updatedProject : p
        ),
        currentProject: updatedProject,
        isLoading: false 
      }));
      
      return updatedProject;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update member role';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Remove member from project
  removeMember: async (projectId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete(`/projects/${projectId}/members/${userId}`);
      
      const updatedProject = response.data;
      
      set(state => ({ 
        projects: state.projects.map(p => 
          p._id === projectId ? updatedProject : p
        ),
        currentProject: updatedProject,
        isLoading: false 
      }));
      
      return updatedProject;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to remove member';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Clear current project
  clearCurrentProject: () => {
    set({ currentProject: null });
  },
  
  // Clear error
  clearError: () => set({ error: null }),
}));
