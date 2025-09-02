import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getClassFinalReports } from '../../api/results';
import { getTerms, getTeacherTerms } from '../../api/terms';
import { getClasses, getTeacherClasses } from '../../api/classes';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/Spinner';
import { useAuth } from '@/hooks';
import { getMyClassAsClassTeacher } from '../../api/classes';
import { FaBookOpen, FaPrint, FaFilePdf } from 'react-icons/fa';

const ClassFinalReportsPage = () => {
  const { classId, termId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const reportRef = useRef();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedClass, setSelectedClass] = useState(classId || '');
  const [selectedTerm, setSelectedTerm] = useState(termId || '');

  const isAdmin = user?.role === 'admin';
  const basePath = location.pathname.includes('/admin') ? '/admin' : '/teacher';

  useEffect(() => {
    const styleId = 'report-print-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media print {
          @page { size: A4 landscape; margin: 0.2in; }
          body { font-family: 'Times New Roman', serif !important; color: #000 !important; background: white !important; font-size: 9pt !important; line-height: 1.1 !important; }
          .print\\:hidden { display: none !important; }
          table { border-collapse: collapse !important; width: 100% !important; font-size: 6pt !important; }
          th, td { border: 0.5pt solid #000 !important; padding: 1px 0.5px !important; text-align: center !important; }
          th { background-color: #f0f0f0 !important; font-weight: bold !important; }
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
      if (!user) return;
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
        const termsData = isAdmin ? await getTerms() : await getTeacherTerms();
        setTerms(termsData.terms || []);
        if (classId && termId) {
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const allSubjects = reports?.reports
    ? Array.from(new Set(reports.reports.flatMap(report => report.finalResults.map(subject => subject.subject))))
    : [];

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
          <div className="text-red-600 text-5xl mb-4">🛡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view this page.</p>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
    <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-lg mt-4 print:shadow-none print:mt-0 print:max-w-full print:p-2 print-container">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 gap-2 print:hidden border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaBookOpen /> Class Final Reports
        </h1>
        {reports && (
          <div className="flex gap-2">
            <button onClick={handlePrint} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <FaPrint /> Print
            </button>
            <button onClick={handleExportPDF} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
              <FaFilePdf /> PDF
            </button>
          </div>
        )}
      </div>

      <div className="p-4 print:p-2">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 print:shadow-none print:mb-2">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required disabled={user?.teacherType === 'class_teacher'}>
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
                <option value="">Select Term</option>
                {terms.map((term) => (
                  <option key={term._id} value={term._id}>{term.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">View Reports</button>
            </div>
          </form>
          <div className="mt-4 print:hidden">
            <button onClick={handleViewExamResults} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">View Exam Results</button>
          </div>
        </div>

        
{reports && (
  <div ref={reportRef}>
    <div className="text-center mb-4 print:mb-2 print:break-avoid">
      <h1 className="text-2xl font-bold text-blue-900 mb-1 print:text-3xl print:text-black">Blue Sky Mixed Secondary School</h1>
      <div className="text-xs text-gray-600 space-y-0 print:text-2xs print:text-black print:compact">
        <p>P.O BOX 537 - 01100 KAJIADO, KENYA</p>
        <p>Tel: +2547 07922901 | Email: bluesksecschool@gmail.com</p>
      </div>
      <div className="mt-1 mb-1 print:compact">
        <h2 className="text-lg font-semibold text-gray-800 print:text-xl print:text-black">CLASS FINAL REPORTS</h2>
        <p className="text-sm print:text-xs print:text-black">{reports.class} - {reports.term}</p>
      </div>
    </div>

    <div className="overflow-x-auto mb-4 print:mb-2">
      <table className="min-w-full border-collapse border border-gray-400 text-xs print:text-2xs">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-50">
            <th className="border border-gray-400">Pos</th>
            <th className="border border-gray-400">Student</th>
            <th className="border border-gray-400">Adm No</th>
            {allSubjects.map(subjectId => (
              <th key={subjectId} className="border border-gray-400">
                {subjectNames[subjectId] === 'Mathematics' ? 'Maths' : subjectNames[subjectId]?.length > 10 ? subjectNames[subjectId].substring(0, 8) + '.' : subjectNames[subjectId]}
              </th>
            ))}
            <th className="border border-gray-400">Total</th>
            <th className="border border-gray-400">Avg Marks</th>
            <th className="border border-gray-400">Grade</th>
            <th className="border border-gray-400">Points</th>
          </tr>
        </thead>
        <tbody>
          {reports.reports.map((report, index) => (
            <tr key={report.student._id} className={index % 2 === 0 ? 'bg-gray-50 print:bg-white' : 'bg-white'}>
              <td className="border border-gray-400 text-center font-semibold">{report.position}</td>
              <td className="border border-gray-400">{report.student.firstName} {report.student.lastName}</td>
              <td className="border border-gray-400 text-center">{report.student.admissionNumber}</td>
              {allSubjects.map(subjectId => {
                const subj = report.finalResults.find(s => s.subject === subjectId);
                return (
                  <td key={subjectId} className="border border-gray-400 text-center">
                    {subj ? `${Math.round(Number(subj.finalPercentage))} ${subj.grade}` : '--'}
                  </td>
                );
              })}
              <td className="border border-gray-400 text-center font-semibold">{Number(report.totalMarks).toFixed(0)}</td>
              <td className="border border-gray-400 text-center font-semibold">{Number(report.averageMarks).toFixed(1)}</td>
              <td className="border border-gray-400 text-center font-semibold">{report.overallGrade || 'N/A'}</td>
              <td className="border border-gray-400 text-center font-semibold">{report.overallPoints || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="border-t border-gray-300 pt-3 text-center print:pt-2 print:break-avoid">
      <div className="grid grid-cols-3 gap-3 text-xs print:text-2xs print:gap-1">
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
      <div className="mt-3 pt-1 border-t border-gray-200 text-2xs print:text-2xs">
        <p className="mt-1 text-gray-500">This final reports sheet is computer generated and valid without signature</p>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default ClassFinalReportsPage;
