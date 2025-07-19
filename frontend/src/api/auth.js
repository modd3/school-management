// src/api/auth.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Something went wrong');
  }
  return response.json();
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  // The backend sets an httpOnly cookie, so no token is returned in the body typically.
  // The backend's response should indicate success.
  return handleResponse(response);
};

export const registerUser = async (userData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/admin/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register user');
  }
  return response.json();
};

export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgotpassword`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
};

export const resetPassword = async (token, password, passwordConfirm) => {
  const response = await fetch(`${API_BASE_URL}/auth/resetpassword/${token}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password, passwordConfirm }),
  });
  return handleResponse(response);
};

export const logoutUser = async () => {
  const token = localStorage.getItem('token'); 
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  localStorage.removeItem('token'); // Remove token after logout
  return response.json();
};

// Function to fetch user profile (to verify login status)
export const getProfile = async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        }
    });
    return handleResponse(response);
};