// frontend/src/api/classSubjects.js
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

// ✅ Assign subject to teacher for a specific class/term/year
export const assignClassSubject = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/admin/class-subjects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Update an existing class-subject assignment
export const updateClassSubject = async (id, updates) => {
  const response = await fetch(`${API_BASE_URL}/admin/class-subjects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Delete a class-subject assignment
export const deleteClassSubject = async (id) => {
  const response = await fetch(`${API_BASE_URL}/admin/class-subjects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Get all subject-teacher assignments for a specific class
export const getClassSubjectsByClass = async (classId, term, academicYear) => {
  const response = await fetch(`${API_BASE_URL}/admin/class-subjects/class/${classId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Get all subject assignments for a specific teacher
export const getClassSubjectsByTeacher = async (teacherId, term, academicYear) => {
  const response = await fetch(`${API_BASE_URL}/admin/class-subjects/teacher/${teacherId}?term=${term}&academicYear=${academicYear}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};
