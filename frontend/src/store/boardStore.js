import { create } from 'zustand';
import api from '../services/api';
import { emitTaskMove, emitTaskUpdate } from '../services/socket';

export const useBoardStore = create((set, get) => ({
  boards: [],
  currentBoard: null,
  tasks: [],
  isLoading: false,
  error: null,
  
  // Fetch boards for a project
  fetchProjectBoards: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/boards/project/${projectId}`);
      set({ boards: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch boards';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Fetch a single board with tasks
  fetchBoard: async (boardId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/boards/${boardId}`);
      set({ 
        currentBoard: response.data, 
        tasks: response.data.tasks || [],
        isLoading: false 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch board';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Create a new board
  createBoard: async (boardData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/boards', boardData);
      const newBoard = response.data;
      
      set(state => ({ 
        boards: [...state.boards, newBoard],
        isLoading: false 
      }));
      
      return newBoard;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create board';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Update a board
  updateBoard: async (boardId, boardData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/boards/${boardId}`, boardData);
      const updatedBoard = response.data;
      
      set(state => ({ 
        boards: state.boards.map(b => 
          b._id === boardId ? updatedBoard : b
        ),
        currentBoard: state.currentBoard?._id === boardId ? updatedBoard : state.currentBoard,
        isLoading: false 
      }));
      
      return updatedBoard;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update board';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Delete a board
  deleteBoard: async (boardId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/boards/${boardId}`);
      
      set(state => ({ 
        boards: state.boards.filter(b => b._id !== boardId),
        currentBoard: state.currentBoard?._id === boardId ? null : state.currentBoard,
        isLoading: false 
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete board';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Add column to board
  addColumn: async (boardId, columnData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/boards/${boardId}/columns`, columnData);
      const updatedBoard = response.data;
      
      set(state => ({ 
        boards: state.boards.map(b => 
          b._id === boardId ? updatedBoard : b
        ),
        currentBoard: updatedBoard,
        isLoading: false 
      }));
      
      return updatedBoard;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add column';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Update column
  updateColumn: async (boardId, columnId, columnData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/boards/${boardId}/columns/${columnId}`, columnData);
      const updatedBoard = response.data;
      
      set(state => ({ 
        boards: state.boards.map(b => 
          b._id === boardId ? updatedBoard : b
        ),
        currentBoard: updatedBoard,
        isLoading: false 
      }));
      
      return updatedBoard;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update column';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Delete column
  deleteColumn: async (boardId, columnId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete(`/boards/${boardId}/columns/${columnId}`);
      const updatedBoard = response.data;
      
      set(state => ({ 
        boards: state.boards.map(b => 
          b._id === boardId ? updatedBoard : b
        ),
        currentBoard: updatedBoard,
        isLoading: false 
      }));
      
      return updatedBoard;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete column';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Reorder columns
  reorderColumns: async (boardId, columnOrder) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/boards/${boardId}/columns/reorder`, { columnOrder });
      const updatedBoard = response.data;
      
      set(state => ({ 
        boards: state.boards.map(b => 
          b._id === boardId ? updatedBoard : b
        ),
        currentBoard: updatedBoard,
        isLoading: false 
      }));
      
      return updatedBoard;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reorder columns';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Create a task
  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/tasks', taskData);
      const newTask = response.data;
      
      set(state => {
        // Find the column and add the task ID
        const updatedBoard = { ...state.currentBoard };
        const columnIndex = updatedBoard.columns.findIndex(
          col => col._id === taskData.columnId
        );
        
        if (columnIndex !== -1) {
          updatedBoard.columns[columnIndex].taskIds.push(newTask._id);
        }
        
        return { 
          tasks: [...state.tasks, newTask],
          currentBoard: updatedBoard,
          isLoading: false 
        };
      });
      
      // Emit task update via socket
      emitTaskUpdate({
        taskId: newTask._id,
        boardId: taskData.boardId,
        action: 'created'
      });
      
      return newTask;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create task';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Update a task
  updateTask: async (taskId, taskData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      const updatedTask = response.data;
      
      set(state => ({ 
        tasks: state.tasks.map(t => 
          t._id === taskId ? updatedTask : t
        ),
        isLoading: false 
      }));
      
      // Emit task update via socket
      emitTaskUpdate({
        taskId,
        boardId: updatedTask.board,
        action: 'updated'
      });
      
      return updatedTask;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update task';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Delete a task
  deleteTask: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const task = get().tasks.find(t => t._id === taskId);
      await api.delete(`/tasks/${taskId}`);
      
      set(state => {
        // Find the column and remove the task ID
        const updatedBoard = { ...state.currentBoard };
        const columnIndex = updatedBoard.columns.findIndex(
          col => col._id === task.column
        );
        
        if (columnIndex !== -1) {
          updatedBoard.columns[columnIndex].taskIds = updatedBoard.columns[columnIndex].taskIds.filter(
            id => id !== taskId
          );
        }
        
        return { 
          tasks: state.tasks.filter(t => t._id !== taskId),
          currentBoard: updatedBoard,
          isLoading: false 
        };
      });
      
      // Emit task update via socket
      emitTaskUpdate({
        taskId,
        boardId: task.board,
        action: 'deleted'
      });
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete task';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
  
  // Move a task between columns
  moveTask: async (taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex) => {
    try {
      const state = get();
      const task = state.tasks.find(t => t._id === taskId);
      
      if (!task) return;
      
      // Optimistically update the UI
      set(state => {
        const updatedBoard = { ...state.currentBoard };
        
        // Find source and destination columns
        const sourceColumnIndex = updatedBoard.columns.findIndex(
          col => col._id === sourceColumnId
        );
        
        const destinationColumnIndex = updatedBoard.columns.findIndex(
          col => col._id === destinationColumnId
        );
        
        if (sourceColumnIndex !== -1 && destinationColumnIndex !== -1) {
          // Remove from source column
          const taskIds = [...updatedBoard.columns[sourceColumnIndex].taskIds];
          taskIds.splice(sourceIndex, 1);
          updatedBoard.columns[sourceColumnIndex].taskIds = taskIds;
          
          // Add to destination column
          const destTaskIds = [...updatedBoard.columns[destinationColumnIndex].taskIds];
          destTaskIds.splice(destinationIndex, 0, taskId);
          updatedBoard.columns[destinationColumnIndex].taskIds = destTaskIds;
        }
        
        return { currentBoard: updatedBoard };
      });
      
      // Update task on the server
      await api.put(`/tasks/${taskId}/move`, {
        columnId: destinationColumnId,
        order: destinationIndex
      });
      
      // Emit task move via socket
      emitTaskMove({
        taskId,
        boardId: task.board,
        sourceColumnId,
        destinationColumnId,
        sourceIndex,
        destinationIndex
      });
      
      // Update the task in the local state
      set(state => ({
        tasks: state.tasks.map(t => 
          t._id === taskId 
            ? { ...t, column: destinationColumnId, order: destinationIndex } 
            : t
        )
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to move task';
      set({ error: errorMessage });
      
      // Revert the optimistic update by refetching the board
      await get().fetchBoard(get().currentBoard._id);
      
      throw new Error(errorMessage);
    }
  },
  
  // Handle task update from socket
  handleTaskUpdate: (data) => {
    const { taskId, action } = data;
    
    if (action === 'updated') {
      // Refetch the task
      api.get(`/tasks/${taskId}`)
        .then(response => {
          set(state => ({
            tasks: state.tasks.map(t => 
              t._id === taskId ? response.data : t
            )
          }));
        })
        .catch(error => console.error('Error fetching updated task:', error));
    } else if (action === 'created' || action === 'deleted') {
      // Refetch the entire board for simplicity
      const boardId = get().currentBoard?._id;
      if (boardId) {
        get().fetchBoard(boardId);
      }
    }
  },
  
  // Handle task move from socket
  handleTaskMove: (data) => {
    const { taskId, destinationColumnId, destinationIndex } = data;
    
    set(state => {
      // Find the task
      const task = state.tasks.find(t => t._id === taskId);
      if (!task) return state;
      
      // Find the source column
      const sourceColumnId = task.column;
      const updatedBoard = { ...state.currentBoard };
      
      // Find source and destination columns
      const sourceColumnIndex = updatedBoard.columns.findIndex(
        col => col._id === sourceColumnId
      );
      
      const destinationColumnIndex = updatedBoard.columns.findIndex(
        col => col._id === destinationColumnId
      );
      
      if (sourceColumnIndex !== -1 && destinationColumnIndex !== -1) {
        // Remove from source column
        updatedBoard.columns[sourceColumnIndex].taskIds = 
          updatedBoard.columns[sourceColumnIndex].taskIds.filter(id => id !== taskId);
        
        // Add to destination column
        const destTaskIds = [...updatedBoard.columns[destinationColumnIndex].taskIds];
        destTaskIds.splice(destinationIndex, 0, taskId);
        updatedBoard.columns[destinationColumnIndex].taskIds = destTaskIds;
      }
      
      // Update the task
      const updatedTasks = state.tasks.map(t => 
        t._id === taskId 
          ? { ...t, column: destinationColumnId, order: destinationIndex } 
          : t
      );
      
      return { 
        currentBoard: updatedBoard,
        tasks: updatedTasks
      };
    });
  },
  
  // Clear current board
  clearCurrentBoard: () => {
    set({ currentBoard: null, tasks: [] });
  },
  
  // Clear error
  clearError: () => set({ error: null }),
}));
