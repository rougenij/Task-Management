import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useTaskStore } from '../../../store/taskStore';
import { useAuthStore } from '../../../store/authStore';

// Icons
import { 
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const CommentSection = ({ taskId }) => {
  const { user } = useAuthStore();
  const { comments, fetchComments, addComment, updateComment, deleteComment } = useTaskStore();
  const [isLoading, setIsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm();
  
  const { 
    register: registerEdit, 
    handleSubmit: handleSubmitEdit, 
    setValue: setEditValue
  } = useForm();
  
  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true);
      try {
        await fetchComments(taskId);
      } catch (error) {
        toast.error('Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadComments();
  }, [taskId, fetchComments]);
  
  // Handle new comment submission
  const onSubmitComment = async (data) => {
    setIsLoading(true);
    try {
      await addComment(taskId, data.content);
      reset();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start editing a comment
  const startEditing = (comment) => {
    setEditingCommentId(comment._id);
    setEditValue('editContent', comment.content);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingCommentId(null);
  };
  
  // Handle comment update
  const onSubmitEdit = async (data) => {
    setIsLoading(true);
    try {
      await updateComment(editingCommentId, data.editContent);
      setEditingCommentId(null);
    } catch (error) {
      toast.error('Failed to update comment');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setIsLoading(true);
      try {
        await deleteComment(commentId);
        toast.success('Comment deleted');
      } catch (error) {
        toast.error('Failed to delete comment');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700">Comments</h3>
      
      {/* Comment list */}
      <div className="mt-3 space-y-4">
        {isLoading && comments.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8 rounded-full"
                  src={comment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&background=random`}
                  alt={comment.author.name}
                />
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2 sm:px-6 sm:py-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {comment.author.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                
                {editingCommentId === comment._id ? (
                  <form onSubmit={handleSubmitEdit(onSubmitEdit)}>
                    <textarea
                      className="input mt-1 text-sm"
                      rows={2}
                      {...registerEdit('editContent', { required: true })}
                    ></textarea>
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="text-xs text-primary-600 hover:text-primary-700"
                        disabled={isLoading}
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    
                    {/* Comment actions */}
                    {user._id === comment.author._id && (
                      <div className="mt-2 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => startEditing(comment)}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* New comment form */}
      <div className="mt-6">
        <form onSubmit={handleSubmit(onSubmitComment)}>
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <img
                className="h-8 w-8 rounded-full"
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                alt={user.name}
              />
            </div>
            <div className="flex-1 relative">
              <textarea
                className={`input pr-10 ${errors.content ? 'border-red-500' : ''}`}
                placeholder="Add a comment..."
                rows={2}
                {...register('content', { required: 'Comment cannot be empty' })}
              ></textarea>
              <button
                type="submit"
                className="absolute right-2 bottom-2 text-primary-600 hover:text-primary-700"
                disabled={isLoading}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          {errors.content && (
            <p className="mt-1 text-sm text-red-600 ml-11">{errors.content.message}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CommentSection;
