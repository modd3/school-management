// frontend/src/api/subjects.js
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

// Fetch all subjects
export const getSubjects = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/subjects`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Create a new subject
export const createSubject = async (subjectData) => {
    const response = await fetch(`${API_BASE_URL}/admin/subjects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(subjectData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Fetch a single subject by ID
export const getSubjectById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/subjects/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Update a subject
export const updateSubject = async (id, subjectData) => {
    const response = await fetch(`${API_BASE_URL}/admin/subjects/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(subjectData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Delete a subject
export const deleteSubject = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/subjects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Update subject teachers
export const updateSubjectTeachers = async (subjectId, teacherIds) => {
    const response = await fetch(`${API_BASE_URL}/admin/subjects/${subjectId}/teachers`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            // Include any auth headers you need
        },
        body: JSON.stringify({ teacherIds }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update subject teachers');
    }
    
    return response.json();
};