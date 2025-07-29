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
  const response = await fetch(`${API_BASE_URL}/class-subjects`, { // Updated route to match new router
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Update an existing class-subject assignment
export const updateClassSubject = async (id, updates) => {
  const response = await fetch(`${API_BASE_URL}/class-subjects/${id}`, { // Updated route to match new router
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Delete a class-subject assignment
export const deleteClassSubject = async (id) => {
  const response = await fetch(`${API_BASE_URL}/class-subjects/${id}`, { // Updated route to match new router
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Get all subject-teacher assignments for a specific class
// Now correctly passes term and academicYear as query parameters
export const getClassSubjectsByClass = async (classId, academicYear, term) => {
  const queryParams = new URLSearchParams();
  if (academicYear) {
    queryParams.append('academicYear', academicYear);
  }
  if (term) {
    queryParams.append('term', term);
  }
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/class-subjects/class/${classId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Get all subject assignments for a specific teacher (Admin view)
// This endpoint is for admins to query any teacher's subjects by ID.
export const getClassSubjectsByTeacher = async (teacherId, academicYear, term) => {
  const queryParams = new URLSearchParams();
  if (academicYear) {
    queryParams.append('academicYear', academicYear);
  }
  if (term) {
    queryParams.append('term', term);
  }
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/class-subjects/teacher/${teacherId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ FIXED: Get all class-subject assignments for the logged-in teacher (Teacher's own view)
// This endpoint uses '/me' and relies on the backend's 'protect' middleware to identify the teacher.
export const getMyClassSubjects = async (term, academicYear) => {
  const queryParams = new URLSearchParams();
  if (term) {
    queryParams.append('term', term);
  }
  if (academicYear) {
    queryParams.append('academicYear', academicYear);
  }
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/class-subjects/me${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Get all students enrolled in a specific class-subject assignment
// Updated to match the new route: /api/class-subjects/:classSubjectId/students
export const getStudentsInSubject = async (classSubjectId, academicYear) => {
  const queryParams = new URLSearchParams();
  if (academicYear) {
    queryParams.append('academicYear', academicYear);
  }
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/class-subjects/${classSubjectId}/students${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Enroll a student in a subject
export const enrollStudentInSubject = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/class-subjects/enroll`, { // Updated route
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return handleResponse(response);
};
