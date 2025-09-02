import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaLock, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNotifications } from '@/hooks';
import { useResetPasswordMutation } from '@/store/api/authApi';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { token } = useParams<{ token: string }>();
  const { success: notifySuccess, error: notifyError } = useNotifications();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (password !== passwordConfirm) {
      notifyError('Passwords do not match!');
      return;
    }

    if (!token) {
      notifyError('Invalid reset token');
      return;
    }

    try {
      const response = await resetPassword({
        token,
        password,
        passwordConfirm
      }).unwrap();
      
      setIsSuccess(true);
      notifySuccess(
        response.message || 
        'Password has been reset successfully. Redirecting to login...'
      );
      
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      notifyError(
        error?.data?.message || 
        error?.message || 
        'Error resetting password. Invalid or expired token.'
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="bg-green-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <FaCheck className="text-3xl text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Password Reset Successful
          </h2>
          <p className="text-gray-600">
            Your password has been reset successfully. You will be redirected to the login page shortly.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/login"
            className="flex items-center justify-center space-x-2 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <span>Go to Login</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6">
        <FaLock className="mx-auto text-6xl text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Reset Password
        </h2>
        <p className="text-gray-600">
          Enter your new password below
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="password"
            placeholder="New Password"
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={8}
          />
        </div>
        
        <div className="relative">
          <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            disabled={isLoading}
            required
            minLength={8}
          />
        </div>
        
        {password && passwordConfirm && password !== passwordConfirm && (
          <p className="text-red-500 text-sm text-left">
            Passwords do not match
          </p>
        )}
        
        <button
          type="submit"
          disabled={isLoading || (password !== passwordConfirm && password && passwordConfirm)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Resetting Password...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
      
      <div className="mt-6">
        <Link
          to="/login"
          className="flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FaArrowLeft />
          <span>Back to Login</span>
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
