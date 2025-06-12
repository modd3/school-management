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
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
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
    // Backend's logout endpoint clears the httpOnly cookie
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST', 
    });
    return handleResponse(response);
};

// Function to fetch user profile (to verify login status)
export const getProfile = async () => {
    // Since our backend uses httpOnly cookies, the browser automatically sends the cookie.
    // No need to manually add Authorization header here.
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return handleResponse(response);
};