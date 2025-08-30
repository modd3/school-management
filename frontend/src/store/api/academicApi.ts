import baseApi from './baseApi';
import { 
  Class, 
  Subject, 
  AcademicCalendar,
  GradingScale,
  Timetable,
  ApiResponse,
  PaginatedResponse
} from '@/types';

export const academicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Classes
    getClasses: builder.query<PaginatedResponse<Class[]>, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/admin/classes',
        params,
      }),
      providesTags: ['Class'],
    }),
    
    getClassById: builder.query<ApiResponse<Class>, string>({
      query: (id) => `/admin/classes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Class', id }],
    }),
    
    createClass: builder.mutation<ApiResponse<Class>, Partial<Class>>({
      query: (data) => ({
        url: '/admin/classes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Class'],
    }),
    
    updateClass: builder.mutation<ApiResponse<Class>, { id: string; data: Partial<Class> }>({
      query: ({ id, data }) => ({
        url: `/admin/classes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Class', id }, 'Class'],
    }),
    
    deleteClass: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/admin/classes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Class'],
    }),
    
    // Subjects
    getSubjects: builder.query<PaginatedResponse<Subject[]>, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({
        url: '/admin/subjects',
        params,
      }),
      providesTags: ['Subject'],
    }),
    
    getSubjectById: builder.query<ApiResponse<Subject>, string>({
      query: (id) => `/admin/subjects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Subject', id }],
    }),
    
    createSubject: builder.mutation<ApiResponse<Subject>, Partial<Subject>>({
      query: (data) => ({
        url: '/admin/subjects',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Subject'],
    }),
    
    updateSubject: builder.mutation<ApiResponse<Subject>, { id: string; data: Partial<Subject> }>({
      query: ({ id, data }) => ({
        url: `/admin/subjects/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Subject', id }, 'Subject'],
    }),
    
    deleteSubject: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/admin/subjects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Subject'],
    }),
    
    // Academic Calendar
    getAcademicCalendars: builder.query<ApiResponse<AcademicCalendar[]>, void>({
      query: () => '/admin/academic/calendar',
      providesTags: ['AcademicCalendar'],
    }),
    
    getActiveAcademicCalendar: builder.query<ApiResponse<AcademicCalendar>, void>({
      query: () => '/admin/academic/calendar/active',
      providesTags: ['AcademicCalendar'],
    }),
    
    createAcademicCalendar: builder.mutation<ApiResponse<AcademicCalendar>, Partial<AcademicCalendar>>({
      query: (data) => ({
        url: '/admin/academic/calendar',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AcademicCalendar'],
    }),
    
    // Grading Scales
    getGradingScales: builder.query<ApiResponse<GradingScale[]>, void>({
      query: () => '/admin/grading-scales',
      providesTags: ['GradingScale'],
    }),
    
    getDefaultGradingScale: builder.query<ApiResponse<GradingScale>, string>({
      query: (level) => `/admin/grading-scales/default/${level}`,
      providesTags: ['GradingScale'],
    }),
    
    // Timetables
    getClassTimetable: builder.query<
      ApiResponse<Timetable>, 
      { classId: string; academicYear: string; termNumber: number }
    >({
      query: ({ classId, academicYear, termNumber }) => 
        `/admin/timetable/class/${classId}/${academicYear}/${termNumber}`,
      providesTags: ['Timetable'],
    }),
    
    getTeacherTimetable: builder.query<
      ApiResponse<Timetable[]>, 
      { teacherId: string; academicYear: string; termNumber: number }
    >({
      query: ({ teacherId, academicYear, termNumber }) => 
        `/admin/timetable/teacher/${teacherId}/${academicYear}/${termNumber}`,
      providesTags: ['Timetable'],
    }),
    
    createOrUpdateTimetable: builder.mutation<ApiResponse<Timetable>, Partial<Timetable>>({
      query: (data) => ({
        url: '/admin/timetable',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Timetable'],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetClassesQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  
  useGetSubjectsQuery,
  useGetSubjectByIdQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  
  useGetAcademicCalendarsQuery,
  useGetActiveAcademicCalendarQuery,
  useCreateAcademicCalendarMutation,
  
  useGetGradingScalesQuery,
  useGetDefaultGradingScaleQuery,
  
  useGetClassTimetableQuery,
  useGetTeacherTimetableQuery,
  useCreateOrUpdateTimetableMutation,
} = academicApi;
