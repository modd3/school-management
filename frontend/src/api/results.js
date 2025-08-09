// api/results.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Fetch results for the logged-in teacher using fetch API

export const getResultsByTeacher = async (queryString = '') => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please log in.');
        }
        
        const url = `${API_BASE_URL}/teacher/results/entered-by-me${queryString ? `?${queryString}` : ''}`;
        console.log('Fetching teacher results from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.log('[fetchTeacherResults] Error data:', errorData);
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('getTeacherResults error:', error);
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
    
    // Construct URL with path parameters
    const response = await fetch(`${API_BASE_URL}/student/report/${termId}/${examType}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}
/**
 * Fetches class subjects assigned to the logged-in teacher for a specific term and academic year.
 * This function now targets the /api/class-subjects/me endpoint, which infers the teacher ID from the JWT.
 *
 * @param {string} teacherId - The ID of the teacher (used for consistency in frontend, but not directly in URL for /me endpoint).
 * @param {string} termId - The ID of the term.
 * @param {string} academicYear - The academic year.
 * @returns {Promise<Object>} The response data containing class subjects.
 */
export const getClassSubjectsByTeacher = async (teacherId, termId, academicYear) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const queryParams = new URLSearchParams();
  if (termId) {
    queryParams.append('term', termId);
  }
  if (academicYear) {
    queryParams.append('academicYear', academicYear);
  }

  const queryString = queryParams.toString();
  // Construct the URL to hit the /api/class-subjects/me endpoint
  const url = `${API_BASE_URL}/class-subjects/me${queryString ? '?' + queryString : ''}`;

  // Log the URL right before the fetch call
  console.log(`[API] getClassSubjectsByTeacher fetching from: ${url}`);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch class subjects for teacher.');
  }
  return data;
};

// In your API file (likely results.js or api/results.js)
export const submitResult = async (resultData) => {
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  
  console.log('Submitting result data:', resultData);
  console.log('API URL:', `${API_BASE_URL}/teacher/results/enter`);
  
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/results/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(resultData)
    });
    console.log(resultData);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    // Get response text first to see what we're actually getting
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    if (!response.ok) {
      // Try to parse as JSON, but handle HTML responses
      let errorMessage = 'Failed to submit result';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        console.error('Could not parse error response as JSON:', parseError);
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
        
        // If we got HTML back, it might be a 404 or routing issue
        if (responseText.includes('<!DOCTYPE')) {
          errorMessage = `API endpoint not found. Check if ${API_BASE_URL}/teacher/results/enter is correct.`;
        }
      }
      throw new Error(errorMessage);
    }
    
    // Parse successful response
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Could not parse success response as JSON:', parseError);
      throw new Error('Invalid response format from server');
    }
    
  } catch (error) {
    console.error('Submit result error:', error);
    throw error;
  }
};


/**
 * Fetches class exam results for a specific term and exam type
 * @param {string} classId - The ID of the class
 * @param {string} termId - The ID of the term
 * @param {string} examType - The exam type (Opener, Midterm, Endterm)
 */
export const getClassExamResults = async (classId, termId, examType, role) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    
    // Determine the correct API path based on the user's role
    const basePath = role === 'admin' ? 'admin' : 'teacher';
    const url = `${API_BASE_URL}/${basePath}/class-results/${classId}/${termId}/${examType}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch class exam results');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches class final reports for a specific term
 * @param {string} classId - The ID of the class
 * @param {string} termId - The ID of the term
 */
export const getClassFinalReports = async (classId, termId, role) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    
    // Determine the correct API path based on the user's role
    const basePath = role === 'admin' ? 'admin' : 'teacher';
    const url = `${API_BASE_URL}/${basePath}/class-final-reports/${classId}/${termId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch class final reports');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}