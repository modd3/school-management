// User and Authentication Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  profileId?: string;
  roleMapping?: 'Teacher' | 'Student' | 'Parent' | 'User';
  permissions: {
    academic: {
      canEnterResults: boolean;
      canEditResults: boolean;
      canViewAllResults: boolean;
      canPublishResults: boolean;
      subjects: string[];
      classes: string[];
    };
    administrative: {
      canManageUsers: boolean;
      canManageClasses: boolean;
      canManageSubjects: boolean;
      canViewReports: boolean;
      canExportData: boolean;
      canManageCalendar: boolean;
      canSendBulkMessages: boolean;
    };
    financial: {
      canViewPayments: boolean;
      canProcessPayments: boolean;
      canGenerateStatements: boolean;
    };
  };
  children?: string[]; // For parent role
  studentInfo?: {
    admissionNumber?: string;
    dateOfBirth?: Date;
    guardianContact?: string;
    medicalInfo?: string;
    bloodGroup?: string;
    allergies?: string[];
  };
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
      push: boolean;
    };
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
  // Security fields
  lastLogin?: Date;
  loginAttempts: number;
  accountLocked: boolean;
  lockUntil?: Date;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  // Audit fields
  isActive: boolean;
  deactivatedAt?: Date;
  deactivatedBy?: string;
  lastPasswordChange: Date;
  fullName?: string; // Virtual field
  isLocked?: boolean; // Virtual field
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Academic Types
export interface Class {
  _id: string;
  name: string;
  grade: number;
  academicYear: string;
  classCode: string;
  classTeacher?: string;
  students?: string[];
  subjects?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  category: 'Core' | 'Optional' | 'Elective';
  description?: string;
  creditHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  admissionNumber: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  parentContacts: string[]; // Parent ObjectIds
  studentPhotoUrl?: string;
  isActive: boolean;
  userId: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  currentClass?: any; // Virtual field
  createdAt: Date;
  updatedAt: Date;
}

export interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  staffId: string;
  email: string;
  phoneNumber?: string;
  subjectsTaught: string[];
  classTaught?: string;
  teacherType: 'principal' | 'deputy_principal' | 'class_teacher' | 'subject_teacher';
  userId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Parent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userId: string;
  children: string[];
  occupation?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Results and Grading Types
export interface Assessment {
  marks: number;
  maxMarks: number;
  date: Date;
  status: 'present' | 'absent' | 'excused' | 'sick' | 'late';
  percentage?: number;
  grade?: string;
  points?: number;
  teacherComments?: string;
  enteredBy: string;
  enteredAt: Date;
  lastModified: Date;
  modifiedBy?: string;
}

export interface Result {
  _id: string;
  student: string;
  subject: string;
  class: string;
  academicYear: string;
  termNumber: number;
  assessments: {
    cat1?: Assessment;
    cat2?: Assessment;
    endterm?: Assessment;
  };
  totalMarks?: number;
  totalMaxMarks?: number;
  overallPercentage?: number;
  overallGrade?: string;
  overallPoints?: number;
  subjectPosition?: number;
  classPosition?: number;
  streamPosition?: number;
  totalStudentsInSubject?: number;
  performanceMetrics?: {
    improvement?: number;
    consistency?: number;
    trend?: 'improving' | 'declining' | 'stable' | 'inconsistent';
    strongestAssessment?: 'cat1' | 'cat2' | 'endterm';
    weakestAssessment?: 'cat1' | 'cat2' | 'endterm';
  };
  teacherComments?: string;
  classTeacherComments?: string;
  status: 'draft' | 'submitted' | 'verified' | 'published' | 'archived';
  isPublished: boolean;
  publishedAt?: Date;
  enteredBy: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradingScale {
  _id: string;
  name: string;
  description?: string;
  academicLevel: 'primary' | 'secondary' | 'tertiary';
  gradingSystem: '8-4-4' | 'CBC' | 'IGCSE' | 'IB' | 'A-Level' | 'Custom';
  scale: GradeRange[];
  config: {
    passingGrade: string;
    passingPercentage: number;
    maxPoints: number;
    usePoints: boolean;
    roundToNearest: 0.1 | 0.5 | 1;
  };
  isDefault: boolean;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeRange {
  grade: string;
  minMarks: number;
  maxMarks: number;
  points: number;
  description: string;
  color?: string;
  remarks: 'Excellent' | 'Very Good' | 'Good' | 'Satisfactory' | 'Needs Improvement' | 'Poor';
}

// Progress Tracking Types
export interface SubjectPerformance {
  subject: string;
  totalMarks?: number;
  totalMaxMarks?: number;
  percentage?: number;
  grade?: string;
  points?: number;
  position?: number;
  totalStudents?: number;
  improvement?: {
    marks?: number;
    percentage?: number;
    position?: number;
  };
  trend?: 'improving' | 'declining' | 'stable' | 'new';
  assessments?: {
    cat1?: { marks: number; percentage: number; grade: string };
    cat2?: { marks: number; percentage: number; grade: string };
    endterm?: { marks: number; percentage: number; grade: string };
  };
  teacherComments?: string;
  teacherRecommendations?: string[];
}

export interface TermProgress {
  termId: string;
  termName: string;
  termNumber: number;
  academicYear: string;
  totalMarks?: number;
  totalMaxMarks?: number;
  totalPoints?: number;
  averagePercentage?: number;
  meanGradePoint?: number;
  overallGrade?: string;
  classPosition?: number;
  streamPosition?: number;
  totalStudentsInClass?: number;
  totalStudentsInStream?: number;
  subjectPerformance: SubjectPerformance[];
  attendance?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateCount: number;
    attendancePercentage: number;
  };
  insights?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    concernAreas: string[];
    achievements: string[];
  };
  behavior?: {
    conduct: string;
    punctuality: string;
    participation: string;
    leadership: string;
  };
  classTeacherComment?: string;
  principalComment?: string;
  parentFeedback?: string;
  isPublished: boolean;
  publishedAt?: Date;
  reportCardGenerated: boolean;
  reportCardUrl?: string;
}

