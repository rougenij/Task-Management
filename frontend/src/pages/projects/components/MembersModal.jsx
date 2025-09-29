import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useProjectStore } from '../../../store/projectStore';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';

// Icons
import { 
  XMarkIcon,
  UserPlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const MembersModal = ({ isOpen, onClose, project }) => {
  const { user } = useAuthStore();
  const { addProjectMember, updateMemberRole, removeMember } = useProjectStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm();
  
  // Check if current user is owner or admin
  const currentMember = project?.members.find(member => member.user._id === user._id);
  const isOwnerOrAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';
  
  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const response = await api.get(`/users/search?query=${searchTerm}`);
        
        // Filter out users who are already members
        const filteredResults = response.data.filter(
          user => !project.members.some(member => member.user._id === user._id)
        );
        
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    const debounceTimer = setTimeout(() => {
      if (searchTerm) {
        searchUsers();
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, project]);
  
  // Add member
  const handleAddMember = async (userId, role = 'member') => {
    setIsLoading(true);
    
    try {
      await addProjectMember(project._id, userId, role);
      toast.success('Member added successfully');
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      toast.error(error.message || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update member role
  const handleRoleChange = async (userId, newRole) => {
    setIsLoading(true);
    
    try {
      await updateMemberRole(project._id, userId, newRole);
      toast.success('Member role updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update member role');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove member
  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      setIsLoading(true);
      
      try {
        await removeMember(project._id, userId);
        toast.success('Member removed successfully');
      } catch (error) {
        toast.error(error.message || 'Failed to remove member');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  if (!isOpen || !project) return null;
  
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
                  Project Members
                </h3>
                
                {/* Add member section (only for owner/admin) */}
                {isOwnerOrAdmin && (
                  <div className="mt-6">
                    <label htmlFor="search" className="label">
                      Add Member
                    </label>
                    <div className="relative">
                      <input
                        id="search"
                        type="text"
                        className="input pr-10"
                        placeholder="Search users by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                        <ul className="divide-y divide-gray-200">
                          {searchResults.map((user) => (
                            <li key={user._id} className="px-4 py-2 flex items-center justify-between">
                              <div className="flex items-center">
                                <img
                                  className="h-8 w-8 rounded-full mr-2"
                                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                  alt={user.name}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddMember(user._id)}
                                className="text-primary-600 hover:text-primary-700"
                                disabled={isLoading}
                              >
                                <UserPlusIcon className="h-5 w-5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {searchTerm && searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
                      <p className="mt-2 text-sm text-gray-500">No users found</p>
                    )}
                  </div>
                )}
                
                {/* Members list */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700">Current Members</h4>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {project.members.map((member) => (
                      <li key={member.user._id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <img
                            className="h-8 w-8 rounded-full mr-2"
                            src={member.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}&background=random`}
                            alt={member.user.name}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.user.name}
                              {member.user._id === user._id && ' (You)'}
                            </p>
                            <p className="text-xs text-gray-500">{member.user.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          {/* Role badge */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.role === 'owner' 
                              ? 'bg-purple-100 text-purple-800' 
                              : member.role === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role}
                          </span>
                          
                          {/* Role dropdown (only for owner/admin) */}
                          {isOwnerOrAdmin && 
                           member.role !== 'owner' && 
                           member.user._id !== user._id && (
                            <div className="ml-2">
                              <select
                                className="text-xs border-gray-300 rounded-md"
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.user._id, e.target.value)}
                                disabled={isLoading}
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          )}
                          
                          {/* Remove button (only for owner/admin) */}
                          {isOwnerOrAdmin && 
                           member.role !== 'owner' && 
                           member.user._id !== user._id && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.user._id)}
                              className="ml-2 text-red-600 hover:text-red-700"
                              disabled={isLoading}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersModal;
