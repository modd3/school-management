import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaInfoCircle } from 'react-icons/fa';

const RegisterPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6">
        <FaUserPlus className="mx-auto text-6xl text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Registration
        </h2>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center space-x-2 text-blue-800 mb-2">
          <FaInfoCircle />
          <span className="font-medium">Registration Notice</span>
        </div>
        <p className="text-sm text-blue-700">
          User registration is restricted to administrators only. 
          Please contact your system administrator to create a new account.
        </p>
      </div>
      
      <div className="space-y-4">
        <Link
          to="/login"
          className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Back to Login
        </Link>
        
        <Link
          to="/forgot-password"
          className="block w-full text-blue-600 hover:text-blue-800 transition-colors"
        >
          Forgot Password?
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
