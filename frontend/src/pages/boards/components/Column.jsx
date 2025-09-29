import { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import Task from './Task';
import { useBoardStore } from '../../../store/boardStore';
import { toast } from 'react-hot-toast';

// Icons
import { 
  PlusIcon, 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Column = ({ column, tasks, index, openTaskModal }) => {
  const { updateColumn, deleteColumn } = useBoardStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Handle column title update
  const handleUpdateTitle = async () => {
    if (title.trim() === '') {
      toast.error('Column title cannot be empty');
      return;
    }
    
    try {
      await updateColumn(column.board, column._id, { title });
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update column');
    }
  };
  
  // Handle column deletion
  const handleDeleteColumn = async () => {
    try {
      await deleteColumn(column.board, column._id);
      toast.success('Column deleted successfully');
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      toast.error('Failed to delete column');
    }
  };
  
  return (
    <Draggable draggableId={column._id} index={index}>
      {(provided) => (
        <div
          className="flex-shrink-0 w-72"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="bg-gray-100 rounded-md shadow">
            {/* Column header */}
            <div
              className="p-2 flex items-center justify-between bg-gray-200 rounded-t-md"
              {...provided.dragHandleProps}
            >
              {isEditing ? (
                <div className="flex-1 flex">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleUpdateTitle}
                    className="ml-1 p-1 text-green-600 hover:text-green-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTitle(column.title);
                      setIsEditing(false);
                    }}
                    className="ml-1 p-1 text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <h3 className="font-medium text-gray-900 truncate">
                  {column.title} <span className="text-gray-500 text-sm">({tasks.length})</span>
                </h3>
              )}
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
                
                {isMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsEditing(true);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <PencilIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Edit Column
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          openTaskModal({ column: column._id, board: column.board });
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <PlusIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Add Task
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <TrashIcon className="mr-3 h-5 w-5 text-red-400" />
                        Delete Column
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tasks */}
            <Droppable droppableId={column._id} type="task">
              {(provided, snapshot) => (
                <div
                  className={`p-2 min-h-[200px] ${
                    snapshot.isDraggingOver ? 'bg-blue-50' : ''
                  }`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {tasks.map((task, index) => (
                    <Task 
                      key={task._id} 
                      task={task} 
                      index={index}
                      onClick={() => openTaskModal(task)}
                    />
                  ))}
                  {provided.placeholder}
                  
                  {/* Add task button */}
                  <button
                    type="button"
                    onClick={() => openTaskModal({ column: column._id, board: column.board })}
                    className="mt-2 w-full py-2 flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Task
                  </button>
                </div>
              )}
            </Droppable>
          </div>
          
          {/* Delete confirmation modal */}
          {isDeleteConfirmOpen && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
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
                          Delete Column
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete the column "{column.title}"? All tasks in this column will be deleted. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={handleDeleteColumn}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Column;
