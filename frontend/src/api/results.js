// api/results.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Fetch results for the logged-in teacher using fetch API
export const fetchTeacherResults = async () => {
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
        console.log('[fetchTeacherResults] Raw response:', response);
        if (!response.ok) {
            const errorData = await response.json();
            console.log('[fetchTeacherResults] Error data:', errorData);
            throw errorData;
        }

        const data = await response.json();
    console.log('[fetchTeacherResults] Data received:', data);
    return data;
    } catch (error) {
        throw error;
    }
};
// Fetch results for a specific student (for student use)
export const fetchStudentResults = async (termId, examType) => {
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

        if (!response.ok) {
            const errorData = await response.json();
            throw errorData;
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

