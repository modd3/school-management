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
          @page { size: A4 landscape; margin: 0.3in; }
          body { font-family: 'Times New Roman', serif !important; color: #000 !important; background: white !important; font-size: 8pt !important; line-height: 1.0 !important; margin: 0 !important; padding: 0 !important; }
          .print\\:hidden { display: none !important; }
          .print\\:max-w-full { max-width: 100% !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:mt-0 { margin-top: 0 !important; }
          .print\\:p-1 { padding: 0.2rem !important; }
          .print\\:mb-1 { margin-bottom: 0.2rem !important; }
          .print\\:text-lg { font-size: 10pt !important; font-weight: bold !important; }
          .print\\:text-sm { font-size: 8pt !important; font-weight: normal !important; }
          .print\\:text-xs { font-size: 7pt !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:text-black { color: #000000 !important; }
          .print\\:text-center { text-align: center !important; }
          .print\\:font-bold { font-weight: bold !important; }
          table { border-collapse: collapse !important; width: 100% !important; font-size: 6pt !important; margin: 0 !important; }
          th, td { border: 0.5pt solid #000 !important; padding: 1px 2px !important; text-align: center !important; vertical-align: middle !important; }
          th { background-color: #ffffff !important; font-weight: bold !important; font-size: 6pt !important; }
          .subject-header { writing-mode: vertical-lr !important; transform: rotate(180deg) !important; height: 40px !important; width: 25px !important; font-size: 5pt !important; }
          .student-name { text-align: left !important; font-size: 6pt !important; white-space: nowrap !important; }
          .summary-row { background-color: #f0f0f0 !important; font-weight: bold !important; }
          .print-container { height: auto !important; min-height: auto !important; max-height: none !important; margin: 0 !important; padding: 0 !important; }
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
    <div className="text-center mb-3 print:mb-1 print:break-avoid hidden print:block">
      <h1 className="text-lg font-bold text-black print:text-lg print:font-bold print:mb-0">
        BLUESKY MIXED SECONDARY SCHOOL
      </h1>
      <p className="text-xs print:text-xs print:mb-0">{selectedExamType.toUpperCase()} EXAMINATION</p>
      <p className="text-xs print:text-xs print:mb-1">{results.term}, {new Date().getFullYear()}</p>
      <p className="text-xs font-bold print:text-xs print:font-bold">CLASS MARKLIST {results.class?.toUpperCase()}</p>
    </div>

    <div className="bg-white rounded-lg shadow-md p-2 print:shadow-none print:p-1">
      <h2 className="text-lg font-semibold mb-2 print:hidden">
        {results.class} - {results.term} - {results.examType} Results
      </h2>
      
      <div className="overflow-x-auto print:overflow-visible">
        <table className="min-w-full border-collapse border border-black print:min-w-full">
          <thead>
            <tr>
              <th rowSpan="2" className="border border-black p-1 text-xs font-bold text-left print:text-left print:border-black print:p-1 student-name">NAMES</th>
              <th rowSpan="2" className="border border-black p-1 text-xs font-bold text-center print:text-center print:border-black print:p-1">ADM</th>
              {allSubjects.map(subjectId => {
                const shortName = subjectNames[subjectId]?.toUpperCase() || subjectId?.toUpperCase();
                // Create abbreviated names for better fit
                let abbrev = shortName;
                if (shortName === 'MATHEMATICS') abbrev = 'MATH';
                else if (shortName === 'ENGLISH') abbrev = 'ENG';
                else if (shortName === 'KISWAHILI') abbrev = 'KISW';
                else if (shortName === 'CHEMISTRY') abbrev = 'CHEM';
                else if (shortName === 'BIOLOGY') abbrev = 'BIO';
                else if (shortName === 'PHYSICS') abbrev = 'PHYC';
                else if (shortName === 'ISLAMIC RELIGIOUS EDUCATION') abbrev = 'IRE';
                else if (shortName === 'CHRISTIAN RELIGIOUS EDUCATION') abbrev = 'CRE';
                else if (shortName === 'GEOGRAPHY') abbrev = 'GEO';
                else if (shortName === 'HISTORY') abbrev = 'HIST';
                else if (shortName === 'AGRICULTURE') abbrev = 'AGRIC';
                else if (shortName === 'BUSINESS STUDIES') abbrev = 'BST';
                else if (shortName.length > 6) abbrev = shortName.substring(0, 6);
                
                return (
                  <th key={subjectId} rowSpan="2" className="border border-black p-1 text-xs font-bold text-center print:text-center print:border-black print:p-1">
                    {abbrev}
                  </th>
                );
              })}
              <th rowSpan="2" className="border border-black p-1 text-xs font-bold text-center print:text-center print:border-black print:p-1">TOTAL MARKS</th>
              <th rowSpan="2" className="border border-black p-1 text-xs font-bold text-center print:text-center print:border-black print:p-1">AVERAGE</th>
              <th rowSpan="2" className="border border-black p-1 text-xs font-bold text-center print:text-center print:border-black print:p-1">GRADE</th>
              <th rowSpan="2" className="border border-black p-1 text-xs font-bold text-center print:text-center print:border-black print:p-1">POSITION</th>
            </tr>
          </thead>
          <tbody>
            {results.results.map((studentResult, index) => (
              <tr key={studentResult.student._id}>
                <td className="border border-black p-1 text-xs font-medium student-name print:border-black print:text-left print:student-name">
                  {(studentResult.student.firstName + ' ' + studentResult.student.lastName).toUpperCase()}
                </td>
                <td className="border border-black p-1 text-xs text-center print:border-black">
                  {studentResult.student.admissionNumber || '116'}
                </td>
                {allSubjects.map(subjectId => {
                  const subj = studentResult.results.find(s => s.subject === subjectId);
                  return (
                    <td key={subjectId} className="border border-black p-1 text-xs text-center print:border-black">
                      {subj ? subj.marksObtained : '0'}
                    </td>
                  );
                })}
                <td className="border border-black p-1 text-xs font-bold text-center print:border-black">
                  {Math.round(Number(studentResult.totalMarks))}
                </td>
                <td className="border border-black p-1 text-xs font-bold text-center print:border-black">
                  {Number(studentResult.averagePercentage).toFixed(1)}
                </td>
                <td className="border border-black p-1 text-xs font-bold text-center print:border-black">
                  {studentResult.grade}
                </td>
                <td className="border border-black p-1 text-xs font-bold text-center print:border-black">
                  {studentResult.position}
                </td>
              </tr>
            ))}
            
            {/* Subject Total Row */}
            <tr className="summary-row print:summary-row">
              <td className="border border-black p-1 text-xs font-bold text-left print:border-black">SUBJECT TOTAL</td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
              {allSubjects.map(subjectId => {
                const subjectResults = results.results
                  .map(studentResult => studentResult.results.find(s => s.subject === subjectId))
                  .filter(Boolean);
                const total = subjectResults.reduce((sum, result) => sum + result.marksObtained, 0);
                return (
                  <td key={`total-${subjectId}`} className="border border-black p-1 text-xs font-bold text-center print:border-black">
                    {total}
                  </td>
                );
              })}
              <td className="border border-black p-1 text-xs print:border-black"></td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
            </tr>
            
            {/* Subject Mean Row */}
            <tr className="summary-row print:summary-row">
              <td className="border border-black p-1 text-xs font-bold text-left print:border-black">SUBJECT MEAN</td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
              {allSubjects.map(subjectId => {
                const subjectResults = results.results
                  .map(studentResult => studentResult.results.find(s => s.subject === subjectId))
                  .filter(Boolean);
                const studentsCount = subjectResults.length;
                const totalPercentage = subjectResults.reduce((sum, result) => sum + result.percentage, 0);
                const meanPercentage = studentsCount > 0 ? (totalPercentage / studentsCount) : 0;
                return (
                  <td key={`mean-${subjectId}`} className="border border-black p-1 text-xs font-bold text-center print:border-black">
                    {meanPercentage > 0 ? meanPercentage.toFixed(1) : '0'}
                  </td>
                );
              })}
              <td className="border border-black p-1 text-xs print:border-black"></td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
            </tr>
            
            {/* Subject Position Row */}
            <tr className="summary-row print:summary-row">
              <td className="border border-black p-1 text-xs font-bold text-left print:border-black">SUBJECT POSITION</td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
              {allSubjects.map((subjectId, index) => (
                <td key={`pos-${subjectId}`} className="border border-black p-1 text-xs font-bold text-center print:border-black">
                  {index + 1}
                </td>
              ))}
              <td className="border border-black p-1 text-xs print:border-black"></td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
              <td className="border border-black p-1 text-xs print:border-black"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Minimized analytics for screen view only */}
      <div className="mt-2 print:hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded">
          <div>
            <span className="text-gray-600">Students:</span>
            <span className="font-semibold ml-2">{results.results.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Class Avg:</span>
            <span className="font-semibold ml-2">
              {results.results.length > 0 ? 
                (results.results.reduce((sum, student) => sum + student.averagePercentage, 0) / results.results.length).toFixed(1) + '%' : 
                '--'
              }
            </span>
          </div>
          <div>
            <span className="text-gray-600">Subjects:</span>
            <span className="font-semibold ml-2">{allSubjects.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Exam:</span>
            <span className="font-semibold ml-2">{results.examType}</span>
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