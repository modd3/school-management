import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTerms, getTeacherTerms } from '../api/terms';
import { getClasses, getTeacherClasses } from '../api/classes';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaSignOutAlt, FaUserCircle, FaUserPlus, FaUsers, FaChalkboardTeacher,
  FaUserGraduate, FaClipboardList, FaBookOpen, FaListAlt, FaFileAlt,
  FaCalendarAlt, FaLaptopHouse, FaChartBar, FaChartLine, FaEye, FaChild,
  FaChartPie, FaChartArea
} from 'react-icons/fa';
import DashboardSection from '../components/DashboardSection';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [termId, setTermId] = useState('');
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let termsRes, classesRes;
        
        if (user.role === 'admin') {
          [termsRes, classesRes] = await Promise.all([
            getTerms(),
            getClasses()
          ]);
        } else if (user.role === 'teacher') {
          [termsRes, classesRes] = await Promise.all([
            getTeacherTerms(),
            getTeacherClasses()
          ]);
        } else {
          termsRes = await getTerms();
          classesRes = { classes: [] };
        }
        
        setTerms(termsRes.terms || []);
        setClasses(classesRes.classes || []);
        
        const today = new Date();
        const currentTerm = termsRes.terms?.find(term => {
          const startDate = new Date(term.startDate);
          const endDate = new Date(term.endDate);
          return today >= startDate && today <= endDate;
        });
        
        if (currentTerm) {
          setTermId(currentTerm._id);
        } else if (termsRes.terms?.length > 0) {
          setTermId(termsRes.terms[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const getTeacherClassId = () => {
    if (user.role !== 'teacher' || user.teacherType !== 'class_teacher') return null;
    
    // Prioritize a direct ID from the user object if available
    if (user.assignedClassId) return user.assignedClassId;
    if (user.assignedClass) return user.assignedClass;

    // As a fallback, find the class they are the teacher of from the classes list
    if (classes && classes.length > 0) {
        const teacherClass = classes.find(cls => cls.classTeacher === user.profileId || cls.classTeacher === user._id);
        if (teacherClass) return teacherClass._id;
    }
    
    return null;
  }

  const handleViewClassResults = (examType = 'Opener') => {
    if (!termId) {
      alert('Please wait for the current term to load.');
      return;
    }
    
    if (user.role === 'admin') {
      navigate('/admin/class-results');
      return;
    }
    
    if (user.role === 'teacher') {
        if (user.teacherType === 'class_teacher') {
            const classId = getTeacherClassId();
            if (classId) {
                navigate(`/teacher/class-results/${classId}/${termId}/${examType}`);
            } else {
                 // Navigate to the selection page if no specific class is found
                navigate('/teacher/class-results');
            }
        } else {
            // For subject teachers, navigate to the generic page for them to select
            navigate('/teacher/class-results');
        }
    }
  };

  const handleViewFinalReports = () => {
    if (!termId) {
      alert('Please wait for the current term to load.');
      return;
    }
    
    if (user.role === 'admin') {
      navigate('/admin/class-final-reports');
      return;
    }
    
    if (user.role === 'teacher') {
        if (user.teacherType === 'class_teacher') {
            const classId = getTeacherClassId();
            if (classId) {
                navigate(`/teacher/class-final-reports/${classId}/${termId}`);
            } else {
                navigate('/teacher/class-final-reports');
            }
        } else {
             // For subject teachers, navigate to the generic page for them to select
            navigate('/teacher/class-final-reports');
        }
    }
  };


  const handleViewStudentResults = (examType) => {
    if (!termId) {
      alert('Please ensure terms are loaded');
      return;
    }
    navigate(`/student/results/${termId}/${examType}`);
  };

  const handleViewStudentFinalReport = () => {
    if (!termId) {
      alert('Please ensure terms are loaded');
      return;
    }
    navigate(`/student/final-report/${termId}`);
  };

  const handleViewChildResults = (examType) => {
    if (!termId) {
      alert('Please ensure terms are loaded');
      return;
    }
    navigate(`/parent/child-results/${termId}/${examType}`);
  };

  const handleViewChildFinalReport = () => {
    if (!termId) {
      alert('Please ensure terms are loaded');
      return;
    }
    navigate(`/parent/child-final-report/${termId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderAdminDashboard = () => {
    const adminLinks = [
      { to: '/admin/create-user', label: 'Create User', icon: <FaUserPlus /> },
      { to: '/admin/users', label: 'Manage Users', icon: <FaUsers /> },
      { to: '/admin/students', label: 'Manage Students', icon: <FaUserGraduate /> },
      { to: '/admin/teachers', label: 'Manage Teachers', icon: <FaChalkboardTeacher /> },
      { to: '/admin/classes', label: 'Manage Classes', icon: <FaBookOpen /> },
      { to: '/admin/subjects', label: 'Manage Subjects', icon: <FaBookOpen /> },
      { to: '/admin/assign-class-subject', label: 'Assign Class Subjects', icon: <FaClipboardList /> },
      { to: '/admin/terms', label: 'Manage Terms', icon: <FaCalendarAlt /> },
      { 
        onClick: () => handleViewClassResults(), 
        label: 'View Class Results', 
        icon: <FaChartBar />,
        isButton: true
      },
      { 
        onClick: handleViewFinalReports, 
        label: 'View Final Reports', 
        icon: <FaChartLine />,
        isButton: true
      },
      { 
        to: '/admin/school-performance', 
        label: 'School Performance', 
        icon: <FaChartPie />
      },
      { 
        to: '/admin/subject-analysis', 
        label: 'Subject Analysis', 
        icon: <FaChartArea />
      }
    ];

    return <DashboardSection title="Admin Panel" links={adminLinks} />;
  };

  const renderTeacherDashboard = () => {
    let teacherLinks = [];
    let title = '';

    const commonTeacherLinks = [
        { to: '/teacher/enter-marks', label: 'Enter Marks', icon: <FaClipboardList /> },
        { to: '/teacher/results/entered-by-me', label: 'My Entered Results', icon: <FaListAlt /> },
    ];
    
    if (user.teacherType === 'class_teacher') {
        title = 'Class Teacher Panel';
        teacherLinks = [
            ...commonTeacherLinks,
            { 
                onClick: () => handleViewClassResults('Opener'), 
                label: 'Class Opener Results', 
                icon: <FaFileAlt />,
                isButton: true
            },
            { 
                onClick: () => handleViewClassResults('Midterm'), 
                label: 'Class Midterm Results', 
                icon: <FaFileAlt />,
                isButton: true
            },
            { 
                onClick: () => handleViewClassResults('Endterm'), 
                label: 'Class Endterm Results', 
                icon: <FaFileAlt />,
                isButton: true
            },
            { 
                onClick: handleViewFinalReports, 
                label: 'Class Final Reports', 
                icon: <FaChartLine />,
                isButton: true
            },
        ];
    } else { // subject_teacher or other types
        title = 'Teacher Panel';
        teacherLinks = [
            ...commonTeacherLinks,
            { to: '/teacher/class-results', label: 'View Class Results', icon: <FaChartBar /> },
        ];
    }

    return <DashboardSection title={title} links={teacherLinks} />;
  };

  const renderStudentDashboard = () => {
    const studentLinks = [
      { 
        onClick: () => handleViewStudentResults('Opener'), 
        label: 'View Opener Results', 
        icon: <FaEye />,
        isButton: true
      },
      { 
        onClick: () => handleViewStudentResults('Midterm'), 
        label: 'View Midterm Results', 
        icon: <FaEye />,
        isButton: true
      },
      { 
        onClick: () => handleViewStudentResults('Endterm'), 
        label: 'View Endterm Results', 
        icon: <FaEye />,
        isButton: true
      },
      { 
        onClick: handleViewStudentFinalReport, 
        label: 'View Final Report', 
        icon: <FaFileAlt />,
        isButton: true
      },
      { to: '/student/profile', label: 'My Profile', icon: <FaUserCircle /> },
      { to: '/student/timetable', label: 'Class Timetable', icon: <FaCalendarAlt /> }
    ];

    return <DashboardSection title="Student Panel" links={studentLinks} />;
  };

  const renderParentDashboard = () => {
    const parentLinks = [
      { 
        onClick: () => handleViewChildResults('Opener'), 
        label: "View Child's Opener Results", 
        icon: <FaEye />,
        isButton: true
      },
      { 
        onClick: () => handleViewChildResults('Midterm'), 
        label: "View Child's Midterm Results", 
        icon: <FaEye />,
        isButton: true
      },
      { 
        onClick: () => handleViewChildResults('Endterm'), 
        label: "View Child's Endterm Results", 
        icon: <FaEye />,
        isButton: true
      },
      { 
        onClick: handleViewChildFinalReport, 
        label: "View Child's Final Report", 
        icon: <FaFileAlt />,
        isButton: true
      },
      { to: '/parent/child-profile', label: "Child's Profile", icon: <FaChild /> },
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
            <div className="text-center">
              <p className="text-gray-700">
                Hello <strong>{user.firstName} {user.lastName}</strong> — <span className="text-blue-500">{user.roleMapping || user.role}</span>
              </p>
              {user.role === 'teacher' && user.teacherType === 'class_teacher' && user.assignedClassName && (
                <p className="mt-2 text-sm text-gray-600">
                  Assigned Class: <span className="font-semibold">{user.assignedClassName}</span>
                </p>
              )}
              {user.role === 'student' && user.currentClass && (
                <p className="mt-2 text-sm text-gray-600">
                  Class: <span className="font-semibold">{user.currentClass}</span>
                </p>
              )}
              {user.role === 'parent' && user.children && user.children.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  Children: <span className="font-semibold">{user.children.map(child => child.name).join(', ')}</span>
                </p>
              )}
            </div>
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

        {/* Current Term Info */}
        {termId && terms.length > 0 && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Current Academic Term</h3>
            <p className="text-blue-700">
              {terms.find(t => t._id === termId)?.name || 'Unknown Term'}
            </p>
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