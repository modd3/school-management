import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaTachometerAlt,
  FaUsers,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBook,
  FaClipboardList,
  FaCalendarAlt,
  FaUserCheck,
  FaClock,
  FaChartBar,
  FaCog,
  FaGraduationCap,
  FaSchool,
  FaClipboard,
  FaFileAlt,
  FaEye,
  FaChild,
  FaChartLine,
  FaChartPie,
  FaChartArea,
  FaUserPlus
} from 'react-icons/fa';
import { useAuth, usePermissions, useDocumentTitle } from '@/hooks';
import { DashboardSection } from '@/components/DashboardSection';

interface DashboardLink {
  to?: string;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
  isButton?: boolean;
  description?: string;
}

const ModernDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    canManageUsers, 
    canManageStudents, 
    canManageTeachers,
    canManageAcademics,
    canViewReports,
    isAdmin,
    isTeacher,
    isStudent,
    isParent
  } = usePermissions();

  useDocumentTitle(`Dashboard - ${user?.firstName} ${user?.lastName}`);

  const getAdminLinks = (): DashboardLink[] => [
    { 
      to: '/admin/users', 
      label: 'Manage Users', 
      icon: <FaUsers />,
      description: 'Create and manage system users'
    },
    { 
      to: '/admin/students', 
      label: 'Manage Students', 
      icon: <FaUserGraduate />,
      description: 'Student registration and profiles'
    },
    { 
      to: '/admin/teachers', 
      label: 'Manage Teachers', 
      icon: <FaChalkboardTeacher />,
      description: 'Teacher assignments and profiles'
    },
    { 
      to: '/admin/classes', 
      label: 'Manage Classes', 
      icon: <FaSchool />,
      description: 'Class management and assignments'
    },
    { 
      to: '/admin/subjects', 
      label: 'Manage Subjects', 
      icon: <FaBook />,
      description: 'Subject creation and management'
    },
    { 
      to: '/admin/assign-class-subjects', 
      label: 'Assign Class Subjects', 
      icon: <FaClipboard />,
      description: 'Link subjects to classes'
    },
    { 
      to: '/admin/terms', 
      label: 'Manage Terms', 
      icon: <FaCalendarAlt />,
      description: 'Academic calendar management'
    },
    { 
      to: '/admin/analytics', 
      label: 'School Analytics', 
      icon: <FaChartPie />,
      description: 'Performance analytics and reports'
    }
  ];

  const getTeacherLinks = (): DashboardLink[] => [
    { 
      to: '/teacher/enter-marks', 
      label: 'Enter Results', 
      icon: <FaClipboardList />,
      description: 'Enter student exam results'
    },
    { 
      to: '/teacher/my-results', 
      label: 'My Results', 
      icon: <FaFileAlt />,
      description: 'View results I have entered'
    },
    { 
      to: '/teacher/subjects', 
      label: 'My Subjects', 
      icon: <FaBook />,
      description: 'Subjects assigned to me'
    },
    { 
      to: '/teacher/class-reports', 
      label: 'Class Reports', 
      icon: <FaChartBar />,
      description: 'Generate class performance reports'
    },
    { 
      to: '/teacher/timetable', 
      label: 'My Timetable', 
      icon: <FaClock />,
      description: 'View my teaching schedule'
    }
  ];

  const getStudentLinks = (): DashboardLink[] => [
    { 
      to: '/student/results', 
      label: 'My Results', 
      icon: <FaChartBar />,
      description: 'View my exam results and progress'
    },
    { 
      to: '/student/reports', 
      label: 'Report Cards', 
      icon: <FaFileAlt />,
      description: 'Download report cards'
    },
    { 
      to: '/student/timetable', 
      label: 'Class Timetable', 
      icon: <FaClock />,
      description: 'View class schedule'
    },
    { 
      to: '/student/profile', 
      label: 'My Profile', 
      icon: <FaUserGraduate />,
      description: 'View and update profile'
    }
  ];

  const getParentLinks = (): DashboardLink[] => [
    { 
      to: '/parent/children-progress', 
      label: 'Children Progress', 
      icon: <FaChild />,
      description: 'View children\'s academic progress'
    },
    { 
      to: '/parent/reports', 
      label: 'Report Cards', 
      icon: <FaFileAlt />,
      description: 'Download children\'s report cards'
    },
    { 
      to: '/parent/communications', 
      label: 'School Communications', 
      icon: <FaBook />,
      description: 'Messages from school'
    }
  ];

  const renderWelcomeSection = () => (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-blue-100 text-lg">
            {user?.role === 'admin' && 'Manage your school system'}
            {user?.role === 'teacher' && 'Ready to inspire minds today?'}
            {user?.role === 'student' && 'Ready to learn something new?'}
            {user?.role === 'parent' && 'Stay updated on your child\'s progress'}
          </p>
          <div className="mt-3">
            <span className="bg-blue-400 bg-opacity-30 text-blue-100 px-3 py-1 rounded-full text-sm font-medium">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
          </div>
        </div>
        <div className="hidden md:block">
          <FaTachometerAlt className="text-6xl text-blue-200 opacity-50" />
        </div>
      </div>
    </div>
  );

  const renderQuickStats = () => {
    // This would typically come from an API call
    const stats = [
      { label: 'Total Students', value: '1,234', icon: <FaUserGraduate />, color: 'bg-green-500' },
      { label: 'Total Teachers', value: '89', icon: <FaChalkboardTeacher />, color: 'bg-blue-500' },
      { label: 'Active Classes', value: '24', icon: <FaSchool />, color: 'bg-purple-500' },
      { label: 'Subjects', value: '15', icon: <FaBook />, color: 'bg-orange-500' },
    ];

    if (!isAdmin()) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <div className="text-white text-xl">{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDashboardLinks = () => {
    let links: DashboardLink[] = [];
    let title = '';

    if (isAdmin()) {
      links = getAdminLinks();
      title = 'Administration';
    } else if (isTeacher()) {
      links = getTeacherLinks();
      title = 'Teaching Tools';
    } else if (isStudent()) {
      links = getStudentLinks();
      title = 'Student Portal';
    } else if (isParent()) {
      links = getParentLinks();
      title = 'Parent Portal';
    }

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link, index) => (
            <div key={index}>
              {link.to ? (
                <Link
                  to={link.to}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-600 text-xl group-hover:text-blue-700">
                      {link.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                        {link.label}
                      </h3>
                      {link.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {link.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ) : (
                <button
                  onClick={link.onClick}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-600 text-xl group-hover:text-blue-700">
                      {link.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                        {link.label}
                      </h3>
                      {link.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {link.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecentActivity = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
      <div className="space-y-4">
        {/* This would come from an API call */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="bg-green-100 p-2 rounded-lg">
            <FaClipboardList className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Results entered for Mathematics</p>
            <p className="text-xs text-gray-500">2 hours ago</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FaUserGraduate className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">New student registered</p>
            <p className="text-xs text-gray-500">5 hours ago</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="bg-purple-100 p-2 rounded-lg">
            <FaFileAlt className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Report card generated</p>
            <p className="text-xs text-gray-500">1 day ago</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {renderWelcomeSection()}
      {renderQuickStats()}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {renderDashboardLinks()}
        </div>
        <div className="lg:col-span-1">
          {renderRecentActivity()}
        </div>
      </div>
    </div>
  );
};

export default ModernDashboardPage;
