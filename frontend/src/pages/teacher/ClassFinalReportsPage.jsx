import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getClassFinalReports } from '../../api/results';
import { getTerms, getTeacherTerms } from '../../api/terms';
import { getClasses, getTeacherClasses } from '../../api/classes';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getMyClassAsClassTeacher } from '../../api/classes';


const ClassFinalReportsPage = () => {
  const { classId, termId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classId || '');
  const [selectedTerm, setSelectedTerm] = useState(termId || '');

  const isAdmin = user?.role === 'admin';
  const basePath = location.pathname.includes('/admin') ? '/admin' : '/teacher';

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return; // Wait until user object is available
      try {
        setLoading(true);
        // Fetch classes and terms based on user role
        let classesData;
              
              if (isAdmin) {
                classesData = await getClasses();
              } else if (user.teacherType === 'class_teacher') {
                classesData = await getMyClassAsClassTeacher();
              } else {
                classesData = await getTeacherClasses();
              }
        
              setClasses(classesData.classes || []);
        
              if (user.teacherType === 'class_teacher' && classesData.classes?.length) {
                setSelectedClass(classesData.classes[0]._id);
              }
        const termsPromise = isAdmin ? getTerms() : getTeacherTerms();

        const [termsData] = await Promise.all([
          termsPromise
        ]);

        setTerms(termsData.terms || []);
        
        // If parameters are in the URL, fetch the reports
        if (classId && termId) {
          // Pass the user's role to the API function
          const reportsData = await getClassFinalReports(classId, termId, user.role);
          setReports(reportsData);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [classId, termId, user, isAdmin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedTerm) {
      toast.warning('Please select a class and term.');
      return;
    }
    
    navigate(`${basePath}/class-final-reports/${selectedClass}/${selectedTerm}`);
  };

  const handleViewExamResults = () => {
    if (!selectedClass || !selectedTerm) {
      toast.warning('Please select a class and term.');
      return;
    }
    navigate(`${basePath}/class-results/${selectedClass}/${selectedTerm}/Opener`);
  };

  // Build a unique ordered list of all subjects for the table header
const allSubjects = reports?.reports
  ? Array.from(
      new Set(
        reports.reports.flatMap(report =>
          report.finalResults.map(subject => subject.subject)
        )
      )
    )
  : [];

// Map subject name for headers
const subjectNames = {};
reports?.reports?.forEach(report => {
  report.finalResults.forEach(subject => {
    subjectNames[subject.subject] = subject.subjectName || subject.subject;
  });
});

  if (user && user.role !== 'admin' && user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-red-600 text-5xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view this page.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading && !reports) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Class Final Reports</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
                value={selectedClass}
  onChange={(e) => setSelectedClass(e.target.value)}
  className="w-full p-2 border border-gray-300 rounded-md"
  required
  disabled={user?.teacherType === 'class_teacher'}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Term</option>
              {terms.map((term) => (
                <option key={term._id} value={term._id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Reports
            </button>
          </div>
        </form>
        
        <div className="mt-4">
          <button
            onClick={handleViewExamResults}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            View Exam Results
          </button>
        </div>
      </div>
      
      {reports && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {reports.class} - {reports.term} Final Reports
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No.</th>
                  {allSubjects.map(subjectId => (
                    <th key={subjectId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {subjectNames[subjectId]}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Average</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Grade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.reports.map((report) => (
                  <tr key={report.student._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{report.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.student.firstName} {report.student.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{report.student.admissionNumber}</td>
                    {allSubjects.map(subjectId => {
                      const subj = report.finalResults.find(s => s.subject === subjectId);
                      return (
                        <td key={subjectId} className="px-6 py-4 whitespace-nowrap">
                          {subj
                            ? `${Number(subj.finalPercentage).toFixed(2)}% (${subj.grade})`
                            : <span className="text-gray-400 font-semibold">0.00%</span>
                          }
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {Number(report.overallAverage).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {report.overallGrade || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassFinalReportsPage;