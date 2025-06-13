// frontend/src/api/classes.js
import handleResponse from '../utils/handleResponse';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Fetch all classes
export const getClasses = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/classes`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Create a new class
export const createClass = async (classData) => {
    const response = await fetch(`${API_BASE_URL}/admin/classes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Fetch a single class by ID
export const getClassById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/classes/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Update a class
export const updateClass = async (id, classData) => {
    const response = await fetch(`${API_BASE_URL}/admin/classes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(classData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Delete a class
export const deleteClass = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/classes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};