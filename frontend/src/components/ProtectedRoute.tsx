import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '@/hooks';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requiredPermissions,
  fallbackPath = '/login',
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { hasAnyPermission, hasAnyRole } = usePermissions();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check if user's account is active
  if (!user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Deactivated</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your account has been deactivated. Please contact the administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Check if account is locked
  if (user.isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <div className="text-yellow-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Locked</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your account has been temporarily locked due to multiple failed login attempts.
            Please try again later or contact support.
          </p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access this page.
          </p>
          <div className="text-sm text-gray-500">
            Required roles: {allowedRoles.join(', ')}<br />
            Your role: {user.role}
          </div>
        </div>
      </div>
    );
  }

  // Check permission-based access
  if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Insufficient Permissions</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have the required permissions to access this feature.
          </p>
        </div>
      </div>
    );
  }

  // Render children or outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
