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
  const response = await fetch(`${API_BASE_URL}/class-subjects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Update an existing class-subject assignment
export const updateClassSubject = async (id, updates) => {
  const response = await fetch(`${API_BASE_URL}/class-subjects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Delete a class-subject assignment
export const deleteClassSubject = async (id) => {
  const response = await fetch(`${API_BASE_URL}/class-subjects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Get all subject-teacher assignments for a specific class
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

// ✅ Get all class-subject assignments for the logged-in teacher (Teacher's own view)
// Modified to accept individual parameters and build query string internally.
export const getMyClassSubjects = async (termId, academicYear) => { // Now explicitly expects termId, academicYear
  const queryParams = new URLSearchParams();
  if (termId) {
    queryParams.append('term', termId);
  }
  if (academicYear) {
    queryParams.append('academicYear', academicYear);
  }
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/class-subjects/me${queryString ? `?${queryString}` : ''}`;

  // Log the URL right before the fetch call
  console.log(`[API] getMyClassSubjects fetching from: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  return handleResponse(response);
};

// ✅ Get all students enrolled in a specific class-subject assignment
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
  const response = await fetch(`${API_BASE_URL}/class-subjects/enroll`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });
  return handleResponse(response);
};
