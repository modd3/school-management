import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaKey, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNotifications } from '@/hooks';
import { useForgotPasswordMutation } from '@/store/api/authApi';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { success: notifySuccess, error: notifyError } = useNotifications();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    try {
      const response = await forgotPassword({ email }).unwrap();
      setIsSubmitted(true);
      notifySuccess(
        response.message || 
        'If an account with that email exists, a password reset link has been sent.'
      );
    } catch (error: any) {
      console.error('Forgot password error:', error);
      notifyError(
        error?.data?.message || 
        error?.message || 
        'Error sending password reset email. Please try again.'
      );
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="bg-green-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <FaEnvelope className="text-3xl text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/login"
            className="flex items-center justify-center space-x-2 w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <FaArrowLeft />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6">
        <FaKey className="mx-auto text-6xl text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Forgot Password?
        </h2>
        <p className="text-gray-600">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="email"
            placeholder="Enter your email address"
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Sending...
            </>
          ) : (
            'Send Reset Instructions'
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

export default ForgotPasswordPage;
