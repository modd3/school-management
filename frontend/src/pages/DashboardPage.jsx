import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTerms } from '../api/terms';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaSignOutAlt, FaUserCircle, FaUserPlus, FaUsers, FaChalkboardTeacher,
  FaUserGraduate, FaClipboardList, FaBookOpen, FaListAlt, FaFileAlt,
  FaCalendarAlt, FaLaptopHouse
} from 'react-icons/fa';
import DashboardSection from '../components/DashboardSection';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [termId, setTermId] = useState('');
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        const res = await getTerms();
        setTerms(res.terms || []);
        if (res.terms?.length > 0) {
          setTermId(res.terms[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch terms');
      }
    };
    loadTerms();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const renderAdminDashboard = () => {
    const adminLinks = [
      { to: '/admin/create-user', label: 'Create User', icon: <FaUserPlus /> },
      { to: '/admin/users', label: 'Manage Users', icon: <FaUsers /> },
      { to: '/admin/students', label: 'Manage Students', icon: <FaUserGraduate /> },
      { to: '/admin/teachers', label: 'Manage Teachers', icon: <FaChalkboardTeacher /> },
      { to: '/admin/classes', label: 'Manage Classes', icon: <FaBookOpen /> },
      { to: '/admin/subjects', label: 'Manage Subjects', icon: <FaBookOpen /> },
      { to: '/admin/assign-class-subject', label: 'Assign Class Subjects', icon: <FaClipboardList /> },
      { to: '/admin/terms', label: 'Manage Terms', icon: <FaCalendarAlt /> }
    ];

    return <DashboardSection title="Admin Panel" links={adminLinks} />;
  };

  const renderTeacherDashboard = () => {
    let teacherLinks = [];
    let title = '';

    switch (user.teacherType) {
      case 'class_teacher':
        title = 'Class Teacher Panel';
        teacherLinks = [
          { to: '/teacher/enter-marks', label: 'Enter Marks', icon: <FaClipboardList /> },
          { to: '/teacher/results/entered-by-me', label: 'Results By Me', icon: <FaListAlt /> },
          { to: '/teacher/class-results', label: 'Class Results', icon: <FaFileAlt /> },
          { to: '/teacher/publish-results', label: 'Publish Results', icon: <FaFileAlt /> },
          { to: '/teacher/report-comments', label: 'Report Comments', icon: <FaBookOpen /> }
        ];
        break;
      case 'subject_teacher':
        title = 'Subject Teacher Panel';
        teacherLinks = [
          { to: '/teacher/enter-marks', label: 'Enter Marks', icon: <FaClipboardList /> },
          { to: '/teacher/results/entered-by-me', label: 'Results By Me', icon: <FaListAlt /> },
          { to: '/teacher/subject-results', label: 'Subject Results', icon: <FaFileAlt /> },
          { to: '/teacher/comment', label: 'Add Subject Comments', icon: <FaBookOpen /> }
        ];
        break;
      case 'principal':
        title = 'Principal Panel';
        teacherLinks = [
          { to: '/principal/overview', label: 'Overview', icon: <FaClipboardList /> },
          { to: '/principal/results-approval', label: 'Approve Results', icon: <FaFileAlt /> },
          { to: '/principal/communications', label: 'School Communication', icon: <FaBookOpen /> }
        ];
        break;
      case 'deputy':
        title = 'Deputy Panel';
        teacherLinks = [
          { to: '/deputy/overview', label: 'Deputy Overview', icon: <FaClipboardList /> },
          { to: '/deputy/discipline', label: 'Manage Discipline', icon: <FaFileAlt /> },
          { to: '/deputy/communications', label: 'School Communication', icon: <FaBookOpen /> }
        ];
        break;
      default:
        return <p className="text-gray-600 mt-4">Your teacher type is not supported yet.</p>;
    }

    return <DashboardSection title={title} links={teacherLinks} />;
  };

  const renderStudentDashboard = () => {
    if (!termId) {
      return (
        <div className="bg-white border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <FaUserGraduate /> Student Panel
          </h3>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-700 mb-1">
              <FaCalendarAlt className="inline-block mr-2" />
              Select Term
            </label>
            <select 
              value={termId} 
              onChange={e => setTermId(e.target.value)} 
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Select Term --</option>
              {terms.map(term => (
                <option key={term._id} value={term._id}>{term.name}</option>
              ))}
            </select>
          </div>
          <p className="text-gray-600 text-sm">Please select a term to view your options.</p>
        </div>
      );
    }

    const studentLinks = [
      { to: `/student/report/${termId}/Opener`, label: 'Opener Report', icon: <FaBookOpen /> },
      { to: `/student/report/${termId}/Midterm`, label: 'Midterm Report', icon: <FaBookOpen /> },
      { to: `/student/report/${termId}/Endterm`, label: 'Endterm Report', icon: <FaBookOpen /> },
      { to: `/student/final-report/${termId}`, label: 'Final Report Card', icon: <FaFileAlt /> },
      { to: '/student/class-schedule', label: 'Class Schedule', icon: <FaClipboardList /> }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <label className="block font-semibold text-sm text-gray-700 mb-1">
            <FaCalendarAlt className="inline-block mr-2" />
            Select Term
          </label>
          <select 
            value={termId} 
            onChange={e => setTermId(e.target.value)} 
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select Term --</option>
            {terms.map(term => (
              <option key={term._id} value={term._id}>{term.name}</option>
            ))}
          </select>
        </div>
        <DashboardSection title="Student Panel" links={studentLinks} />
      </div>
    );
  };

  const renderParentDashboard = () => {
    const parentLinks = [
      { to: '/parent/children-results', label: 'Children Results', icon: <FaListAlt /> },
      { to: '/parent/communications', label: 'School Communications', icon: <FaBookOpen /> }
    ];

    return <DashboardSection title="Parent Panel" links={parentLinks} />;
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-blue-600 mb-4 flex items-center gap-2 justify-center">
            <FaUserCircle /> Welcome to Your Dashboard
          </h2>
          {user ? (
            <p className="text-gray-700 text-center">
              Hello <strong>{user.firstName} {user.lastName}</strong> — <span className="text-blue-500">{user.roleMapping || user.role}</span>
            </p>
          ) : (
            <p className="text-center text-gray-600">Loading user info...</p>
          )}
        </div>

        {/* Dashboard Panel */}
        {user && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {user.role === 'admin' && renderAdminDashboard()}
            {user.role === 'teacher' && renderTeacherDashboard()}
            {user.role === 'student' && renderStudentDashboard()}
            {user.role === 'parent' && renderParentDashboard()}
          </div>
        )}

        {/* Logout Section */}
        {user && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <button 
                onClick={handleLogout} 
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 mx-auto transition-colors"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;