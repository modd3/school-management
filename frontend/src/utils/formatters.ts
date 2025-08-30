import { format, parseISO, isValid } from 'date-fns';

// Number formatters
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatCurrency = (value: number, currency: string = 'KES'): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
  }).format(value);
};

// Date formatters
export const formatDate = (date: string | Date, formatString: string = 'MMM dd, yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, formatString);
  } catch {
    return 'Invalid Date';
  }
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return formatDate(date, 'HH:mm');
};

export const formatRelativeDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid Date';
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  } catch {
    return 'Invalid Date';
  }
};

// Grade formatters
export const formatGrade = (score: number, gradingScale: any): string => {
  if (!gradingScale || !gradingScale.grades) return 'N/A';
  
  const grade = gradingScale.grades.find((g: any) => score >= g.minScore && score <= g.maxScore);
  return grade ? grade.grade : 'N/A';
};

export const getGradeColor = (grade: string): string => {
  const gradeColors: Record<string, string> = {
    'A': 'text-green-600',
    'A-': 'text-green-500',
    'B+': 'text-blue-600',
    'B': 'text-blue-500',
    'B-': 'text-blue-400',
    'C+': 'text-yellow-600',
    'C': 'text-yellow-500',
    'C-': 'text-yellow-400',
    'D+': 'text-orange-500',
    'D': 'text-orange-400',
    'D-': 'text-red-400',
    'E': 'text-red-500',
    'F': 'text-red-600',
  };
  
  return gradeColors[grade] || 'text-gray-500';
};

// Name formatters
export const formatName = (firstName: string, lastName: string, middleName?: string): string => {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  return parts.join(' ');
};

export const formatInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Phone number formatter
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format Kenyan phone numbers
  if (digits.startsWith('254')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  return phone;
};

// File size formatter
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Attendance percentage formatter
export const formatAttendancePercentage = (present: number, total: number): string => {
  if (total === 0) return '0%';
  return formatPercentage(present / total);
};

// Result status formatter
export const formatResultStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'submitted': 'Submitted',
    'approved': 'Approved',
    'published': 'Published',
  };
  
  return statusMap[status] || status;
};

export const getResultStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'draft': 'text-gray-500 bg-gray-100',
    'submitted': 'text-blue-500 bg-blue-100',
    'approved': 'text-green-500 bg-green-100',
    'published': 'text-purple-500 bg-purple-100',
  };
  
  return statusColors[status] || 'text-gray-500 bg-gray-100';
};

// Class formatter
export const formatClassName = (className: string, section?: string): string => {
  return section ? `${className} ${section}` : className;
};

// Term formatter
export const formatTerm = (termNumber: number): string => {
  const termNames = ['', 'Term 1', 'Term 2', 'Term 3'];
  return termNames[termNumber] || `Term ${termNumber}`;
};

// Academic year formatter
export const formatAcademicYear = (year: string): string => {
  if (year.includes('-')) return year;
  
  const currentYear = parseInt(year);
  return `${currentYear}-${currentYear + 1}`;
};

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Truncate text
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
