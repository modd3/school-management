import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTerms } from '../api/terms';
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
  FaCalendarAlt,
} from 'react-icons/fa';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [termId, setTermId] = useState('');
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    async function loadTerms() {
      const data = await getTerms();
      setTerms(data.terms || []);
      if (data.terms?.length > 0) {
        setTermId(data.terms[0]._id); // Default to first term
      }
    }
    loadTerms();
  }, []);

  // Role-based dashboard sections
  const renderRoleActions = (role, teacherType) => {
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
            <Link to="/admin/terms" className="dashboard-link">
              <FaCalendarAlt className="inline-block mr-2" />
              Manage Terms
            </Link>
          </div>
        );
      case 'teacher':
        switch (teacherType) {
          case 'class_teacher':
            return (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/teacher/enter-marks" className="dashboard-link">
                  <FaClipboardList className="inline-block mr-2" />
                  Enter Marks
                </Link>
                <Link to="/teacher/results/entered-by-me" className="dashboard-link">
                  <FaListAlt className="inline-block mr-2" />
                  Results By Me
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
                <Link to="/teacher/results/entered-by-me" className="dashboard-link">
                  <FaListAlt className="inline-block mr-2" />
                  Results By Me
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
          case 'principal':
            return (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/principal/overview" className="dashboard-link">
                  <FaClipboardList className="inline-block mr-2" />
                  School Overview
                </Link>
                <Link to="/principal/results-approval" className="dashboard-link">
                  <FaFileAlt className="inline-block mr-2" />
                  Approve Results
                </Link>
                <Link to="/principal/communications" className="dashboard-link">
                  <FaBookOpen className="inline-block mr-2" />
                  School Communications
                </Link>
              </div>
            );
          case 'deputy':
            return (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/deputy/overview" className="dashboard-link">
                  <FaClipboardList className="inline-block mr-2" />
                  Deputy Overview
                </Link>
                <Link to="/deputy/discipline" className="dashboard-link">
                  <FaFileAlt className="inline-block mr-2" />
                  Manage Discipline
                </Link>
                <Link to="/deputy/communications" className="dashboard-link">
                  <FaBookOpen className="inline-block mr-2" />
                  School Communications
                </Link>
              </div>
            );
          default:
            return (
              <div className="mt-6 text-gray-600">No dashboard available for your teacher type.</div>
            );
        }
      case 'student':
        return (
          <div className="mt-6">
            <div className="mb-4 flex flex-col md:flex-row items-center gap-4">
              <label htmlFor="term-select" className="font-medium flex items-center gap-2">
                <FaCalendarAlt /> Select Term:
              </label>
              <select
                id="term-select"
                className="border px-3 py-2 rounded"
                value={termId}
                onChange={e => setTermId(e.target.value)}
              >
                <option value="">-- Select Term --</option>
                {terms.map(term => (
                  <option key={term._id} value={term._id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>
            {termId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to={`/student/report/${termId}/Opener`} className="dashboard-link">
                  📘 Opener Exam Report
                </Link>
                <Link to={`/student/report/${termId}/Midterm`} className="dashboard-link">
                  📗 Midterm Exam Report
                </Link>
                <Link to={`/student/report/${termId}/Endterm`} className="dashboard-link">
                  📙 Endterm Exam Report
                </Link>
                <Link to={`/student/final-report/${termId}`} className="dashboard-link">
  📝 Final Report Card (30/30/70)
</Link>

                <Link to="/student/class-schedule" className="dashboard-link">
                  <FaClipboardList className="inline-block mr-2" />
                  Class Schedule
                </Link>
              </div>
            ) : (
              <p className="text-red-600">Please select a term to view exam reports.</p>
            )}
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

  // Helper to render role description
  const renderRoleSpecificContent = (role, teacherType) => {
    switch (role) {
      case 'admin':
        return (
          <p className="text-gray-700 mt-2">
            <FaLaptopHouse className="inline-block mr-2" />
            As an Admin, you have full control over the system.
          </p>
        );
      case 'teacher':
        switch (teacherType) {
          case 'class_teacher':
            return (
              <p className="text-gray-700 mt-2">
                <FaChalkboardTeacher className="inline-block mr-2" />
                Manage your class, marks, and report comments.
              </p>
            );
          case 'subject_teacher':
            return (
              <p className="text-gray-700 mt-2">
                <FaChalkboardTeacher className="inline-block mr-2" />
                Manage your subjects and student marks.
              </p>
            );
          case 'principal':
            return (
              <p className="text-gray-700 mt-2">
                <FaChalkboardTeacher className="inline-block mr-2" />
                Oversee school performance and approve results.
              </p>
            );
          case 'deputy':
            return (
              <p className="text-gray-700 mt-2">
                <FaChalkboardTeacher className="inline-block mr-2" />
                Assist in school management and discipline.
              </p>
            );
          default:
            return null;
        }
      case 'student':
        return (
          <div className="mt-4 space-y-4">
            <div className="text-gray-700 flex items-center gap-2">
              <FaUserGraduate />
              <span>View your results, report cards, and class schedule:</span>
            </div>
          </div>
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
            {renderRoleSpecificContent(user.role, user.teacherType)}
            {renderRoleActions(user.role, user.teacherType)}
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