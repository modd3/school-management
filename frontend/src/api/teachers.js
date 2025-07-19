// frontend/src/api/teachers.js
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

// Fetch all teachers
export const getTeachers = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/teachers`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Fetch a single teacher by ID
export const getTeacherById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Update a teacher
export const updateTeacher = async (id, teacherData) => {
    const response = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(teacherData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Delete a teacher
export const deleteTeacher = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/teachers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};