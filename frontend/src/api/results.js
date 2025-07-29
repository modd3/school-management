// api/results.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        // If the response is not OK, throw an error with the message from the backend
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};

// Fetch results for the logged-in teacher using fetch API
export const getTeacherResults = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please log in.');
        }
        const response = await fetch(`${API_BASE_URL}/teacher/results/entered-by-me`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return handleResponse(response);
    } catch (error) {
        throw error;
    }
};

// Fetch results for a specific student (for student use)
export const getStudentResults = async (termId, examType) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please log in.');
        }
        const response = await fetch(`${API_BASE_URL}/student/report/${termId}/${examType}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return handleResponse(response);
    } catch (error) {
        throw error;
    }
};

// Update the function signature
export const getClassSubjectsByTeacher = async (term, academicYear) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found. Please log in.');
    }
    
    const response = await fetch(`${API_BASE_URL}/class-subjects/me?term=${term}&academicYear=${academicYear}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// Submit a new result (marks)
export const submitResult = async (payload) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found. Please log in.');
    }
    const response = await fetch(`${API_BASE_URL}/results`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// You might also have other result-related API calls here, e.g., updateResult, deleteResult
