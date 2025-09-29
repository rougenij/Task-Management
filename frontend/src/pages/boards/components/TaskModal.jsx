import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useBoardStore } from '../../../store/boardStore';
import { useTaskStore } from '../../../store/taskStore';
import { useAuthStore } from '../../../store/authStore';
import CommentSection from './CommentSection';

// Icons
import { 
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const TaskModal = ({ isOpen, onClose, task, boardId, columns }) => {
  const { user } = useAuthStore();
  const { createTask, updateTask, deleteTask } = useBoardStore();
  const { fetchComments } = useTaskStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!task?._id);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      columnId: task?.column || (columns?.[0]?._id || ''),
      dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      // Other fields would be set here
    }
  });
  
  // Update form when task changes
  useEffect(() => {
    if (task?._id) {
      reset({
        title: task.title || '',
        description: task.description || '',
        columnId: task.column || '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        // Other fields would be set here
      });
      
      // Load comments if task exists and comments tab is active
      if (showComments) {
        fetchComments(task._id);
      }
    } else {
      reset({
        title: '',
        description: '',
        columnId: columns?.[0]?._id || '',
        dueDate: '',
      });
    }
  }, [task, reset, columns, fetchComments, showComments]);
  
  // Handle form submission
  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      if (task?._id) {
        // Update existing task
        await updateTask(task._id, {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate || null,
          // Other fields would be updated here
        });
        toast.success('Task updated successfully');
      } else {
        // Create new task
        await createTask({
          title: data.title,
          description: data.description,
          boardId,
          columnId: data.columnId,
          dueDate: data.dueDate || null,
          // Other fields would be set here
        });
        toast.success('Task created successfully');
        onClose();
      }
      
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle task deletion
  const handleDeleteTask = async () => {
    setIsLoading(true);
    
    try {
      await deleteTask(task._id);
      toast.success('Task deleted successfully');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to delete task');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="label">
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      className={`input ${errors.title ? 'border-red-500' : ''}`}
                      {...register('title', { required: 'Title is required' })}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="label">
                      Description (optional)
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      className="input"
                      {...register('description')}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="columnId" className="label">
                      Column
                    </label>
                    <select
                      id="columnId"
                      className="input"
                      {...register('columnId', { required: 'Column is required' })}
                    >
                      {columns.map((column) => (
                        <option key={column._id} value={column._id}>
                          {column.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="dueDate" className="label">
                      Due Date (optional)
                    </label>
                    <input
                      id="dueDate"
                      type="date"
                      className="input"
                      {...register('dueDate')}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (task?._id) {
                          setIsEditing(false);
                        } else {
                          onClose();
                        }
                      }}
                      className="btn btn-secondary"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {task.description && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Description</h4>
                    <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      Assigned To
                    </h4>
                    <div className="mt-1">
                      {task.assignedTo && task.assignedTo.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {task.assignedTo.map((user) => (
                            <div key={user._id} className="flex items-center text-sm text-gray-500">
                              <img
                                className="h-6 w-6 rounded-full mr-1"
                                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                alt={user.name}
                              />
                              <span>{user.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not assigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Due Date
                    </h4>
                    <div className="mt-1">
                      {task.dueDate ? (
                        <span className="text-sm text-gray-500">
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">No due date</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <TagIcon className="h-4 w-4 mr-1" />
                      Labels
                    </h4>
                    <div className="mt-1">
                      {task.labels && task.labels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {task.labels.map((label) => (
                            <span
                              key={label._id || label.name}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: label.color + '20', color: label.color }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No labels</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                      Comments
                    </h4>
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => setShowComments(!showComments)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        {showComments ? 'Hide comments' : 'Show comments'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Comments section */}
                {showComments && (
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <CommentSection taskId={task._id} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed z-20 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Task
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this task? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskModal;
