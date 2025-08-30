import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Modern components and hooks
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { useAuth, useTheme } from './hooks';

// For now, let's create simple placeholder pages to avoid import errors
const LoginPage = () => <div>Login Page - Coming Soon</div>;
const RegisterPage = () => <div>Register Page - Coming Soon</div>;
const ForgotPasswordPage = () => <div>Forgot Password - Coming Soon</div>;
const ResetPasswordPage = () => <div>Reset Password - Coming Soon</div>;
const DashboardPage = () => <div>Dashboard - Coming Soon</div>;

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
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* More routes will be added as pages are created */}
          </Route>
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-400">404</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">Page Not Found</p>
              <Navigate to="/dashboard" />
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
};

export default App;
