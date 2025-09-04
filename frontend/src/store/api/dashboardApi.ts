import { baseApi } from './baseApi';
import { 
  ApiResponse,
  RecentActivity,
  DashboardStats
} from '@/types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Get dashboard statistics (admin only)
    getDashboardStats: builder.query<
      ApiResponse<DashboardStats>, 
      void
    >({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
    
    // Get recent activity
    getRecentActivity: builder.query<
      ApiResponse<RecentActivity[]>, 
      { limit?: number }
    >({
      query: ({ limit = 10 }) => ({
        url: '/dashboard/recent-activity',
        params: { limit },
      }),
      providesTags: ['Dashboard'],
    }),
    
    // Get user-specific dashboard data
    getUserDashboardData: builder.query<
      ApiResponse<any>, 
      void
    >({
      query: () => '/dashboard/user-data',
      providesTags: ['Dashboard', 'User'],
    }),
    
    // Get system health status (admin only)
    getSystemStatus: builder.query<
      ApiResponse<{
        database: {
          status: string;
          healthy: boolean;
        };
        academicYear: {
          status: string;
          healthy: boolean;
        };
        activeUsersToday: number;
        storage: string;
        uptime: number;
        memoryUsage: any;
        nodeVersion: string;
      }>, 
      void
    >({
      query: () => '/dashboard/system-status',
      providesTags: ['Dashboard'],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetDashboardStatsQuery,
  useGetRecentActivityQuery,
  useGetUserDashboardDataQuery,
  useGetSystemStatusQuery,
} = dashboardApi;
