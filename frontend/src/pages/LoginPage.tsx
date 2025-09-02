import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { useNotifications } from '@/hooks';
import { FaUser, FaLock } from 'react-icons/fa';
import { HiOutlineMail } from 'react-icons/hi';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, user, isAuthenticated } = useAuth();
  const { error: notifyError, success: notifySuccess } = useNotifications();
  
  // Redirect if already authenticated
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user });
    if (isAuthenticated && user) {
      console.log('User is authenticated, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
  
  // Debug function to test hooks
  const testHooks = () => {
    console.log('Testing hooks:', { user, isAuthenticated, isLoading });
    notifySuccess('Hooks are working!');
  };
  
  // Test API call directly
  const testAPI = async () => {
    try {
      console.log('Testing direct API call...');
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'test123' }),
      });
      const data = await response.json();
      console.log('Direct API response:', data);
      notifySuccess('Direct API call worked!');
    } catch (error) {
      console.error('Direct API error:', error);
      notifyError('Direct API call failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { email, password });
    
    if (isSubmitting || isLoading) {
      console.log('Already submitting or loading, skipping');
      return;
    }
    
    console.log('Starting login process...');
    setIsSubmitting(true);
    
    try {
      console.log('Calling login function...');
      const result = await login({ email, password });
      console.log('Login successful:', result);
      notifySuccess('Login successful! Redirecting...');
    } catch (error: any) {
      console.error('Login error:', error);
      notifyError(
        error?.data?.message || 
        error?.message || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      console.log('Login process finished');
      setIsSubmitting(false);
    }
  };

  const loading = isLoading || isSubmitting;

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-8">
        <FaUser className="mx-auto text-6xl text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome Back
        </h2>
        <p className="text-gray-600">
          Sign in to access your account
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="email"
            id="email"
            placeholder="Email Address"
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        <div className="relative">
          <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="password"
            id="password"
            placeholder="Password"
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      
      {/* Debug buttons */}
      <div className="mt-6 space-y-2 border-t pt-4 border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Debug Tools:</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={testHooks}
            className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-xs hover:bg-green-600"
          >
            Test Hooks
          </button>
          <button
            type="button"
            onClick={testAPI}
            className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded text-xs hover:bg-yellow-600"
          >
            Test API
          </button>
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        <Link
          to="/forgot-password"
          className="block text-blue-600 hover:text-blue-800 transition-colors"
        >
          Forgot Password?
        </Link>
        
        <Link
          to="/register"
          className="block text-gray-600 hover:text-gray-800 transition-colors text-sm"
        >
          Need an account? Contact Administrator
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
