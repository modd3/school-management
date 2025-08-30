import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* School logo/branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            School Management System
          </h1>
          <p className="text-gray-600">
            Empowering Education Through Technology
          </p>
        </div>
        
        {/* Auth form content */}
        <div className="bg-white shadow-xl rounded-lg p-8">
          <Outlet />
        </div>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          &copy; 2024 School Management System. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
