const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const getAcademicCalendars = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found.');

  const response = await fetch(`${API_BASE_URL}/academic-calendars`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch academic calendars');
  }

  return await response.json();
};