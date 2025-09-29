import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useBoardStore } from '../../store/boardStore';
import { joinBoard, leaveBoard } from '../../services/socket';
import Column from './components/Column';
import TaskModal from './components/TaskModal';
import NewColumnModal from './components/NewColumnModal';

// Icons
import { 
  PlusIcon, 
  ArrowPathIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';

const Board = () => {
  const { boardId } = useParams();
  const { 
    currentBoard, 
    tasks, 
    fetchBoard, 
    moveTask,
    reorderColumns
  } = useBoardStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isNewColumnModalOpen, setIsNewColumnModalOpen] = useState(false);
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  
  useEffect(() => {
    const loadBoard = async () => {
      setIsLoading(true);
      try {
        await fetchBoard(boardId);
        
        // Join socket room for real-time updates
        joinBoard(boardId);
      } catch (error) {
        toast.error('Failed to load board');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBoard();
    
    // Clean up when component unmounts
    return () => {
      leaveBoard(boardId);
    };
  }, [boardId, fetchBoard]);
  
  // Handle drag end
  const handleDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    
    // If there's no destination or the item was dropped back in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // If dragging columns
    if (type === 'column') {
      const newColumnOrder = Array.from(currentBoard.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);
      
      reorderColumns(boardId, newColumnOrder);
      return;
    }
    
    // If dragging tasks
    moveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };
  
  // Open task modal
  const openTaskModal = (task = null) => {
    setSelectedTask(task);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!currentBoard) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-lg font-medium text-gray-900">Board not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The board you're looking for doesn't exist or you don't have access to it.
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-full">
      {/* Board header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentBoard.title}</h1>
            {currentBoard.description && (
              <p className="mt-1 text-sm text-gray-500">{currentBoard.description}</p>
            )}
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            type="button"
            onClick={() => fetchBoard(boardId)}
            className="btn btn-secondary"
            title="Refresh board"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          
          <button
            type="button"
            onClick={() => setIsNewColumnModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Column
          </button>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBoardMenuOpen(!isBoardMenuOpen)}
              className="btn btn-secondary"
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
            
            {isBoardMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    type="button"
                    onClick={() => {
                      // Open modal to edit board
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Edit Board
                  </button>
                  <button
                    type="button"
                    onClick={() => openTaskModal()}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Kanban board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <div
              className="flex space-x-4 overflow-x-auto pb-4"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {currentBoard.columnOrder.map((columnId, index) => {
                const column = currentBoard.columns.find(col => col._id === columnId);
                if (!column) return null;
                
                const columnTasks = column.taskIds
                  .map(taskId => tasks.find(task => task._id === taskId))
                  .filter(Boolean);
                
                return (
                  <Column
                    key={column._id}
                    column={column}
                    tasks={columnTasks}
                    index={index}
                    openTaskModal={openTaskModal}
                  />
                );
              })}
              {provided.placeholder}
              
              <div className="flex-shrink-0 w-72">
                <button
                  type="button"
                  onClick={() => setIsNewColumnModalOpen(true)}
                  className="w-full h-16 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Column
                </button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {/* Task Modal */}
      <TaskModal
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        boardId={boardId}
        columns={currentBoard.columns}
      />
      
      {/* New Column Modal */}
      <NewColumnModal
        isOpen={isNewColumnModalOpen}
        onClose={() => setIsNewColumnModalOpen(false)}
        boardId={boardId}
      />
    </div>
  );
};

export default Board;
