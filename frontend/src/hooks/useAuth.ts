import { useSelector } from 'react-redux';
import { useLoginMutation, useLogoutMutation } from '@/store/api/authApi';
import { selectCurrentUser, selectIsAuthenticated } from '@/store/slices/authSlice';
import type { LoginCredentials } from '@/types';

const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const result = await login(credentials).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (error) {
      // Even if logout API fails, we should clear local state
      console.error('Logout API failed:', error);
    }
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]) => {
    return user?.role && roles.includes(user.role);
  };

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissions: string[]) => {
    if (!user?.permissions) return false;
    return permissions.some(permission => user.permissions!.includes(permission));
  };

  const isAdmin = () => hasRole('admin');
  const isTeacher = () => hasRole('teacher');
  const isStudent = () => hasRole('student');
  const isParent = () => hasRole('parent');

  return {
    // State
    user,
    isAuthenticated,
    isLoading: isLoggingIn || isLoggingOut,
    
    // Actions
    login: handleLogin,
    logout: handleLogout,
    
    // Helpers
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
  };
};

export default useAuth;
