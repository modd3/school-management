import { useSelector, useDispatch } from 'react-redux';
import { useLoginMutation, useLogoutMutation } from '@/store/api/authApi';
import { selectCurrentUser, selectIsAuthenticated, setCredentials, logout as logoutAction } from '@/store/slices/authSlice';
import type { LoginCredentials } from '@/types';

const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const result = await login(credentials).unwrap();
      
      // Handle the actual API response structure
      // The API returns: {success: true, token: '...', user: {...}} 
      // Not the expected: {success: true, data: {user: {...}, token: '...'}}
      if (result.success && result.token && result.user) {
        dispatch(setCredentials({
          user: result.user,
          token: result.token
        }));
      } else if (result.data && result.data.user && result.data.token) {
        // Fallback for expected structure
        dispatch(setCredentials({
          user: result.data.user,
          token: result.data.token
        }));
      }
      
      return result;
    } catch (error: any) {
      // Re-throw the error so the LoginPage can handle it
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      // Clear the Redux state
      dispatch(logoutAction());
    } catch (error) {
      // Even if logout API fails, we should clear local state
      console.error('Logout API failed:', error);
      dispatch(logoutAction());
    }
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]) => {
    return user?.role && roles.includes(user.role);
  };

  const hasPermission = (permission: string) => {
    if (!user?.permissions) return false;
    // Handle object-based permissions structure
    const perms = user.permissions;
    
    // Check academic permissions
    if (perms.academic) {
      if (permission === 'canEnterResults' && perms.academic.canEnterResults) return true;
      if (permission === 'canEditResults' && perms.academic.canEditResults) return true;
      if (permission === 'canViewAllResults' && perms.academic.canViewAllResults) return true;
      if (permission === 'canPublishResults' && perms.academic.canPublishResults) return true;
    }
    
    // Check administrative permissions
    if (perms.administrative) {
      if (permission === 'canManageUsers' && perms.administrative.canManageUsers) return true;
      if (permission === 'canManageClasses' && perms.administrative.canManageClasses) return true;
      if (permission === 'canManageSubjects' && perms.administrative.canManageSubjects) return true;
      if (permission === 'canViewReports' && perms.administrative.canViewReports) return true;
      if (permission === 'canExportData' && perms.administrative.canExportData) return true;
    }
    
    // Check financial permissions
    if (perms.financial) {
      if (permission === 'canViewPayments' && perms.financial.canViewPayments) return true;
      if (permission === 'canProcessPayments' && perms.financial.canProcessPayments) return true;
      if (permission === 'canGenerateStatements' && perms.financial.canGenerateStatements) return true;
    }
    
    return false;
  };

  const hasAnyPermission = (permissions: string[]) => {
    if (!user?.permissions) return false;
    return permissions.some(permission => hasPermission(permission));
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
