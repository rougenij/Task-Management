import { Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';

// Icons
import { 
  ChatBubbleLeftIcon, 
  PaperClipIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const Task = ({ task, index, onClick }) => {
  // Format due date if it exists
  const formattedDueDate = task.dueDate 
    ? format(new Date(task.dueDate), 'MMM d')
    : null;
  
  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`mb-2 p-3 bg-white rounded-md shadow ${
            snapshot.isDragging ? 'shadow-lg' : ''
          } hover:shadow-md transition-shadow cursor-pointer`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
        >
          <h4 className="font-medium text-gray-900">{task.title}</h4>
          
          {task.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}
          
          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
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
          )}
          
          {/* Task footer */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              {/* Due date */}
              {formattedDueDate && (
                <div className={`flex items-center ${isOverdue ? 'text-red-500' : ''}`}>
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  <span>{formattedDueDate}</span>
                </div>
              )}
              
              {/* Comments count */}
              {task.commentsCount > 0 && (
                <div className="flex items-center">
                  <ChatBubbleLeftIcon className="h-3.5 w-3.5 mr-1" />
                  <span>{task.commentsCount}</span>
                </div>
              )}
              
              {/* Attachments count */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center">
                  <PaperClipIcon className="h-3.5 w-3.5 mr-1" />
                  <span>{task.attachments.length}</span>
                </div>
              )}
            </div>
            
            {/* Assignees */}
            {task.assignedTo && task.assignedTo.length > 0 && (
              <div className="flex -space-x-1 overflow-hidden">
                {task.assignedTo.slice(0, 3).map((user) => (
                  <img
                    key={user._id}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                    alt={user.name}
                    title={user.name}
                  />
                ))}
                {task.assignedTo.length > 3 && (
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-xs font-medium text-gray-500 ring-2 ring-white">
                    +{task.assignedTo.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Task;
