import { createApi } from '@reduxjs/toolkit/query/react';
import baseApi from './baseApi';
import { 
  User, 
  Student, 
  Teacher, 
  Parent, 
  CreateStudentFormData,
  CreateTeacherFormData,
  ApiResponse,
  PaginatedResponse
} from '@/types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Get all users with pagination and filters
    getUsers: builder.query<
      PaginatedResponse<User[]>,
      { page?: number; limit?: number; role?: string; search?: string }
    >({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: ['User'],
    }),
    
    // Get user by ID
    getUserById: builder.query<ApiResponse<User>, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    // Update user
    updateUser: builder.mutation<
      ApiResponse<User>,
      { id: string; data: Partial<User> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'User',
      ],
    }),
    
    // Delete/deactivate user
    deleteUser: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    
    // Student Management
    getStudents: builder.query<
      PaginatedResponse<Student[]>,
      { page?: number; limit?: number; class?: string; search?: string }
    >({
      query: (params) => ({
        url: '/admin/students',
        params,
      }),
      providesTags: ['Student'],
    }),
    
    getStudentById: builder.query<ApiResponse<Student>, string>({
      query: (id) => `/admin/students/${id}`,
      providesTags: (result, error, id) => [{ type: 'Student', id }],
    }),
    
    createStudent: builder.mutation<ApiResponse<Student>, CreateStudentFormData>({
      query: (data) => ({
        url: '/admin/students',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Student', 'User'],
    }),
    
    updateStudent: builder.mutation<
      ApiResponse<Student>,
      { id: string; data: Partial<Student> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/students/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Student', id },
        'Student',
      ],
    }),
    
    deleteStudent: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/admin/students/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Student'],
    }),
    
    // Teacher Management
    getTeachers: builder.query<
      PaginatedResponse<Teacher[]>,
      { page?: number; limit?: number; subject?: string; search?: string }
    >({
      query: (params) => ({
        url: '/admin/teachers',
        params,
      }),
      providesTags: ['Teacher'],
    }),
    
    getTeacherById: builder.query<ApiResponse<Teacher>, string>({
      query: (id) => `/admin/teachers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Teacher', id }],
    }),
    
    createTeacher: builder.mutation<ApiResponse<Teacher>, CreateTeacherFormData>({
      query: (data) => ({
        url: '/admin/teachers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Teacher', 'User'],
    }),
    
    updateTeacher: builder.mutation<
      ApiResponse<Teacher>,
      { id: string; data: Partial<Teacher> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/teachers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Teacher', id },
        'Teacher',
      ],
    }),
    
    deleteTeacher: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/admin/teachers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Teacher'],
    }),
    
    // Parent Management
    getParents: builder.query<
      PaginatedResponse<Parent[]>,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: '/admin/parents',
        params,
      }),
      providesTags: ['Parent'],
    }),
    
    getParentById: builder.query<ApiResponse<Parent>, string>({
      query: (id) => `/admin/parents/${id}`,
      providesTags: (result, error, id) => [{ type: 'Parent', id }],
    }),
    
    // Bulk operations
    importUsers: builder.mutation<
      ApiResponse<{ imported: number; errors: any[] }>,
      { file: File; type: 'students' | 'teachers' | 'parents' }
    >({
      query: ({ file, type }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/admin/bulk/${type}/import`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['User', 'Student', 'Teacher', 'Parent'],
    }),
    
    exportUsers: builder.query<
      Blob,
      { type: 'students' | 'teachers' | 'parents'; format?: 'csv' | 'xlsx' }
    >({
      query: ({ type, format = 'csv' }) => ({
        url: `/admin/bulk/${type}/export`,
        params: { format },
        responseHandler: (response) => response.blob(),
      }),
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  
  useGetTeachersQuery,
  useGetTeacherByIdQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  
  useGetParentsQuery,
  useGetParentByIdQuery,
  
  useImportUsersMutation,
  useExportUsersQuery,
} = usersApi;
