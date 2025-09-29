import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { initSocket, closeSocket } from '../services/socket';

// Icons
import { 
  HomeIcon, 
  ViewColumnsIcon, 
  UserGroupIcon, 
  BellIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const DashboardLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Initialize socket and fetch notifications on mount
  useEffect(() => {
    const socket = initSocket();
    fetchNotifications();
    
    // Listen for new notifications
    if (socket) {
      socket.on('notification:new', (notification) => {
        fetchNotifications();
      });
    }
    
    return () => {
      closeSocket();
    };
  }, [fetchNotifications]);
  
  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: ViewColumnsIcon },
  ];
  
  // Check if a navigation item is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="fixed inset-0 flex z-40">
          {/* Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          
          {/* Mobile sidebar */}
          <div 
            className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-primary-700 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between h-16 px-4 bg-primary-800">
              <div className="flex items-center">
                <span className="text-white text-xl font-semibold">Task Management</span>
              </div>
              <button
                className="text-white focus:outline-none"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <nav className="px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive(item.href)
                        ? 'bg-primary-800 text-white'
                        : 'text-white hover:bg-primary-600'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon
                      className="mr-4 h-6 w-6 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="border-t border-primary-600 p-4">
              <Link
                to="/profile"
                className="flex items-center text-white hover:bg-primary-600 px-2 py-2 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserCircleIcon className="h-6 w-6 mr-3" />
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-primary-200">{user?.email}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="mt-2 flex items-center w-full text-white hover:bg-primary-600 px-2 py-2 rounded-md"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="flex items-center h-16 px-4 bg-primary-700">
          <span className="text-white text-xl font-semibold">Task Management</span>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-gray-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive(item.href)
                      ? 'text-primary-700'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="border-t border-gray-200 p-4">
          <Link
            to="/profile"
            className="flex items-center hover:bg-gray-50 px-2 py-2 rounded-md"
          >
            <UserCircleIcon className="h-6 w-6 mr-3 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-2 py-2 rounded-md"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-400" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden text-gray-500 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              <Link to="/notifications" className="relative">
                <BellIcon className="h-6 w-6 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
