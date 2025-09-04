import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  FaHome,
  FaGraduationCap,
  FaSchool,
  FaClipboard,
  FaChevronDown
} from 'react-icons/fa';
import { useAuth, usePermissions } from '@/hooks';
import { cn } from '@/utils/cn';
import { formatName } from '@/utils/formatters';
import type { RootState } from '@/store';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  permissions?: string[];
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: FaTachometerAlt,
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: FaCog,
    roles: ['admin'],
    children: [
      { name: 'Users', href: '/admin/users', icon: FaUsers },
      { name: 'Students', href: '/admin/students', icon: FaUserGraduate },
      { name: 'Teachers', href: '/admin/teachers', icon: FaChalkboardTeacher },
      { name: 'Classes', href: '/admin/classes', icon: FaSchool },
      { name: 'Subjects', href: '/admin/subjects', icon: FaBook },
      { name: 'Academic Calendar', href: '/admin/academic-calendar', icon: FaCalendarAlt },
      { name: 'Class Subjects', href: '/admin/class-subjects', icon: FaClipboard },
      { name: 'Reports', href: '/admin/reports', icon: FaChartBar },
    ],
  },
  {
    name: 'Academic',
    href: '/academic',
    icon: FaGraduationCap,
    roles: ['admin', 'teacher'],
    children: [
      { name: 'Enter Results', href: '/teacher/results/enter', icon: FaClipboardList, roles: ['teacher'] },
      { name: 'My Results', href: '/teacher/results/entered-by-me', icon: FaClipboardList, roles: ['teacher'] },
      { name: 'Class Results', href: '/teacher/class-results', icon: FaChartBar, roles: ['admin', 'teacher'] },
      { name: 'Final Reports', href: '/teacher/class-final-reports', icon: FaClipboard, roles: ['admin', 'teacher'] },
    ],
  },
  {
    name: 'Attendance',
    href: '/attendance',
    icon: FaUserCheck,
    roles: ['admin', 'teacher'],
    children: [
      { name: 'Mark Attendance', href: '/teacher/attendance', icon: FaUserCheck, roles: ['teacher'] },
      { name: 'Attendance Reports', href: '/admin/attendance-reports', icon: FaChartBar, roles: ['admin'] },
    ],
  },
  {
    name: 'Timetable',
    href: '/timetable',
    icon: FaClock,
    children: [
      { name: 'View Timetable', href: '/timetable', icon: FaClock },
      { name: 'Manage Timetables', href: '/admin/timetables', icon: FaCog, roles: ['admin'] },
      { name: 'My Schedule', href: '/teacher/timetable', icon: FaClock, roles: ['teacher'] },
    ],
  },
  {
    name: 'My Results',
    href: '/student/results',
    icon: FaChartBar,
    roles: ['student'],
  },
  {
    name: 'My Attendance',
    href: '/student/attendance',
    icon: FaUserCheck,
    roles: ['student'],
  },
  {
    name: 'My Children',
    href: '/parent/children-progress',
    icon: FaUserGraduate,
    roles: ['parent'],
  },
];

interface SidebarItemProps {
  item: NavigationItem;
  isCollapsed: boolean;
  depth?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isCollapsed, depth = 0 }) => {
  const location = useLocation();
  const { hasAnyRole } = usePermissions();
  
  // Check if user has access to this item
  if (item.roles && !hasAnyRole(item.roles)) {
    return null;
  }
  
  const isActive = location.pathname === item.href || 
    (item.children && item.children.some(child => location.pathname.startsWith(child.href)));
  
  const hasChildren = item.children && item.children.length > 0;
  const [isExpanded, setIsExpanded] = React.useState(isActive);
  
  React.useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);
  
  const ItemIcon = item.icon;
  
  return (
    <div className="mb-1">
      {hasChildren ? (
        <button
          onClick={() => !isCollapsed && setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
            depth > 0 && 'ml-4',
            isActive
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <ItemIcon className={cn(
            'flex-shrink-0 h-5 w-5',
            isCollapsed ? 'mx-auto' : 'mr-3'
          )} />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.name}</span>
              <FaChevronDown className={cn(
                'h-3 w-3 transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </>
          )}
        </button>
      ) : (
        <Link
          to={item.href}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
            depth > 0 && 'ml-4',
            location.pathname === item.href
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <ItemIcon className={cn(
            'flex-shrink-0 h-5 w-5',
            isCollapsed ? 'mx-auto' : 'mr-3'
          )} />
          {!isCollapsed && <span>{item.name}</span>}
        </Link>
      )}
      
      {/* Children */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <SidebarItem 
              key={child.href} 
              item={child} 
              isCollapsed={isCollapsed}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isCollapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed);
  
  return (
    <div className={cn(
      'fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo/Brand */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FaHome className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                SMS
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                School Management
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => (
            <SidebarItem 
              key={item.href} 
              item={item} 
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </nav>
      
      {/* User info at bottom */}
      {!isCollapsed && user && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              {user.firstName && user.lastName 
                ? `${user.firstName[0]}${user.lastName[0]}` 
                : user.email ? user.email[0].toUpperCase() : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.firstName && user.lastName 
                  ? formatName(user.firstName, user.lastName)
                  : user.email || 'Unknown User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
