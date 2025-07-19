import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaUserPlus, FaSignInAlt } from 'react-icons/fa'; // User, Lock, Register, Login icons
import { HiOutlineMail } from "react-icons/hi"; // Email icon
import { MdOutlineWork } from "react-icons/md"; // Role icon

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'student', // Default role for registration
  });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { user, register } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'admin') {
    return <div className="text-red-500 text-center mt-8">Access denied. Only admins can create users.</div>;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (formData.password !== formData.passwordConfirm) {
      setMessage('Passwords do not match!');
      return;
    }

    try {
      const { success, message: responseMessage } = await register(formData);
      if (success) {
        setMessage(responseMessage || 'Registration successful! You can now log in.');
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 2000); // Redirect after 2 seconds
      } else {
        setMessage(responseMessage || 'Registration failed.');
        setIsSuccess(false);
      }
    } catch (err) {
      setMessage(err.message || 'An unexpected error occurred during registration.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-blue-600 mb-6 flex items-center justify-center gap-2">
          <FaUserPlus className="text-4xl" /> Register
        </h2>

        {message && (
          <p className={`${isSuccess ? 'text-green-500' : 'text-red-500'} mb-4`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="firstName"
              name="firstName"
              placeholder="First Name"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Last Name */}
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Last Name"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="relative">
            <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              placeholder="Confirm Password"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
            />
          </div>

          {/* Role Selection */}
          <div className="relative">
            <MdOutlineWork className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              id="role"
              name="role"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              {/* Teacher/Admin roles should typically not be self-registered */}
            </select>
            {/* Optional: Add a custom arrow for select if default appearance-none is used */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z"/></svg>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <FaUserPlus /> Register Account
          </button>
        </form>

        <div className="mt-6 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
            <FaSignInAlt /> Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;