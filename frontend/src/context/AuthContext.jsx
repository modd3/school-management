// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getProfile, loginUser, logoutUser, registerUser, forgotPassword, resetPassword } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores user details if logged in
  const [loading, setLoading] = useState(true); // To check initial auth status
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Function to check user's authentication status on app load
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const profile = await getProfile(); // Fetch profile to see if user is logged in
      setUser(profile.user); // Assuming backend sends { success: true, user: {...} }
    } catch (err) {
      console.error("Auth check failed:", err.message);
      setUser(null); // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      // The backend sets httpOnly cookie, so the response might just be success message
      const response = await loginUser(email, password);
      // We need to fetch profile after login to get user data if not returned directly
      const profile = await getProfile();
      setUser(profile.user);
      navigate('/dashboard'); // Redirect to dashboard on successful login
      return { success: true, message: response.message || 'Login successful' };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await logoutUser();
      setUser(null);
      navigate('/login'); // Redirect to login after logout
      return { success: true, message: 'Logged out successfully' };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await registerUser(userData);
      return { success: true, message: response.message || 'Registration successful' };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    forgotPassword, // Add forgotPassword to context
    resetPassword   // Add resetPassword to context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};