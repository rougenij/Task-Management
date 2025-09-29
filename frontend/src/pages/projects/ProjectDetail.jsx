import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useProjectStore } from '../../store/projectStore';
import { useBoardStore } from '../../store/boardStore';
import { joinProject, leaveProject } from '../../services/socket';
import NewBoardModal from './components/NewBoardModal';
import EditProjectModal from './components/EditProjectModal';
import MembersModal from './components/MembersModal';

// Icons
import { 
  PlusIcon, 
  UsersIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, fetchProject, deleteProject } = useProjectStore();
  const { boards, fetchProjectBoards } = useBoardStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    const loadProjectData = async () => {
      setIsLoading(true);
      try {
        await fetchProject(projectId);
        await fetchProjectBoards(projectId);
        
        // Join socket room for real-time updates
        joinProject(projectId);
      } catch (error) {
        toast.error('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjectData();
    
    // Clean up when component unmounts
    return () => {
      leaveProject(projectId);
    };
  }, [projectId, fetchProject, fetchProjectBoards]);
  
  // Handle project deletion
  const handleDeleteProject = async () => {
    setIsLoading(true);
    
    try {
      await deleteProject(projectId);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      toast.error(error.message || 'Failed to delete project');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-lg font-medium text-gray-900">Project not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
        <div className="mt-6">
          <Link to="/projects" className="btn btn-primary">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Project header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link to="/projects" className="text-gray-500 hover:text-gray-700 mr-2">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
        </div>
        
        {currentProject.description && (
          <p className="text-gray-500 mb-4">{currentProject.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditProjectModalOpen(true)}
            className="btn btn-secondary"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit Project
          </button>
          
          <button
            type="button"
            onClick={() => setIsMembersModalOpen(true)}
            className="btn btn-secondary"
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Members ({currentProject.members.length})
          </button>
          
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-danger"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete Project
          </button>
        </div>
      </div>
      
      {/* Boards section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Boards</h2>
          <button
            type="button"
            onClick={() => setIsNewBoardModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Board
          </button>
        </div>
        
        {boards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No boards</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new board.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsNewBoardModalOpen(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Board
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Link
                key={board._id}
                to={`/boards/${board._id}`}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{board.title}</h3>
                  {board.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {board.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span>
                        {board.columns ? `${board.columns.length} columns` : 'No columns'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            <button
              type="button"
              onClick={() => setIsNewBoardModalOpen(true)}
              className="bg-gray-50 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 flex items-center justify-center"
            >
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                  <PlusIcon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Create a new board</h3>
              </div>
            </button>
          </div>
        )}
      </div>
      
      {/* Modals */}
      <NewBoardModal
        isOpen={isNewBoardModalOpen}
        onClose={() => setIsNewBoardModalOpen(false)}
        projectId={projectId}
      />
      
      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={currentProject}
      />
      
      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        project={currentProject}
      />
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
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
                      Delete Project
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the project "{currentProject.name}"? All boards and tasks will be permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
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
  );
};

export default ProjectDetail;
