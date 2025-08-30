import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { 
  FaBars, 
  FaBell, 
  FaUser, 
  FaCog, 
  FaSignOutAlt, 
  FaMoon, 
  FaSun,
  FaChevronDown
} from 'react-icons/fa';
import { useAuth, useTheme, useNotifications } from '@/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { formatName } from '@/utils/formatters';
import type { RootState } from '@/store';

export const Header: React.FC = () => {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useNotifications();
  
  const breadcrumbs = useSelector((state: RootState) => state.ui.breadcrumbs);
  const unreadNotifications = notifications.filter(n => !n.persistent);

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Sidebar toggle and breadcrumbs */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSidebarToggle}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <FaBars className="h-5 w-5" />
          </button>
          
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <span className="mx-2 text-gray-400">/</span>
                    )}
                    {crumb.href ? (
                      <Link
                        to={crumb.href}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-900 dark:text-white text-sm font-medium">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>

        {/* Right side - Notifications, theme toggle, user menu */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <FaSun className="h-5 w-5" />
            ) : (
              <FaMoon className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          <Menu as="div" className="relative">
            <MenuButton className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
              <FaBell className="h-5 w-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 text-xs text-white rounded-full flex items-center justify-center">
                  {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                </span>
              )}
            </MenuButton>
            
            <MenuItems className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Notifications
                </h3>
                {unreadNotifications.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No new notifications
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {unreadNotifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'error' ? 'bg-red-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            {notification.title && (
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </MenuItems>
          </Menu>

          {/* User menu */}
          <Menu as="div" className="relative">
            <MenuButton className="flex items-center space-x-2 p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">
                  {user ? formatName(user.firstName, user.lastName) : 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
              <FaChevronDown className="h-3 w-3" />
            </MenuButton>
            
            <MenuItems className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="py-1">
                <MenuItem>
                  {({ focus }) => (
                    <button
                      className={`${focus ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                    >
                      <FaUser className="mr-3 h-4 w-4" />
                      Profile
                    </button>
                  )}
                </MenuItem>
                
                <MenuItem>
                  {({ focus }) => (
                    <button
                      className={`${focus ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                    >
                      <FaCog className="mr-3 h-4 w-4" />
                      Settings
                    </button>
                  )}
                </MenuItem>
                
                <hr className="my-1 border-gray-200 dark:border-gray-600" />
                
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleLogout}
                      className={`${focus ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                    >
                      <FaSignOutAlt className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;
