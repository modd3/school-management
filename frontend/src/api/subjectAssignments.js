// frontend/src/api/subjectAssignments.js
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

// Get all subject assignments
export const getAllSubjectAssignments = async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query parameters
    Object.keys(filters).forEach(key => {
        if (filters[key]) {
            queryParams.append(key, filters[key]);
        }
    });

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/admin/class-subjects${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Create a new subject assignment
export const createSubjectAssignment = async (assignmentData) => {
    const response = await fetch(`${API_BASE_URL}/admin/class-subjects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Update a subject assignment
export const updateSubjectAssignment = async (id, assignmentData) => {
    const response = await fetch(`${API_BASE_URL}/admin/class-subjects/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Delete a subject assignment
export const deleteSubjectAssignment = async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/class-subjects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Get subject assignments by teacher ID
export const getSubjectAssignmentsByTeacher = async (teacherId, filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/class-subjects/teacher/${teacherId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Get subject assignments by class ID
export const getSubjectAssignmentsByClass = async (classId, filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/class-subjects/class/${classId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Get my subject assignments (for logged-in teacher)
export const getMySubjectAssignments = async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/class-subjects/me${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
    });
    return handleResponse(response);
};

// Fix missing core subjects for existing students in a class
export const fixMissingCoreSubjects = async (classId, academicYear, termId = null) => {
    const response = await fetch(`${API_BASE_URL}/admin/class-subjects/fix-missing-core`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ classId, academicYear, termId }),
        credentials: 'include',
    });
    return handleResponse(response);
};
