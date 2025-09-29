import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const Profile = () => {
  const { user, updateProfile, updatePassword } = useAuthStore();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const { 
    register: registerProfile, 
    handleSubmit: handleSubmitProfile, 
    formState: { errors: profileErrors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      avatar: user?.avatar || ''
    }
  });
  
  const { 
    register: registerPassword, 
    handleSubmit: handleSubmitPassword, 
    formState: { errors: passwordErrors },
    watch,
    reset: resetPassword
  } = useForm();
  
  const newPassword = watch('newPassword', '');
  
  // Handle profile update
  const onSubmitProfile = async (data) => {
    setIsUpdatingProfile(true);
    
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  // Handle password update
  const onSubmitPassword = async (data) => {
    setIsUpdatingPassword(true);
    
    try {
      await updatePassword(data.currentPassword, data.newPassword);
      toast.success('Password updated successfully');
      resetPassword();
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Personal Information
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Update your account details and profile picture.
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className={`input ${profileErrors.name ? 'border-red-500' : ''}`}
                {...registerProfile('name', { 
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
              />
              {profileErrors.name && (
                <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="input bg-gray-100"
                value={user?.email || ''}
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">
                Email address cannot be changed.
              </p>
            </div>
            
            <div>
              <label htmlFor="avatar" className="label">
                Avatar URL (optional)
              </label>
              <input
                id="avatar"
                type="text"
                className="input"
                placeholder="https://example.com/avatar.jpg"
                {...registerProfile('avatar')}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter a URL for your profile picture.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Change Password
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Update your password to keep your account secure.
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="label">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                className={`input ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                {...registerPassword('currentPassword', { 
                  required: 'Current password is required'
                })}
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="newPassword" className="label">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                className={`input ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                {...registerPassword('newPassword', { 
                  required: 'New password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`input ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                {...registerPassword('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || 'Passwords do not match'
                })}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
