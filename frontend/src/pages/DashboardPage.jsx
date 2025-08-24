import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAcademicCalendars } from '../api/academicCalendar';
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
  const [activeCalendar, setActiveCalendar] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let calendarsRes, classesRes;
        
        if (user.role === 'admin') {
          [calendarsRes, classesRes] = await Promise.all([
            getAcademicCalendars(),
            getClasses()
          ]);
        } else if (user.role === 'teacher') {
          [calendarsRes, classesRes] = await Promise.all([
            getAcademicCalendars(), // Teachers also need calendars
            getTeacherClasses()
          ]);
        } else {
          calendarsRes = await getAcademicCalendars();
          classesRes = { classes: [] };
        }
        
        const activeCal = calendarsRes?.find(c => c.status === 'active');
        setActiveCalendar(activeCal);
        setClasses(classesRes.classes || []);
        
        if (activeCal) {
          const today = new Date();
          const term = activeCal.terms.find(t => today >= new Date(t.startDate) && today <= new Date(t.endDate));
          setCurrentTerm(term || activeCal.terms[0]);
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

  const getTeacherClassId = () => { // This logic might need adjustment based on user profile population
    if (user.role !== 'teacher' || user.profile?.teacherType !== 'class_teacher') return null;
    
    // Prioritize a direct ID from the user object if available
    if (user.assignedClassId) return user.assignedClassId;
    if (user.assignedClass) return user.assignedClass;

    // As a fallback, find the class they are the teacher of from the classes list
    if (classes && classes.length > 0) {
        const teacherClass = classes.find(cls => cls.classTeacher === user.profileId);
        if (teacherClass) return teacherClass._id;
    }
    
    return null;
  }

  const handleViewClassResults = (examType = 'Opener') => {
    if (!activeCalendar || !currentTerm) {
      alert('Please wait for the active academic calendar and term to load.');
      return;
    }
    
    if (user.role === 'admin') {
      navigate('/admin/class-results');
      return;
    }
    
    if (user.role === 'teacher' && user.profile) {
        if (user.profile.teacherType === 'class_teacher') {
            const classId = getTeacherClassId();
            if (classId) {
                navigate(`/teacher/class-results/${classId}/${activeCalendar.academicYear}/${currentTerm.termNumber}/${examType}`);
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
    if (!activeCalendar || !currentTerm) {
      alert('Please wait for the active academic calendar and term to load.');
      return;
    }
    
    if (user.role === 'admin') {
      navigate('/admin/class-final-reports');
      return;
    }
    
    if (user.role === 'teacher' && user.profile) {
        if (user.profile.teacherType === 'class_teacher') {
            const classId = getTeacherClassId();
            if (classId) {
                navigate(`/teacher/class-final-reports/${classId}/${activeCalendar.academicYear}/${currentTerm.termNumber}`);
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
    if (!activeCalendar || !currentTerm) {
      alert('Please ensure academic calendar is loaded');
      return;
    }
    navigate(`/student/report/${activeCalendar.academicYear}/${currentTerm.termNumber}`);
  };

  const handleViewStudentFinalReport = () => {
    if (!activeCalendar || !currentTerm) {
      alert('Please ensure academic calendar is loaded');
      return;
    }
    navigate(`/student/final-report/${activeCalendar.academicYear}/${currentTerm.termNumber}`);
  };

  const handleViewChildResults = (examType) => {
    if (!activeCalendar || !currentTerm) {
      alert('Please ensure academic calendar is loaded');
      return;
    }
    navigate(`/parent/child-results/${activeCalendar.academicYear}/${currentTerm.termNumber}`);
  };

  const handleViewChildFinalReport = () => {
    if (!activeCalendar || !currentTerm) {
      alert('Please ensure academic calendar is loaded');
      return;
    }
    navigate(`/parent/child-final-report/${activeCalendar.academicYear}/${currentTerm.termNumber}`);
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
    
    if (user.profile?.teacherType === 'class_teacher') {
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
        {activeCalendar && currentTerm && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Current Academic Term</h3>
            <p className="text-blue-700">
              {currentTerm.name} ({activeCalendar.academicYear})
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