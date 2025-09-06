import { useMemo } from 'react';
import useAuth from './useAuth';

// Define permission constants
export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  UPDATE_USERS: 'update_users',
  DELETE_USERS: 'delete_users',
  
  // Student Management
  MANAGE_STUDENTS: 'manage_students',
  VIEW_STUDENTS: 'view_students',
  CREATE_STUDENTS: 'create_students',
  UPDATE_STUDENTS: 'update_students',
  DELETE_STUDENTS: 'delete_students',
  
  // Teacher Management
  MANAGE_TEACHERS: 'manage_teachers',
  VIEW_TEACHERS: 'view_teachers',
  CREATE_TEACHERS: 'create_teachers',
  UPDATE_TEACHERS: 'update_teachers',
  DELETE_TEACHERS: 'delete_teachers',
  
  // Academic Management
  MANAGE_CLASSES: 'manage_classes',
  VIEW_CLASSES: 'view_classes',
  MANAGE_SUBJECTS: 'manage_subjects',
  VIEW_SUBJECTS: 'view_subjects',
  MANAGE_ACADEMIC_CALENDAR: 'manage_academic_calendar',
  VIEW_ACADEMIC_CALENDAR: 'view_academic_calendar',
  
  // Results Management
  MANAGE_RESULTS: 'manage_results',
  VIEW_RESULTS: 'view_results',
  ENTER_RESULTS: 'enter_results',
  EDIT_RESULTS: 'edit_results',
  DELETE_RESULTS: 'delete_results',
  PUBLISH_RESULTS: 'publish_results',
  VIEW_ALL_RESULTS: 'view_all_results',
  
  // Attendance Management
  MANAGE_ATTENDANCE: 'manage_attendance',
  VIEW_ATTENDANCE: 'view_attendance',
  MARK_ATTENDANCE: 'mark_attendance',
  EDIT_ATTENDANCE: 'edit_attendance',
  DELETE_ATTENDANCE: 'delete_attendance',
  VIEW_ALL_ATTENDANCE: 'view_all_attendance',
  
  // Timetable Management
  MANAGE_TIMETABLES: 'manage_timetables',
  VIEW_TIMETABLES: 'view_timetables',
  CREATE_TIMETABLES: 'create_timetables',
  EDIT_TIMETABLES: 'edit_timetables',
  DELETE_TIMETABLES: 'delete_timetables',
  
  // Reports and Analytics
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  
  // System Administration
  MANAGE_SYSTEM: 'manage_system',
  VIEW_SYSTEM_LOGS: 'view_system_logs',
  MANAGE_PERMISSIONS: 'manage_permissions',
  BACKUP_RESTORE: 'backup_restore',
} as const;

// Role-based permission mappings
const ROLE_PERMISSIONS = {
  admin: [
    // Full access to everything
    ...Object.values(PERMISSIONS),
  ],
  
  teacher: [
    // User Management (limited)
    PERMISSIONS.VIEW_USERS,
    
    // Student Management (limited)
    PERMISSIONS.VIEW_STUDENTS,
    
    // Academic Management (view only)
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_SUBJECTS,
    PERMISSIONS.VIEW_ACADEMIC_CALENDAR,
    
    // Results Management (for own classes/subjects)
    PERMISSIONS.VIEW_RESULTS,
    PERMISSIONS.ENTER_RESULTS,
    PERMISSIONS.EDIT_RESULTS,
    
    // Attendance Management (for own classes)
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.EDIT_ATTENDANCE,
    
    // Timetable Management (view only)
    PERMISSIONS.VIEW_TIMETABLES,
    
    // Reports (limited)
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
  ],
  
  student: [
    // View own data only
    PERMISSIONS.VIEW_STUDENTS, // own profile
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_SUBJECTS,
    PERMISSIONS.VIEW_ACADEMIC_CALENDAR,
    PERMISSIONS.VIEW_RESULTS, // own results
    PERMISSIONS.VIEW_ATTENDANCE, // own attendance
    PERMISSIONS.VIEW_TIMETABLES, // own timetable
  ],
  
  parent: [
    // View children's data
    PERMISSIONS.VIEW_STUDENTS, // children's profiles
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.VIEW_SUBJECTS,
    PERMISSIONS.VIEW_ACADEMIC_CALENDAR,
    PERMISSIONS.VIEW_RESULTS, // children's results
    PERMISSIONS.VIEW_ATTENDANCE, // children's attendance
    PERMISSIONS.VIEW_TIMETABLES, // children's timetables
  ],
} as const;

interface PermissionCheck {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canManageUsers: boolean;
  canManageStudents: boolean;
  canManageTeachers: boolean;
  canManageAcademics: boolean;
  canManageResults: boolean;
  canManageAttendance: boolean;
  canManageTimetables: boolean;
  canViewReports: boolean;
  canManageSystem: boolean;
  isReadOnly: boolean;
}

