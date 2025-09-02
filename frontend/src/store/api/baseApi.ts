import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    // Get token from localStorage to avoid circular dependency
    const token = localStorage.getItem('token');
    
    // Set authorization header if token exists
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    // Set content type
    headers.set('content-type', 'application/json');
    
    return headers;
  },
});

// Enhanced base query with re-authorization logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 responses by clearing token
  if (result?.error?.status === 401) {
    // Clear token from localStorage
    localStorage.removeItem('token');
    // Redirect will be handled by components using auth hooks
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'User',
    'Student', 
    'Teacher',
    'Parent',
    'Class',
    'Subject',
    'Result',
    'Progress',
    'Attendance',
    'Timetable',
    'AcademicCalendar',
    'GradingScale',
    'Dashboard',
  ],
  endpoints: () => ({}),
});

