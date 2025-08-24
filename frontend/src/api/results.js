const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const enterMarks = async (resultData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found.');

  const response = await fetch(`${API_BASE_URL}/results/enter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(resultData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to submit marks');
  }

  return await response.json();
};

export const getResultsByTeacher = async (queryString = '') => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found.');
    
    const url = `${API_BASE_URL}/teacher/results/entered-by-me${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
};

export const getStudentTermReport = async (academicYear, term) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found.');

  const response = await fetch(`${API_BASE_URL}/results/student-report/${academicYear}/${term}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch student report');
  }

  return await response.json();
};

export const getStudentFinalReport = async (academicYear, term) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found.');

  const response = await fetch(`${API_BASE_URL}/results/student-final-report/${academicYear}/${term}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch student final report');
  }

  return await response.json();
};

export const getClassFinalReports = async (classId, academicYear, term) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found.');

  const response = await fetch(`${API_BASE_URL}/results/class-final-reports/${classId}/${academicYear}/${term}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch class final reports');
  }

  return await response.json();
};

export const getClassTermResults = async (classId, academicYear, term) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found.');

  const response = await fetch(`${API_BASE_URL}/results/class-term-results/${classId}/${academicYear}/${term}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch class term results');
  }

  return await response.json();
};