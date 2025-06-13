import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Assuming logoutUser from '../api/auth' is now simply `logout` from useAuth()
import {
  FaSignOutAlt,
  FaUserCircle,
  FaLaptopHouse,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUsers,
  FaUserPlus,
  FaListAlt,
  FaClipboardList,
  FaBookOpen,
  FaFileAlt,
  FaCalendarAlt, // Import the calendar icon for terms
} from 'react-icons/fa';

const DashboardPage = () => {
  const { user, logout } = useAuth(); // Use logout from AuthContext

  // Role-based dashboard sections
  const renderRoleActions = (role) => {
    switch (role) {
      case 'admin':
        return (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/admin/create-user" className="dashboard-link">
              <FaUserPlus className="inline-block mr-2" />
              Create User
            </Link>
            <Link to="/admin/users" className="dashboard-link">
              <FaUsers className="inline-block mr-2" />
              Manage Users
            </Link>
            <Link to="/admin/students" className="dashboard-link">
              <FaUserGraduate className="inline-block mr-2" />
              Manage Students
            </Link>
            <Link to="/admin/teachers" className="dashboard-link">
              <FaChalkboardTeacher className="inline-block mr-2" />
              Manage Teachers
            </Link>
            <Link to="/admin/classes" className="dashboard-link">
              <FaClipboardList className="inline-block mr-2" />
              Manage Classes
            </Link>
            <Link to="/admin/subjects" className="dashboard-link">
              <FaBookOpen className="inline-block mr-2" />
              Manage Subjects
            </Link>
            {/* NEW LINK FOR MANAGE TERMS */}
            <Link to="/admin/terms" className="dashboard-link">
              <FaCalendarAlt className="inline-block mr-2" />
              Manage Terms
            </Link>
          </div>
        );
      case 'class_teacher':
        return (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/teacher/enter-marks" className="dashboard-link">
              <FaClipboardList className="inline-block mr-2" />
              Enter Marks
            </Link>
            <Link to="/teacher/class-results" className="dashboard-link">
              <FaListAlt className="inline-block mr-2" />
              View Class Results
            </Link>
            <Link to="/teacher/publish-results" className="dashboard-link">
              <FaFileAlt className="inline-block mr-2" />
              Publish Results
            </Link>
            <Link to="/teacher/report-comments" className="dashboard-link">
              <FaBookOpen className="inline-block mr-2" />
              Report Card Comments
            </Link>
          </div>
        );
      case 'subject_teacher':
        return (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/teacher/enter-marks" className="dashboard-link">
              <FaClipboardList className="inline-block mr-2" />
              Enter Marks
            </Link>
            <Link to="/teacher/subject-results" className="dashboard-link">
              <FaListAlt className="inline-block mr-2" />
              View Subject Results
            </Link>
            <Link to="/teacher/comment" className="dashboard-link">
              <FaBookOpen className="inline-block mr-2" />
              Add Subject Comments
            </Link>
          </div>
        );
      case 'student':
        return (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/student/results" className="dashboard-link">
              <FaListAlt className="inline-block mr-2" />
              My Results
            </Link>
            <Link to="/student/report-card" className="dashboard-link">
              <FaFileAlt className="inline-block mr-2" />
              Report Card
            </Link>
            <Link to="/student/class-schedule" className="dashboard-link">
              <FaClipboardList className="inline-block mr-2" />
              Class Schedule
            </Link>
          </div>
        );
      case 'parent':
        return (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/parent/children-results" className="dashboard-link">
              <FaListAlt className="inline-block mr-2" />
              Children Results
            </Link>
            <Link to="/parent/communications" className="dashboard-link">
              <FaBookOpen className="inline-block mr-2" />
              School Communications
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  // Helper to render role description (unchanged from previous)
  const renderRoleSpecificContent = (role) => {
    switch (role) {
      case 'admin':
        return (
          <p className="text-gray-700 mt-2">
            <FaLaptopHouse className="inline-block mr-2" />
            As an Admin, you have full control over the system.
          </p>
        );
      case 'subject_teacher':
      case 'class_teacher':
        return (
          <p className="text-gray-700 mt-2">
            <FaChalkboardTeacher className="inline-block mr-2" />
            Manage your subjects, classes, and student marks.
          </p>
        );
      case 'student':
        return (
          <p className="text-gray-700 mt-2">
            <FaUserGraduate className="inline-block mr-2" />
            View your results, report cards, and class schedule.
          </p>
        );
      case 'parent':
        return (
          <p className="text-gray-700 mt-2">
            <FaUsers className="inline-block mr-2" />
            Monitor your child's progress and school communications.
          </p>
        );
      default:
        return null;
    }
  };

  // Use the logout from AuthContext, which now handles clearing localStorage token
  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-blue-600 mb-6 flex items-center justify-center gap-2">
          <FaUserCircle className="text-4xl" /> Welcome to your Dashboard!
        </h2>
        {user ? (
          <>
            <p className="text-lg text-gray-800 mb-2">
              Hello, <span className="font-semibold">{user.firstName} {user.lastName}</span>
              <span className="text-blue-500"> ({user.roleMapping || user.role})</span>
            </p>
            <p className="text-gray-600 mb-4">Email: {user.email}</p>
            {renderRoleSpecificContent(user.role)}
            {renderRoleActions(user.role)}
            <button
              onClick={handleLogout}
              className="mt-6 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center mx-auto"
            >
              <FaSignOutAlt className="mr-2" /> Logout
            </button>
          </>
        ) : (
          <p className="text-gray-700">Loading user data...</p>
        )}
      </div>
      <style>{`
  .dashboard-link {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    color: #2563eb;
    padding: 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.2s, color 0.2s;
  }
  .dashboard-link:hover {
    background: #2563eb;
    color: #fff;
  }
`}</style>
    </div>
  );
};

export default DashboardPage;