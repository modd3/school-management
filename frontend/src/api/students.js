// frontend/src/api/students.js
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

// Fetch all students
export const getStudents = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/students`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Fetch a single student by ID
export const getStudentById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Update a student
export const updateStudent = async (id, studentData) => {
    const response = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(studentData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Delete a student
export const deleteStudent = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};