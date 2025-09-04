import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Modern components and hooks
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { useAuth, useTheme } from './hooks';

// Import actual pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ModernDashboardPage from './pages/ModernDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin pages
import UsersPage from './pages/admin/UsersPage';
import StudentsPage from './pages/admin/StudentsPage';

// Teacher pages
import ResultsEntryPage from './pages/teacher/ResultsEntryPage';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="app min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected routes with dashboard layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<ModernDashboardPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/students" element={<StudentsPage />} />
            <Route path="/admin/teachers" element={<div className="p-6"><h1>Teachers Management - Coming Soon</h1></div>} />
            <Route path="/admin/classes" element={<div className="p-6"><h1>Classes Management - Coming Soon</h1></div>} />
            <Route path="/admin/subjects" element={<div className="p-6"><h1>Subjects Management - Coming Soon</h1></div>} />
            <Route path="/admin/class-subjects" element={<div className="p-6"><h1>Class Subjects Assignment - Coming Soon</h1></div>} />
            <Route path="/admin/academic-calendar" element={<div className="p-6"><h1>Academic Calendar - Coming Soon</h1></div>} />
            <Route path="/admin/reports" element={<div className="p-6"><h1>Reports & Analytics - Coming Soon</h1></div>} />
            
            {/* Teacher Routes */}
            <Route path="/teacher/results/enter" element={<ResultsEntryPage />} />
            <Route path="/teacher/results/entered-by-me" element={<div className="p-6"><h1>My Results - Coming Soon</h1></div>} />
            <Route path="/teacher/subjects" element={<div className="p-6"><h1>My Subjects - Coming Soon</h1></div>} />
            <Route path="/teacher/attendance" element={<div className="p-6"><h1>Mark Attendance - Coming Soon</h1></div>} />
            <Route path="/teacher/timetable" element={<div className="p-6"><h1>My Timetable - Coming Soon</h1></div>} />
            <Route path="/teacher/reports" element={<div className="p-6"><h1>Class Reports - Coming Soon</h1></div>} />
            
            {/* Student Routes */}
            <Route path="/student/results" element={<div className="p-6"><h1>My Results - Coming Soon</h1></div>} />
            <Route path="/student/reports" element={<div className="p-6"><h1>Report Cards - Coming Soon</h1></div>} />
            <Route path="/student/timetable" element={<div className="p-6"><h1>Class Timetable - Coming Soon</h1></div>} />
            <Route path="/student/profile" element={<div className="p-6"><h1>My Profile - Coming Soon</h1></div>} />
            
            {/* Parent Routes */}
            <Route path="/parent/children-progress" element={<div className="p-6"><h1>Children Progress - Coming Soon</h1></div>} />
            <Route path="/parent/reports" element={<div className="p-6"><h1>Report Cards - Coming Soon</h1></div>} />
            <Route path="/parent/communications" element={<div className="p-6"><h1>School Communications - Coming Soon</h1></div>} />
          </Route>
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

export default App;
