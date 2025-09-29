import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const AuthCallback = () => {
  const { authenticateWithToken } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      toast.error('Authentication failed. No token received.');
      navigate('/login');
      return;
    }
    
    const handleAuthentication = async () => {
      try {
        await authenticateWithToken(token);
        toast.success('Authentication successful!');
        navigate('/dashboard');
      } catch (error) {
        toast.error(error.message || 'Authentication failed. Please try again.');
        navigate('/login');
      }
    };
    
    handleAuthentication();
  }, [searchParams, authenticateWithToken, navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
      <h2 className="text-xl font-semibold">Authenticating...</h2>
      <p className="text-gray-500 mt-2">Please wait while we complete the authentication process.</p>
    </div>
  );
};

export default AuthCallback;
