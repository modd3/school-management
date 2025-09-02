import { baseApi } from './baseApi';
import { 
  Attendance, 
  AttendanceRecord,
  ApiResponse,
  PaginatedResponse
} from '@/types';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Attendance Management
    getAttendance: builder.query<
      PaginatedResponse<Attendance[]>, 
      { 
        page?: number; 
        limit?: number; 
        classId?: string; 
        subjectId?: string;
        studentId?: string;
        date?: string;
        startDate?: string;
        endDate?: string;
        status?: 'present' | 'absent' | 'late' | 'excused';
      }
    >({
      query: (params) => ({
        url: '/attendance',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    
    getAttendanceById: builder.query<ApiResponse<Attendance>, string>({
      query: (id) => `/attendance/${id}`,
      providesTags: (result, error, id) => [{ type: 'Attendance', id }],
    }),
    
    // Mark attendance (for teachers)
    markAttendance: builder.mutation<
      ApiResponse<Attendance>,
      {
        classId: string;
        subjectId: string;
        date: string;
        records: AttendanceRecord[];
        remarks?: string;
      }
    >({
      query: (data) => ({
        url: '/teacher/attendance',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    
    // Update attendance record
    updateAttendance: builder.mutation<
      ApiResponse<Attendance>,
      { id: string; data: Partial<AttendanceRecord & { remarks?: string }> }
    >({
      query: ({ id, data }) => ({
        url: `/teacher/attendance/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Attendance', id },
        'Attendance',
      ],
    }),
    
    // Delete attendance record
    deleteAttendance: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/teacher/attendance/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Attendance'],
    }),
    
    // Class attendance for specific date
    getClassAttendance: builder.query<
      ApiResponse<Attendance>,
      { classId: string; date: string; subjectId?: string }
    >({
      query: ({ classId, date, subjectId }) => ({
        url: `/teacher/attendance/class/${classId}`,
        params: { date, subjectId },
      }),
      providesTags: ['Attendance'],
    }),
    
    // Student attendance history
    getStudentAttendance: builder.query<
      ApiResponse<Attendance[]>,
      { 
        studentId: string; 
        startDate?: string; 
        endDate?: string; 
        subjectId?: string 
      }
    >({
      query: ({ studentId, startDate, endDate, subjectId }) => ({
        url: `/student/attendance/${studentId}`,
        params: { startDate, endDate, subjectId },
      }),
      providesTags: (result, error, { studentId }) => [
        { type: 'Attendance', id: studentId }
      ],
    }),
    
    // Attendance summary for student
    getStudentAttendanceSummary: builder.query<
      ApiResponse<{
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        excusedDays: number;
        attendancePercentage: number;
        subjectWiseAttendance: Record<string, {
          present: number;
          absent: number;
          percentage: number;
        }>;
      }>,
      { 
        studentId: string; 
        startDate?: string; 
        endDate?: string;
        academicYear?: string;
        termNumber?: number;
      }
    >({
      query: ({ studentId, startDate, endDate, academicYear, termNumber }) => ({
        url: `/admin/attendance/summary/${studentId}`,
        params: { startDate, endDate, academicYear, termNumber },
      }),
      providesTags: (result, error, { studentId }) => [
        { type: 'Attendance', id: `summary-${studentId}` }
      ],
    }),
    
    // Class attendance summary
    getClassAttendanceSummary: builder.query<
      ApiResponse<{
        totalStudents: number;
        averageAttendance: number;
        studentAttendanceRates: Array<{
          studentId: string;
          studentName: string;
          attendanceRate: number;
          totalPresent: number;
          totalAbsent: number;
        }>;
        dateWiseAttendance: Array<{
          date: string;
          totalPresent: number;
          totalAbsent: number;
          attendanceRate: number;
        }>;
      }>,
      { 
        classId: string; 
        startDate?: string; 
        endDate?: string;
        subjectId?: string;
      }
    >({
      query: ({ classId, startDate, endDate, subjectId }) => ({
        url: `/admin/attendance/class-summary/${classId}`,
        params: { startDate, endDate, subjectId },
      }),
      providesTags: ['Attendance'],
    }),
    
    // Bulk attendance marking
    markBulkAttendance: builder.mutation<
      ApiResponse<{ marked: number; errors: any[] }>,
      Array<{
        classId: string;
        subjectId: string;
        date: string;
        records: AttendanceRecord[];
      }>
    >({
      query: (attendanceData) => ({
        url: '/teacher/attendance/bulk',
        method: 'POST',
        body: { attendanceData },
      }),
      invalidatesTags: ['Attendance'],
    }),
    
    // Get attendance template for class
    getAttendanceTemplate: builder.query<
      ApiResponse<{
        classId: string;
        className: string;
        students: Array<{
          studentId: string;
          studentName: string;
          admissionNumber: string;
        }>;
      }>,
      { classId: string }
    >({
      query: ({ classId }) => ({
        url: `/teacher/attendance/template/${classId}`,
      }),
      providesTags: ['Attendance'],
    }),
    
    // Attendance analytics
    getAttendanceAnalytics: builder.query<
      ApiResponse<{
        overallAttendanceRate: number;
        classWiseAttendance: Record<string, number>;
        subjectWiseAttendance: Record<string, number>;
        monthlyTrends: Array<{
          month: string;
          attendanceRate: number;
        }>;
        lowAttendanceStudents: Array<{
          studentId: string;
          studentName: string;
          attendanceRate: number;
        }>;
      }>,
      { 
        startDate?: string; 
        endDate?: string; 
        classId?: string;
        threshold?: number; // for low attendance students
      }
    >({
      query: (params) => ({
        url: '/admin/analytics/attendance',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    
    // Generate attendance reports
    generateAttendanceReport: builder.mutation<
      ApiResponse<{ reportUrl: string }>,
      {
        type: 'student' | 'class' | 'subject';
        targetId: string; // studentId, classId, or subjectId
        startDate: string;
        endDate: string;
        format: 'pdf' | 'excel';
      }
    >({
      query: (params) => ({
        url: '/admin/reports/attendance',
        method: 'POST',
        body: params,
      }),
    }),
    
    // Daily attendance dashboard
    getDailyAttendanceDashboard: builder.query<
      ApiResponse<{
        date: string;
        totalClasses: number;
        classesWithAttendance: number;
        overallAttendanceRate: number;
        classAttendanceRates: Array<{
          classId: string;
          className: string;
          attendanceRate: number;
          totalStudents: number;
          presentStudents: number;
        }>;
      }>,
      { date?: string }
    >({
      query: ({ date = new Date().toISOString().split('T')[0] }) => ({
        url: '/admin/attendance/daily-dashboard',
        params: { date },
      }),
      providesTags: ['Attendance'],
    }),
    
    // Attendance notifications/alerts
    getAttendanceAlerts: builder.query<
      ApiResponse<Array<{
        type: 'low_attendance' | 'consecutive_absence' | 'late_frequent';
        studentId: string;
        studentName: string;
        details: string;
        severity: 'low' | 'medium' | 'high';
      }>>,
      { classId?: string; threshold?: number }
    >({
      query: (params) => ({
        url: '/admin/attendance/alerts',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetAttendanceQuery,
  useGetAttendanceByIdQuery,
  
  useMarkAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
  
  useGetClassAttendanceQuery,
  
  useGetStudentAttendanceQuery,
  useGetStudentAttendanceSummaryQuery,
  
  useGetClassAttendanceSummaryQuery,
  
  useMarkBulkAttendanceMutation,
  useGetAttendanceTemplateQuery,
  
  useGetAttendanceAnalyticsQuery,
  useGenerateAttendanceReportMutation,
  
  useGetDailyAttendanceDashboardQuery,
  useGetAttendanceAlertsQuery,
} = attendanceApi;
