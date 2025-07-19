// frontend/src/api/terms.js
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

// Fetch all terms
export const getTerms = async () => {
    const response = await fetch(`${API_BASE_URL}/terms`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Create a new term
export const createTerm = async (termData) => {
    const response = await fetch(`${API_BASE_URL}/admin/terms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(termData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Fetch a single term by ID
export const getTermById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/terms/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Update a term
export const updateTerm = async (id, termData) => {
    const response = await fetch(`${API_BASE_URL}/admin/terms/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(termData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Delete a term (typically soft delete or deactivate in school systems)
export const deleteTerm = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/terms/${id}`, {
        method: 'DELETE', // Assuming your backend delete method
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};