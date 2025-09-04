import { baseApi } from './baseApi';
import { 
  User, 
  LoginFormData, 
  RegisterFormData, 
  ApiResponse 
} from '@/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Login endpoint
    login: builder.mutation<
      ApiResponse<{ user: User; token: string }>,
      LoginFormData
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
    
    // Register endpoint (admin only)
    register: builder.mutation<ApiResponse, RegisterFormData>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Get current user profile
    getProfile: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => '/auth/me',
      providesTags: ['User', 'Auth'],
    }),
    
    // Logout endpoint
    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear all cached data on logout
          dispatch(baseApi.util.resetApiState());
        } catch {
          // Handle logout errors
        }
      },
    }),
    
    // Forgot password
    forgotPassword: builder.mutation<ApiResponse, { email: string }>({
      query: (data) => ({
        url: '/auth/forgotpassword',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Reset password
    resetPassword: builder.mutation<
      ApiResponse,
      { token: string; password: string; passwordConfirm: string }
    >({
      query: ({ token, password, passwordConfirm }) => ({
        url: `/auth/resetpassword/${token}`,
        method: 'PATCH',
        body: { password, passwordConfirm },
      }),
    }),
    
    // Update profile
    updateProfile: builder.mutation<
      ApiResponse<{ user: User }>,
      Partial<User>
    >({
      query: (updates) => ({
        url: '/auth/updatedetails',
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Change password
    changePassword: builder.mutation<
      ApiResponse,
      { currentPassword: string; newPassword: string; passwordConfirm: string }
    >({
      query: (passwords) => ({
        url: '/auth/updatepassword',
        method: 'PUT',
        body: passwords,
      }),
    }),
    
    // Verify email (if email verification is implemented)
    verifyEmail: builder.mutation<ApiResponse, { token: string }>({
      query: ({ token }) => ({
        url: `/auth/verify/${token}`,
        method: 'GET',
      }),
      invalidatesTags: ['User'],
    }),
    
    // Refresh token (if implemented)
    refreshToken: builder.mutation<
      ApiResponse<{ token: string }>,
      void
    >({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useRefreshTokenMutation,
} = authApi;