function usePermissions(): PermissionCheck {
  const { user, isAuthenticated } = useAuth();

  const userPermissions = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    
    // Get permissions from user object or role-based permissions
    let explicitPermissions: string[] = [];
    
    // Handle object-based permissions structure from the backend
    if (user.permissions && typeof user.permissions === 'object') {
      const perms = user.permissions;
      
      // Convert object-based permissions to array format
      if (perms.academic) {
        if (perms.academic.canEnterResults) explicitPermissions.push(PERMISSIONS.ENTER_RESULTS);
        if (perms.academic.canEditResults) explicitPermissions.push(PERMISSIONS.EDIT_RESULTS);
        if (perms.academic.canViewAllResults) explicitPermissions.push(PERMISSIONS.VIEW_ALL_RESULTS);
        if (perms.academic.canPublishResults) explicitPermissions.push(PERMISSIONS.PUBLISH_RESULTS);
      }
      
      if (perms.administrative) {
        if (perms.administrative.canManageUsers) explicitPermissions.push(PERMISSIONS.MANAGE_USERS);
        if (perms.administrative.canManageClasses) explicitPermissions.push(PERMISSIONS.MANAGE_CLASSES);
        if (perms.administrative.canManageSubjects) explicitPermissions.push(PERMISSIONS.MANAGE_SUBJECTS);
        if (perms.administrative.canViewReports) explicitPermissions.push(PERMISSIONS.VIEW_REPORTS);
        if (perms.administrative.canExportData) explicitPermissions.push(PERMISSIONS.EXPORT_DATA);
        if (perms.administrative.canManageCalendar) explicitPermissions.push(PERMISSIONS.MANAGE_ACADEMIC_CALENDAR);
      }
      
      if (perms.financial) {
        // Add financial permission mappings if needed
      }
    } else if (Array.isArray(user.permissions)) {
      // Handle array-based permissions (fallback)
      explicitPermissions = user.permissions;
    }
    
    const rolePermissions = user.role ? ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [] : [];
    
    // Combine explicit permissions with role-based permissions
    return [...new Set([...explicitPermissions, ...rolePermissions])];
  }, [user, isAuthenticated]);

  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Convenience getters for common permission checks
  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS);
  const canManageStudents = hasPermission(PERMISSIONS.MANAGE_STUDENTS);
  const canManageTeachers = hasPermission(PERMISSIONS.MANAGE_TEACHERS);
  const canManageAcademics = hasAnyPermission([
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.MANAGE_SUBJECTS,
    PERMISSIONS.MANAGE_ACADEMIC_CALENDAR,
  ]);
  const canManageResults = hasPermission(PERMISSIONS.MANAGE_RESULTS);
  const canManageAttendance = hasPermission(PERMISSIONS.MANAGE_ATTENDANCE);
  const canManageTimetables = hasPermission(PERMISSIONS.MANAGE_TIMETABLES);
  const canViewReports = hasPermission(PERMISSIONS.VIEW_REPORTS);
  const canManageSystem = hasPermission(PERMISSIONS.MANAGE_SYSTEM);

  // Check if user has only read permissions (no create/update/delete)
  const isReadOnly = useMemo(() => {
    const writePermissions = [
      PERMISSIONS.CREATE_USERS,
      PERMISSIONS.UPDATE_USERS,
      PERMISSIONS.DELETE_USERS,
      PERMISSIONS.CREATE_STUDENTS,
      PERMISSIONS.UPDATE_STUDENTS,
      PERMISSIONS.DELETE_STUDENTS,
      PERMISSIONS.CREATE_TEACHERS,
      PERMISSIONS.UPDATE_TEACHERS,
      PERMISSIONS.DELETE_TEACHERS,
      PERMISSIONS.MANAGE_CLASSES,
      PERMISSIONS.MANAGE_SUBJECTS,
      PERMISSIONS.ENTER_RESULTS,
      PERMISSIONS.EDIT_RESULTS,
      PERMISSIONS.DELETE_RESULTS,
      PERMISSIONS.MARK_ATTENDANCE,
      PERMISSIONS.EDIT_ATTENDANCE,
      PERMISSIONS.DELETE_ATTENDANCE,
      PERMISSIONS.CREATE_TIMETABLES,
      PERMISSIONS.EDIT_TIMETABLES,
      PERMISSIONS.DELETE_TIMETABLES,
    ];
    
    return !hasAnyPermission(writePermissions);
  }, [userPermissions]);

  // Add role helper functions from useAuth
  const { hasRole, hasAnyRole, isAdmin, isTeacher, isStudent, isParent } = useAuth();

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageUsers,
    canManageStudents,
    canManageTeachers,
    canManageAcademics,
    canManageResults,
    canManageAttendance,
    canManageTimetables,
    canViewReports,
    canManageSystem,
    isReadOnly,
    // Role helpers
    hasRole,
    hasAnyRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
  };
}

export default usePermissions;
