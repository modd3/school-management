import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { logout } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux state
    const token = (getState() as RootState).auth.token;
    
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

  // Handle 401 responses by logging out the user
  if (result?.error?.status === 401) {
    // Clear user data and redirect to login
    api.dispatch(logout());
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

export default baseApi;
