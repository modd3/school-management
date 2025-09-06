import { baseApi } from './baseApi';
import { 
  Result, 
  StudentProgress,
  ResultEntryFormData,
  ApiResponse,
  PaginatedResponse
} from '@/types';

export const resultsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Results Management
    getResults: builder.query<
      PaginatedResponse<Result[]>, 
      { 
        page?: number; 
        limit?: number; 
        studentId?: string; 
        subjectId?: string; 
        classId?: string;
        academicYear?: string;
        termNumber?: number;
        status?: string;
      }
    >({
      query: (params) => ({
        url: '/results',
        params,
      }),
      providesTags: ['Result'],
    }),
    
    getResultById: builder.query<ApiResponse<Result>, string>({
      query: (id) => `/results/${id}`,
      providesTags: (result, error, id) => [{ type: 'Result', id }],
    }),
    
    createResult: builder.mutation<ApiResponse<Result>, ResultEntryFormData>({
      query: (data) => ({
        url: '/teacher/results',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Result', 'Progress'],
    }),
    
    updateResult: builder.mutation<
      ApiResponse<Result>,
      { id: string; data: Partial<ResultEntryFormData> }
    >({
      query: ({ id, data }) => ({
        url: `/teacher/results/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Result', id },
        'Result',
        'Progress',
      ],
    }),
    
    deleteResult: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/teacher/results/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Result', 'Progress'],
    }),
    
    // Bulk result entry
    createBulkResults: builder.mutation<
      ApiResponse<{ created: number; errors: any[] }>,
      ResultEntryFormData[]
    >({
      query: (results) => ({
        url: '/teacher/results/bulk',
        method: 'POST',
        body: { results },
      }),
      invalidatesTags: ['Result', 'Progress'],
    }),
    
    // Results by teacher
    getResultsEnteredByTeacher: builder.query<
      PaginatedResponse<Result[]>,
      { teacherId?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/teacher/results/entered-by-me',
        params,
      }),
      providesTags: ['Result'],
    }),
    
    // Class results for specific exam
    getClassExamResults: builder.query<
      ApiResponse<Result[]>,
      { 
        classId: string; 
        academicYear: string; 
        termNumber: number; 
        examType: 'cat1' | 'cat2' | 'endterm' 
      }
    >({
      query: ({ classId, academicYear, termNumber, examType }) => 
        `/admin/class-results/${classId}/${academicYear}/${termNumber}/${examType}`,
      providesTags: ['Result'],
    }),
    
    // Class final reports
    getClassFinalReports: builder.query<
      ApiResponse<Result[]>,
      { classId: string; academicYear: string; termNumber: number }
    >({
      query: ({ classId, academicYear, termNumber }) => 
        `/admin/class-final-reports/${classId}/${academicYear}/${termNumber}`,
      providesTags: ['Result'],
    }),
    
    // Student results
    getStudentResults: builder.query<
      ApiResponse<Result[]>,
      { studentId: string; academicYear?: string; termNumber?: number }
    >({
      query: ({ studentId, academicYear, termNumber }) => ({
        url: `/student/results/${studentId}`,
        params: { academicYear, termNumber },
      }),
      providesTags: (result, error, { studentId }) => [
        { type: 'Result', id: studentId }
      ],
    }),
    
    // Progress Tracking
    getStudentProgress: builder.query<
      ApiResponse<StudentProgress>,
      { studentId: string; academicYear: string }
    >({
      query: ({ studentId, academicYear }) => 
        `/admin/progress/student/${studentId}/${academicYear}`,
      providesTags: (result, error, { studentId }) => [
        { type: 'Progress', id: studentId }
      ],
    }),
    
    getClassProgressSummary: builder.query<
      ApiResponse<any>,
      { classId: string; academicYear: string }
    >({
      query: ({ classId, academicYear }) => 
        `/admin/progress/class/${classId}/${academicYear}`,
      providesTags: ['Progress'],
    }),
    
    generateProgressReports: builder.mutation<
      ApiResponse<{ message: string }>,
      { 
        academicYear: string; 
        termNumber?: number; 
        classId?: string; 
        studentId?: string 
      }
    >({
      query: (params) => ({
        url: '/admin/progress/generate',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Progress'],
    }),
    
    // Publishing results
    publishTermResults: builder.mutation<
      ApiResponse<{ published: number }>,
      { academicYear: string; termNumber: number }
    >({
      query: ({ academicYear, termNumber }) => ({
        url: `/admin/reports/publish-term-results/${academicYear}/${termNumber}`,
        method: 'POST',
      }),
      invalidatesTags: ['Result', 'Progress'],
    }),
    
    // Teacher-specific endpoints
    getResultsByTeacher: builder.query<
      PaginatedResponse<Result[]>,
      {
        teacherId?: string;
        academicYear?: string;
        term?: string;
        classId?: string;
        subjectId?: string;
      }
    >({
      query: (params) => ({
        url: '/teacher/results/by-teacher',
        params,
      }),
      providesTags: ['Result'],
    }),
    
    // Parent-specific endpoints
    getParentChildren: builder.query<
      ApiResponse<any[]>,
      string
    >({
      query: (parentId) => `/parent/children/${parentId}`,
      providesTags: ['Student'],
    }),
    
    getChildProgress: builder.query<
      ApiResponse<any>,
      {
        parentId: string;
        studentId: string;
        academicYear: string;
      }
    >({
      query: ({ parentId, studentId, academicYear }) => ({
        url: `/parent/child-progress/${studentId}`,
        params: { academicYear },
      }),
      providesTags: (result, error, { studentId }) => [
        { type: 'Progress', id: studentId }
      ],
    }),
    
    // Analytics
    getResultsAnalytics: builder.query<
      ApiResponse<{
        totalResults: number;
        averagePerformance: number;
        gradeDistribution: Record<string, number>;
        subjectPerformance: any[];
        trendData: any[];
      }>,
      { 
        classId?: string; 
        subjectId?: string; 
        academicYear?: string; 
        termNumber?: number 
      }
    >({
      query: (params) => ({
        url: '/admin/analytics/results',
        params,
      }),
      providesTags: ['Result'],
    }),
    
    // Performance trends
    getPerformanceTrends: builder.query<
      ApiResponse<any[]>,
      { studentId: string; subjectId?: string; period?: string }
    >({
      query: ({ studentId, subjectId, period = '1year' }) => ({
        url: `/admin/analytics/trends/${studentId}`,
        params: { subjectId, period },
      }),
      providesTags: (result, error, { studentId }) => [
        { type: 'Progress', id: studentId }
      ],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetResultsQuery,
  useGetResultByIdQuery,
  useCreateResultMutation,
  useUpdateResultMutation,
  useDeleteResultMutation,
  
  useCreateBulkResultsMutation,
  useGetResultsEnteredByTeacherQuery,
  useGetResultsByTeacherQuery,
  
  useGetClassExamResultsQuery,
  useGetClassFinalReportsQuery,
  
  useGetStudentResultsQuery,
  
  useGetStudentProgressQuery,
  useGetClassProgressSummaryQuery,
  useGenerateProgressReportsMutation,
  
  usePublishTermResultsMutation,
  
  useGetParentChildrenQuery,
  useGetChildProgressQuery,
  
  useGetResultsAnalyticsQuery,
  useGetPerformanceTrendsQuery,
} = resultsApi;
