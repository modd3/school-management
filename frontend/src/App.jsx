import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import your pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // Assuming you kept this for now, though admin-only registration is intended
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';

// Admin Pages
import CreateUserPage from './pages/admin/CreateUserPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageStudentsPage from './pages/admin/ManageStudentsPage';
import ManageTeachersPage from './pages/admin/ManageTeachersPage';
import ManageClassesPage from './pages/admin/ManageClassesPage';
import ManageSubjectsPage from './pages/admin/ManageSubjectsPage';
import ManageTermsPage from './pages/admin/ManageTermsPage'; 
import EditUserPage from './pages/admin/EditUserPage'; 
import EditStudentPage from './pages/admin/EditStudentPage'; // Import EditStudentPage
// Add this import
import DashboardLinkWrapper from './components/DashboardLinkWrapper';
import EnterMarksPage from './pages/teacher/EnterMarksPage';
import ReportCardPage from './pages/teacher/ReportCardPage';

// A simple Protected Route component (make sure this is robust in your actual app)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-20 text-gray-700">Loading authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if the user's role is allowed
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700 text-xl font-semibold">
        Access Denied! You do not have permission to view this page.
      </div>
    );
  }

  return children;
};

function App() {
  
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <div className="App">
          {/* Show DashboardLink on all pages except dashboard, login, and register */}
          <DashboardLinkWrapper />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} /> {/* Keep for now, but remember it's admin-only backend */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* Default redirect to dashboard if authenticated, otherwise to login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'teacher', 'student', 'parent']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/create-user"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CreateUserPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageTeachersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageSubjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/terms" // NEW ROUTE
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageTermsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users/edit/:userId" // NEW ROUTE
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EditUserPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students/edit/:studentId"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EditStudentPage />
                </ProtectedRoute>
              }
            />

            {/* Placeholder for other roles' routes */}
            {/* Example: Teacher Routes (add more as you implement pages) */}
            <Route
              path="/teacher/enter-marks"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <EnterMarksPage />
                </ProtectedRoute>
              }
            />
        

            {/* Catch-all for undefined routes */}
            <Route path="*" element={<div className="text-center mt-20 text-gray-700">404 - Page Not Found</div>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;