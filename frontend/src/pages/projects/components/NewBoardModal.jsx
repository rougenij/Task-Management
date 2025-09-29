import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useBoardStore } from '../../../store/boardStore';

// Icons
import { XMarkIcon } from '@heroicons/react/24/outline';

const NewBoardModal = ({ isOpen, onClose, projectId }) => {
  const { createBoard } = useBoardStore();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm();
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const newBoard = await createBoard({
        title: data.title,
        description: data.description,
        projectId
      });
      
      toast.success('Board created successfully');
      reset();
      onClose();
      
      // Navigate to the new board
      navigate(`/boards/${newBoard._id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create board');
    } finally {
      setIsLoading(false);
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
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New Board
                </h3>
                
                <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  <div>
                    <label htmlFor="title" className="label">
                      Board Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      className={`input ${errors.title ? 'border-red-500' : ''}`}
                      {...register('title', { 
                        required: 'Board title is required',
                        minLength: {
                          value: 3,
                          message: 'Board title must be at least 3 characters'
                        }
                      })}
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
                  
                  <div className="sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Board'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBoardModal;
