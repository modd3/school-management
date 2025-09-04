import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getClassExamResults } from '../../api/results';
import { getTerms, getTeacherTerms } from '../../api/terms';
import { getClasses, getTeacherClasses } from '../../api/classes';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getMyClassAsClassTeacher } from '../../api/classes';
import { FaBookOpen, FaPrint, FaFilePdf } from 'react-icons/fa';
import { calculateGradeAndPoints } from '../../utils/grading';

const ClassExamResultsPage = () => {
  const { classId, termId, examType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const reportRef = useRef();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classId || '');
  const [selectedTerm, setSelectedTerm] = useState(termId || '');
  const [selectedExamType, setSelectedExamType] = useState(examType || 'Opener');

  const isAdmin = user?.role === 'admin';
  const basePath = location.pathname.includes('/admin') ? '/admin' : '/teacher';

  // Inject print styles
  useEffect(() => {
    const styleId = 'report-print-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media print {
          @page { size: A4 landscape; margin: 0.2in; }
          body { font-family: 'Times New Roman', serif !important; color: #000 !important; background: white !important; font-size: 10pt !important; line-height: 1.1 !important; }
          .print\\:hidden { display: none !important; }
          .print\\:max-w-full { max-width: 100% !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:mt-0 { margin-top: 0 !important; }
          .print\\:p-2 { padding: 0.5rem !important; }
          .print\\:mb-1 { margin-bottom: 0.25rem !important; }
          .print\\:mb-2 { margin-bottom: 0.5rem !important; }
          .print\\:text-3xl { font-size: 14pt !important; font-weight: bold !important; }
          .print\\:text-xl { font-size: 12pt !important; font-weight: bold !important; }
          .print\\:text-base { font-size: 10pt !important; }
          .print\\:text-sm { font-size: 9pt !important; }
          .print\\:text-xs { font-size: 8pt !important; }
          .print\\:text-2xs { font-size: 7pt !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:text-black { color: #000000 !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:break-avoid { page-break-inside: avoid !important; }
          table { border-collapse: collapse !important; width: 100% !important; font-size: 7pt !important; }
          th, td { border: 0.5pt solid #000 !important; padding: 1px !important; text-align: left !important; }
          th { background-color: #f0f0f0 !important; font-weight: bold !important; }
          .print-container { height: auto !important; min-height: auto !important; max-height: none !important; }
          .print\\:compact { margin: 0.1rem 0 !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const style = document.getElementById(styleId);
      if (style) style.remove();
    };
  }, []);

  const handlePrint = () => window.print();
  const handleExportPDF = () => window.print();

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return; // Wait until user object is available
      try {
        setLoading(true);
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
        
        // If parameters are in the URL, fetch the results
        if (classId && termId && examType) {
          // Pass the user's role to the API function
          const resultsData = await getClassExamResults(classId, termId, examType, user.role);
          setResults(resultsData);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [classId, termId, examType, user, isAdmin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedTerm || !selectedExamType) {
      toast.warning('Please select a class, term, and exam type.');
      return;
    }
    
    navigate(`${basePath}/class-results/${selectedClass}/${selectedTerm}/${selectedExamType}`);
  };

  const handleViewFinalReports = () => {
    if (!selectedClass || !selectedTerm) {
      toast.warning('Please select a class and term.');
      return;
    }
    navigate(`${basePath}/class-final-reports/${selectedClass}/${selectedTerm}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (user && user.role !== 'admin' && user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-red-600 text-5xl mb-4">🛡</div>
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

  if (loading && !results) {
    return <LoadingSpinner />;
  }

  // 1. Get all unique subjects in order
const allSubjects = results?.results
  ? Array.from(
      new Set(
        results.results.flatMap(studentResult =>
          studentResult.results.map(subject => subject.subject)
        )
      )
    )
  : [];

// 2. Map subject name for headers
const subjectNames = {};
results?.results.forEach(studentResult => {
  studentResult.results.forEach(subject => {
    subjectNames[subject.subject] = subject.subjectName || subject.subject; // Use subjectName if available
  });
});

  return (
    <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-lg mt-4 print:shadow-none print:mt-0 print:max-w-full print:p-2 print-container">
      {/* Print/Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 gap-2 print:hidden border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaBookOpen /> Class Exam Results
        </h1>
        {results && (
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <FaPrint /> Print
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              <FaFilePdf /> PDF
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4 print:p-2">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:shadow-none print:mb-2">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="Opener">Opener</option>
                <option value="Midterm">Midterm</option>
                <option value="Endterm">Endterm</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                View Results
              </button>
            </div>
          </form>
          
          <div className="mt-4 print:hidden">
            <button
              onClick={handleViewFinalReports}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              View Final Reports
            </button>
          </div>
        </div>
        
        
{results && (
  <div ref={reportRef}>
    {/* School Header for Print */}
    <div className="text-center mb-4 print:mb-2 print:break-avoid hidden print:block">
      <h1 className="text-2xl font-bold text-blue-900 mb-1 print:text-3xl print:text-black">
        Blue Sky Mixed Secondary School
      </h1>
      <div className="text-xs text-gray-600 space-y-0 print:text-2xs print:text-black print:compact">
        <p>P.O BOX 537 - 01100 KAJIADO, KENYA</p>
        <p>Tel: +2547 07922901 | Email: bluesksecschool@gmail.com</p>
      </div>
      <div className="mt-2 mb-2 print:compact">
        <h2 className="text-lg font-semibold text-gray-800 print:text-xl print:text-black">
          CLASS {selectedExamType.toUpperCase()} EXAM RESULTS
        </h2>
      </div>
    </div>

    <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:p-2">
      <h2 className="text-xl font-semibold mb-4 print:text-base print:mb-2 print:text-black">
        {results.class} - {results.term} - {results.examType} Results
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 print:divide-black">
          <thead className="bg-gray-50 print:bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Position</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Student</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Adm No.</th>
              {allSubjects.map(subjectId => (
                <th key={subjectId} className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">
                  {subjectNames[subjectId] === 'Mathematics' ? 'Maths' : (subjectNames[subjectId]?.length > 10 ? subjectNames[subjectId].substring(0, 8) + '.' : subjectNames[subjectId])}                        
                </th>
              ))}
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Total Marks</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Average</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Grade</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Points</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Comment</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 print:divide-black">
            {results.results.map((studentResult, index) => (
              <tr key={studentResult.student._id} className={index % 2 === 0 ? 'bg-gray-50 print:bg-white' : 'bg-white'}>
                <td className="px-2 py-2 whitespace-nowrap text-sm print:text-2xs print:px-1 print:py-1 font-semibold">{studentResult.position}</td>
                <td className="px-2 py-2 whitespace-nowrap text-sm print:text-2xs print:px-1 print:py-1">
                  {studentResult.student.firstName} {studentResult.student.lastName}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-sm print:text-2xs print:px-1 print:py-1">{studentResult.student.admissionNumber}</td>
                {allSubjects.map(subjectId => {
                  const subj = studentResult.results.find(s => s.subject === subjectId);
                  return (
                    <td key={subjectId} className="px-1 py-2 whitespace-nowrap text-sm print:text-2xs print:px-1 print:py-1">
                      {subj
                        ? `${subj.marksObtained}/${subj.outOf} (${Number(subj.percentage).toFixed(0)}%)`
                        : <span className="text-gray-400">-</span>
                      }
                    </td>
                  );
                })}
                <td className="px-2 py-2 font-semibold text-sm print:text-2xs print:px-1 print:py-1">{Number(studentResult.totalMarks).toFixed(1)}</td>
                <td className="px-2 py-2 font-semibold text-sm print:text-2xs print:px-1 print:py-1">{Number(studentResult.averagePercentage).toFixed(1)}%</td>
                <td className="px-2 py-2 font-semibold text-sm print:text-2xs print:px-1 print:py-1">{studentResult.grade}</td>
                <td className="px-2 py-2 font-semibold text-sm print:text-2xs print:px-1 print:py-1">{studentResult.points}</td>
                <td className="px-2 py-2 font-semibold text-sm text-gray-500 print:text-2xs print:px-1 print:py-1">{studentResult.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subject Means Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300 print:mt-4 print:p-2 print:break-avoid">
        <h3 className="text-lg font-semibold mb-3 print:text-base print:mb-2 print:text-black">
          Subject Means Summary {allSubjects.length > 0 ? `(${allSubjects.length} subjects)` : '(No subjects found)'}
        </h3>
        {allSubjects.length === 0 && results?.results?.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg print:hidden">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong> Found {results.results.length} students but no subjects. 
              Check if student results have the correct subject data structure.
            </p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 print:divide-black">
            <thead className="bg-gray-100 print:bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Subject</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Students</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Mean Marks</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Mean %</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Grade</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:px-1 print:py-1">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 print:divide-black">
              {allSubjects.map((subjectId, index) => {
                // Calculate subject statistics
                const subjectResults = results.results
                  .map(studentResult => studentResult.results.find(s => s.subject === subjectId))
                  .filter(Boolean);
                
                const studentsCount = subjectResults.length;
                const totalMarks = subjectResults.reduce((sum, result) => sum + result.marksObtained, 0);
                const totalOutOf = subjectResults.reduce((sum, result) => sum + result.outOf, 0);
                const totalPercentage = subjectResults.reduce((sum, result) => sum + result.percentage, 0);
                
                const meanMarks = studentsCount > 0 ? (totalMarks / studentsCount) : 0;
                const meanOutOf = studentsCount > 0 ? (totalOutOf / studentsCount) : 0;
                const meanPercentage = studentsCount > 0 ? (totalPercentage / studentsCount) : 0;
                
                // Use the grading utility to calculate grade and points
                const gradeInfo = studentsCount > 0 ? calculateGradeAndPoints(meanPercentage) : { grade: '--', points: '--' };
                
                return (
                  <tr key={subjectId} className={index % 2 === 0 ? 'bg-gray-50 print:bg-white' : 'bg-white'}>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900 print:text-2xs print:px-1 print:py-1">
                      {subjectNames[subjectId] || subjectId}
                    </td>
                    <td className="px-3 py-2 text-sm text-center text-gray-600 print:text-2xs print:px-1 print:py-1">
                      {studentsCount}
                    </td>
                    <td className="px-3 py-2 text-sm text-center font-semibold text-gray-900 print:text-2xs print:px-1 print:py-1">
                      {studentsCount > 0 ? `${meanMarks.toFixed(1)}/${meanOutOf.toFixed(0)}` : '--'}
                    </td>
                    <td className="px-3 py-2 text-sm text-center font-semibold text-gray-900 print:text-2xs print:px-1 print:py-1">
                      {studentsCount > 0 ? `${meanPercentage.toFixed(1)}%` : '--'}
                    </td>
                    <td className="px-3 py-2 text-sm text-center font-semibold text-blue-600 print:text-2xs print:px-1 print:py-1 print:text-black">
                      {gradeInfo.grade}
                    </td>
                    <td className="px-3 py-2 text-sm text-center font-semibold text-gray-900 print:text-2xs print:px-1 print:py-1">
                      {typeof gradeInfo.points === 'number' ? gradeInfo.points.toFixed(1) : gradeInfo.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Overall Class Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 print:bg-white print:border-gray-300">
          <h4 className="text-sm font-semibold text-blue-800 mb-2 print:text-black">
            Class Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 print:text-black">Total Students:</span>
              <span className="font-semibold ml-2 print:text-black">{results.results.length}</span>
            </div>
            <div>
              <span className="text-gray-600 print:text-black">Class Average:</span>
              <span className="font-semibold ml-2 print:text-black">
                {results.results.length > 0 ? 
                  (results.results.reduce((sum, student) => sum + student.averagePercentage, 0) / results.results.length).toFixed(1) + '%' : 
                  '--'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600 print:text-black">Subjects Offered:</span>
              <span className="font-semibold ml-2 print:text-black">{allSubjects.length}</span>
            </div>
            <div>
              <span className="text-gray-600 print:text-black">Exam Type:</span>
              <span className="font-semibold ml-2 print:text-black">{results.examType}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Report Footer */}
    <div className="border-t border-gray-300 pt-3 text-center mt-6 print:pt-2 print:mt-4 print:break-avoid">
      <div className="grid grid-cols-3 gap-3 text-xs print:text-2xs">
        <div>
          <p className="font-semibold mb-1">Class Teacher</p>
          <div className="border-b border-gray-400 h-5"></div>
          <p className="mt-1">Date: ___________</p>
        </div>
        <div>
          <p className="font-semibold mb-1">Generated On</p>
          <p>{formatDate(new Date())}</p>
        </div>
        <div>
          <p className="font-semibold mb-1">School Stamp</p>
          <div className="border border-gray-400 h-10 rounded bg-gray-50"></div>
        </div>
      </div>
      <div className="mt-3 pt-1 border-t border-gray-200 text-2xs">
        <p className="mt-1 text-gray-500">
          This exam results sheet is computer generated and valid without signature
        </p>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default ClassExamResultsPage;