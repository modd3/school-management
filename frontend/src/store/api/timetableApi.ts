import { baseApi } from './baseApi';
import { 
  Timetable, 
  TimetablePeriod,
  ApiResponse,
  PaginatedResponse
} from '@/types';

export const timetableApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Get teacher timetable
    getTeacherTimetable: builder.query<
      ApiResponse<any>,
      {
        teacherId: string;
        week?: string;
        academicYear?: string;
      }
    >({
      query: ({ teacherId, week, academicYear }) => ({
        url: `/teacher/timetable/${teacherId}`,
        params: { week, academicYear },
      }),
      providesTags: ['Timetable'],
    }),
    
    // Get timetables
    getTimetables: builder.query<
      PaginatedResponse<Timetable[]>, 
      { 
        page?: number; 
        limit?: number; 
        classId?: string; 
        teacherId?: string;
        academicYear?: string;
        termNumber?: number;
        dayOfWeek?: string;
      }
    >({
      query: (params) => ({
        url: '/timetable',
        params,
      }),
      providesTags: ['Timetable'],
    }),
    
    getTimetableById: builder.query<ApiResponse<Timetable>, string>({
      query: (id) => `/timetable/${id}`,
      providesTags: (result, error, id) => [{ type: 'Timetable', id }],
    }),
    
    // Create timetable
    createTimetable: builder.mutation<
      ApiResponse<Timetable>,
      {
        classId: string;
        academicYear: string;
        termNumber: number;
        periods: TimetablePeriod[];
      }
    >({
      query: (data) => ({
        url: '/admin/timetable',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Timetable'],
    }),
    
    // Update timetable
    updateTimetable: builder.mutation<
      ApiResponse<Timetable>,
      { id: string; data: Partial<Timetable> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/timetable/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Timetable', id },
        'Timetable',
      ],
    }),
    
    // Delete timetable
    deleteTimetable: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/admin/timetable/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Timetable'],
    }),
    
    // Class timetable
    getClassTimetable: builder.query<
      ApiResponse<Timetable>,
      { 
        classId: string; 
        academicYear?: string; 
        termNumber?: number;
        dayOfWeek?: string;
      }
    >({
      query: ({ classId, academicYear, termNumber, dayOfWeek }) => ({
        url: `/class/timetable/${classId}`,
        params: { academicYear, termNumber, dayOfWeek },
      }),
      providesTags: (result, error, { classId }) => [
        { type: 'Timetable', id: `class-${classId}` }
      ],
    }),
    
    
    // Student timetable (via class)
    getStudentTimetable: builder.query<
      ApiResponse<{
        studentId: string;
        studentName: string;
        classId: string;
        className: string;
        timetable: Timetable;
      }>,
      { 
        studentId: string; 
        academicYear?: string; 
        termNumber?: number;
      }
    >({
      query: ({ studentId, academicYear, termNumber }) => ({
        url: `/student/timetable/${studentId}`,
        params: { academicYear, termNumber },
      }),
      providesTags: (result, error, { studentId }) => [
        { type: 'Timetable', id: `student-${studentId}` }
      ],
    }),
    
    // Bulk timetable creation
    createBulkTimetables: builder.mutation<
      ApiResponse<{ created: number; errors: any[] }>,
      Array<{
        classId: string;
        academicYear: string;
        termNumber: number;
        periods: TimetablePeriod[];
      }>
    >({
      query: (timetables) => ({
        url: '/admin/timetable/bulk',
        method: 'POST',
        body: { timetables },
      }),
      invalidatesTags: ['Timetable'],
    }),
    
    // Update single period
    updateTimetablePeriod: builder.mutation<
      ApiResponse<Timetable>,
      {
        timetableId: string;
        periodId: string;
        periodData: Partial<TimetablePeriod>;
      }
    >({
      query: ({ timetableId, periodId, periodData }) => ({
        url: `/admin/timetable/${timetableId}/period/${periodId}`,
        method: 'PUT',
        body: periodData,
      }),
      invalidatesTags: (result, error, { timetableId }) => [
        { type: 'Timetable', id: timetableId },
        'Timetable',
      ],
    }),
    
    // Clone timetable
    cloneTimetable: builder.mutation<
      ApiResponse<Timetable>,
      {
        sourceId: string;
        targetClassId: string;
        academicYear: string;
        termNumber: number;
      }
    >({
      query: (data) => ({
        url: '/admin/timetable/clone',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Timetable'],
    }),
    
    // Timetable conflicts
    checkTimetableConflicts: builder.query<
      ApiResponse<{
        conflicts: Array<{
          type: 'teacher_conflict' | 'room_conflict';
          message: string;
          periods: TimetablePeriod[];
        }>;
        warnings: Array<{
          type: 'back_to_back' | 'overload';
          message: string;
          details: any;
        }>;
      }>,
      { 
        timetableId?: string; 
        periods?: TimetablePeriod[];
        academicYear?: string;
        termNumber?: number;
      }
    >({
      query: (params) => ({
        url: '/admin/timetable/conflicts',
        params,
      }),
      providesTags: ['Timetable'],
    }),
    
    // Generate timetable template
    generateTimetableTemplate: builder.query<
      ApiResponse<{
        classId: string;
        className: string;
        subjects: Array<{
          subjectId: string;
          subjectName: string;
          teacherId: string;
          teacherName: string;
          periodsPerWeek: number;
        }>;
        timeSlots: Array<{
          startTime: string;
          endTime: string;
          duration: number;
        }>;
        daysOfWeek: string[];
      }>,
      { classId: string }
    >({
      query: ({ classId }) => ({
        url: `/admin/timetable/template/${classId}`,
      }),
      providesTags: ['Timetable'],
    }),
    
    // Timetable analytics
    getTimetableAnalytics: builder.query<
      ApiResponse<{
        totalTimetables: number;
        classesWithTimetable: number;
        teacherWorkload: Record<string, {
          teacherName: string;
          totalPeriods: number;
          classesAssigned: number;
          subjectsAssigned: number;
        }>;
        roomUtilization: Record<string, {
          totalPeriods: number;
          utilizationRate: number;
        }>;
        subjectDistribution: Record<string, {
          totalPeriods: number;
          classesAssigned: number;
        }>;
      }>,
      { 
        academicYear?: string; 
        termNumber?: number;
      }
    >({
      query: (params) => ({
        url: '/admin/analytics/timetable',
        params,
      }),
      providesTags: ['Timetable'],
    }),
    
    // Current period for class
    getCurrentPeriod: builder.query<
      ApiResponse<{
        period: TimetablePeriod | null;
        nextPeriod: TimetablePeriod | null;
        isBreakTime: boolean;
        remainingMinutes: number;
      }>,
      { classId: string }
    >({
      query: ({ classId }) => ({
        url: `/class/current-period/${classId}`,
      }),
      providesTags: (result, error, { classId }) => [
        { type: 'Timetable', id: `current-${classId}` }
      ],
    }),
    
    // Today's schedule for teacher
    getTeacherTodaySchedule: builder.query<
      ApiResponse<{
        teacherId: string;
        date: string;
        periods: Array<TimetablePeriod & {
          className: string;
          classId: string;
          isPast: boolean;
          isCurrent: boolean;
          isUpcoming: boolean;
        }>;
        totalPeriods: number;
        completedPeriods: number;
        upcomingPeriods: number;
      }>,
      { teacherId: string; date?: string }
    >({
      query: ({ teacherId, date }) => ({
        url: `/teacher/today-schedule/${teacherId}`,
        params: { date },
      }),
      providesTags: (result, error, { teacherId }) => [
        { type: 'Timetable', id: `today-${teacherId}` }
      ],
    }),
    
    // Free periods for teachers
    getTeacherFreePeriods: builder.query<
      ApiResponse<{
        teacherId: string;
        freePeriods: Array<{
          dayOfWeek: string;
          timeSlot: string;
          duration: number;
        }>;
        busyPeriods: Array<{
          dayOfWeek: string;
          timeSlot: string;
          subject: string;
          class: string;
        }>;
      }>,
      { 
        teacherId: string; 
        academicYear?: string; 
        termNumber?: number;
      }
    >({
      query: ({ teacherId, academicYear, termNumber }) => ({
        url: `/admin/timetable/free-periods/${teacherId}`,
        params: { academicYear, termNumber },
      }),
      providesTags: (result, error, { teacherId }) => [
        { type: 'Timetable', id: `free-${teacherId}` }
      ],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetTimetablesQuery,
  useGetTimetableByIdQuery,
  
  useCreateTimetableMutation,
  useUpdateTimetableMutation,
  useDeleteTimetableMutation,
  
  useGetClassTimetableQuery,
  useGetTeacherTimetableQuery,
  useGetStudentTimetableQuery,
  
  useCreateBulkTimetablesMutation,
  useUpdateTimetablePeriodMutation,
  useCloneTimetableMutation,
  
  useCheckTimetableConflictsQuery,
  useGenerateTimetableTemplateQuery,
  
  useGetTimetableAnalyticsQuery,
  
  useGetCurrentPeriodQuery,
  useGetTeacherTodayScheduleQuery,
  useGetTeacherFreePeriodsQuery,
} = timetableApi;