export interface StudentProgress {
  _id: string;
  student: string;
  academicYear: string;
  class: string;
  termlyProgress: TermProgress[];
  overallTrends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Academic Calendar Types
export interface ExamPeriod {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface Term {
  termNumber: number;
  name: string;
  startDate: Date;
  endDate: Date;
  examPeriods: ExamPeriod[];
}

export interface Holiday {
  name: string;
  startDate: Date;
  endDate: Date;
  type?: 'national' | 'school' | 'mid-term';
}

export interface AcademicCalendar {
  _id: string;
  academicYear: string;
  terms: Term[];
  holidays: Holiday[];
  status: 'active' | 'archived' | 'draft';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Types
export interface AttendanceRecord {
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused' | 'sick' | 'suspended';
  arrivalTime?: Date;
  departureTime?: Date;
  remarks?: string;
  markedBy: string;
  markedAt: Date;
  lastModified: Date;
  modifiedBy?: string;
}

export interface SubjectAttendance {
  subject: string;
  teacher: string;
  period?: number;
  attendance: AttendanceRecord[];
}

export interface AttendanceNotification {
  type: 'absence_alert' | 'late_alert' | 'improvement_notice' | 'concern_notice';
  message: string;
  sentTo: string[];
  sentAt: Date;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  triggeredBy: {
    absentDays?: number;
    lateDays?: number;
    consecutiveAbsences?: number;
  };
}

export interface MedicalRecord {
  date: Date;
  condition: string;
  doctorNote?: string;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  documentUrl?: string;
  verifiedBy?: string;
}

export interface LeaveRequest {
  _id?: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  requestedBy: 'student' | 'parent' | 'guardian';
  contactInfo?: string;
  documentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  actualReturnDate?: Date;
}

export interface AttendancePatterns {
  consecutiveAbsences: number;
  mostAbsentDay?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  frequentLateArrival: boolean;
  attendanceRisk: 'low' | 'medium' | 'high';
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  sickDays: number;
  suspendedDays: number;
  attendancePercentage: number;
  lastUpdated: Date;
}

export interface Attendance {
  _id: string;
  student: string;
  class: string;
  academicYear: string;
  term: string;
  dailyAttendance: AttendanceRecord[];
  subjectAttendance?: SubjectAttendance[];
  summary: AttendanceSummary;
  patterns: AttendancePatterns;
  notifications: AttendanceNotification[];
  medicalRecords: MedicalRecord[];
  leaveRequests: LeaveRequest[];
  currentStreak?: number; // Virtual field
  attendanceStatus?: string; // Virtual field
  createdAt: Date;
  updatedAt: Date;
}

// Timetable Types
export interface TimetablePeriod {
  periodNumber: number;
  startTime: string;
  endTime: string;
  duration: number;
  subject: string;
  teacher: string;
  room?: string;
  type?: 'lesson' | 'break' | 'lunch' | 'assembly' | 'games';
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
}

export interface Timetable {
  _id: string;
  class: string;
  academicYear: string;
  termNumber: number;
  periods: TimetablePeriod[];
  effectiveDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  createdBy: string;
  lastModifiedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalSubjects: number;
  activeAcademicYear: string;
  currentTerm: string;
  recentActivity: {
    results: number;
    attendance: number;
    users: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'result_entry' | 'user_creation' | 'attendance' | 'report_generation';
  description: string;
  user: string;
  student?: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  password: string;
  passwordConfirm: string;
}

export interface CreateStudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  admissionNumber: string;
  dateOfBirth: Date;
  currentClass: string;
  guardianInfo: {
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  };
}

export interface CreateTeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  staffId: string;
  phoneNumber?: string;
  teacherType: 'principal' | 'deputy_principal' | 'class_teacher' | 'subject_teacher';
  subjectsTaught: string[];
  classTaught?: string;
}

export interface ResultEntryFormData {
  studentId: string;
  subjectId: string;
  classId: string;
  academicYear: string;
  termNumber: number;
  assessments: {
    cat1?: { marks: number; maxMarks: number };
    cat2?: { marks: number; maxMarks: number };
    endterm?: { marks: number; maxMarks: number };
  };
  teacherComments?: string;
}

// Additional Form Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UpdateUserFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  preferences?: Partial<User['preferences']>;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// UI State Types
export interface Notification {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  timestamp: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'destructive' | 'warning';
  isLoading: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface Modal {
  isOpen: boolean;
  type?: string;
  title?: string;
  data?: any;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface UIState {
  theme: Theme;
  colorScheme: ColorScheme;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
  confirmDialog: ConfirmDialog;
  modal: Modal;
  breadcrumbs: Breadcrumb[];
}

export type Theme = 'light' | 'dark' | 'auto';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red';

// Common utility types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, record: T) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange';
  options?: SelectOption[];
  placeholder?: string;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}
