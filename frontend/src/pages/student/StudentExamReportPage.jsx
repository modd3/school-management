import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaBookOpen, FaSpinner, FaPrint, FaFilePdf } from 'react-icons/fa';
import { getStudentResults, getStudentExamPosition } from '../../api/results';
import { getPublicTerms } from '../../api/terms';
import { useAuth } from '../../context/AuthContext';

const EXAM_TYPES = [
  { value: 'Opener', label: 'Opener' },
  { value: 'Midterm', label: 'Midterm' },
  { value: 'Endterm', label: 'Endterm' },
];

export default function StudentExamReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const reportRef = useRef();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(params.termId || '');
  const [selectedExamType, setSelectedExamType] = useState(params.examType || 'Opener');
  const [results, setResults] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentClass, setStudentClass] = useState(null);
  const [academicYear, setAcademicYear] = useState('');
  const [classPosition, setClassPosition] = useState({ position: null, outOf: null });

  // Inject print styles
  useEffect(() => {
    const styleId = 'report-print-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media print {
          @page { size: A4; margin: 0.2in; }
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
          table { border-collapse: collapse !important; width: 100% !important; font-size: 8pt !important; }
          thead, tr { page-break-inside: avoid !important; }
          th, td { border: 0.5pt solid #000 !important; padding: 1px !important; text-align: left !important; }
          th { background-color: #f0f0f0 !important; font-weight: bold !important; }
          .print-container { height: auto !important; min-height: auto !important; max-height: none !important; }
          .print\\:compact { margin: 0.1rem 0 !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          .print\\:student-info-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
            margin-bottom: 0.5rem !important;
          }
          .print\\:student-info-col {
            font-size: 8pt !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:footer-fixed {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            page-break-inside: avoid !important;
          }
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

  // Fetch terms
  useEffect(() => {
    async function loadTerms() {
      try {
        const data = await getPublicTerms();
        setTerms(data.terms || []);
        if (!params.termId && data.terms?.length) {
          setSelectedTerm(data.terms[0]._id);
        }
      } catch (err) {
        setError('Failed to load terms.');
      }
    }
    loadTerms();
  }, [params.termId]);

  // Fetch student class info when selectedTerm changes
  useEffect(() => {
    async function fetchStudentClass() {
      if (!user || !selectedTerm) return;
      try {
        const term = terms.find(t => t._id === selectedTerm);
        if (!term) return;
        setAcademicYear(term.academicYear);

        // Call your backend API to get student class info
        const res = await fetch(
          `${API_BASE_URL}/student-class/by-year?studentId=${user.profileId}&academicYear=${term.academicYear}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (!res.ok) {
          setStudentClass(null);
          return;
        }
        const data = await res.json();
        setStudentClass(data.studentClass || null);
      } catch (err) {
        console.error('Error fetching student class:', err);
        setStudentClass(null);
      }
    }
    fetchStudentClass();
  }, [user, selectedTerm, terms, API_BASE_URL]);

  // Fetch student position via shared API helper
  useEffect(() => {
    async function fetchStudentPosition() {
      if (!studentClass?.class?._id || !selectedTerm || !user || !selectedExamType) return;
      try {
        const data = await getStudentExamPosition(studentClass.class._id, selectedTerm, selectedExamType);
        setClassPosition({ position: data.position, outOf: data.outOf });
      } catch (err) {
        setClassPosition({ position: null, outOf: null });
      }
    }
    fetchStudentPosition();
  }, [studentClass, selectedTerm, selectedExamType, user]);

  // Fetch results
  useEffect(() => {
    if (!user || !selectedTerm || !selectedExamType) return;
    async function loadResults() {
      setLoading(true);
      try {
        const response = await getStudentResults(selectedTerm, selectedExamType);
        setResults(Array.isArray(response.results) ? response.results : []);
        setStudentInfo(response.student || null);
      } catch (err) {
        setError(err.message || 'Failed to load exam report.');
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [selectedTerm, selectedExamType, user]);

  // Update URL
  useEffect(() => {
    if (selectedTerm && selectedExamType &&
        (selectedTerm !== params.termId || selectedExamType !== params.examType)) {
      navigate(`/student/results/${selectedTerm}/${selectedExamType}`, { replace: true });
    }
  }, [selectedTerm, selectedExamType, navigate, params.termId, params.examType]);

  // Stats
  const stats = useMemo(() => {
    if (!results.length) return { totalResults: 0, avgPercentage: 0, gradeDistribution: {} };
    const totalResults = results.length;
    const avgPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalResults;
    const gradeDistribution = results.reduce((acc, r) => {
      acc[r.grade || 'N/A'] = (acc[r.grade || 'N/A'] || 0) + 1;
      return acc;
    }, {});
    return { totalResults, avgPercentage: avgPercentage.toFixed(2), gradeDistribution };
  }, [results]);

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

  // Use studentClass for class and stream info
  const className = studentClass?.class?.name || studentInfo?.currentClass?.name || 'N/A';
  const stream = studentClass?.class?.stream?.[0] || studentInfo?.stream || studentInfo?.currentClass?.stream || 'N/A';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <FaSpinner className="animate-spin text-blue-600 text-4xl mr-3" />
      <p className="text-xl text-gray-700">Loading your exam report...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <div className="text-red-600 text-xl mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg mt-4 print:shadow-none print:mt-0 print:max-w-full print:p-2 print-container">
      {/* Print/Export Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 gap-2 print:hidden border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaBookOpen /> {selectedExamType} Exam Report
        </h2>
        <div className="flex gap-2">
          <select
            className="border px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={selectedTerm}
            onChange={e => setSelectedTerm(e.target.value)}
          >
            <option value="">Select Term</option>
            {terms.map(term => (
              <option key={term._id} value={term._id}>
                {term.name}
              </option>
            ))}
          </select>
          <select
            className="border px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={selectedExamType}
            onChange={e => setSelectedExamType(e.target.value)}
          >
            {EXAM_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
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
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="p-4 print:p-2">
        {/* School Header */}
        <div className="text-center mb-4 print:mb-2 print:break-avoid">
          <h1 className="text-2xl font-bold text-blue-900 mb-1 print:text-3xl print:text-black">
            Blue Sky Mixed Secondary School
          </h1>
          <div className="text-xs text-gray-600 space-y-0 print:text-2xs print:text-black print:compact">
            <p>P.O BOX 537 - 01100 KAJIADO, KENYA</p>
            <p>Tel: +2547 07922901 | Email: bluesksecschool@gmail.com</p>
          </div>
          <div className="mt-2 mb-2 print:compact">
            <h2 className="text-lg font-semibold text-gray-800 print:text-xl print:text-black">
              {selectedExamType.toUpperCase()} EXAM REPORT
            </h2>
          </div>
        </div>

        {/* Student Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 print:student-info-grid print:break-avoid">
          <div className="space-y-1 text-sm print:student-info-col print:compact">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Name:</span>
              <span>{studentInfo?.firstName} {studentInfo?.lastName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Admission No:</span>
              <span>{studentInfo?.admissionNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Class:</span>
              <span>{className}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Stream:</span>
              <span>{stream}</span>
            </div>
          </div>
          <div className="space-y-1 text-sm print:student-info-col print:compact">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Term:</span>
              <span>{terms.find(t => t._id === selectedTerm)?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Academic Year:</span>
              <span>{academicYear || terms.find(t => t._id === selectedTerm)?.academicYear || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Class Position:</span>
              <span>
                {classPosition.position ? `${classPosition.position} out of ${classPosition.outOf}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Average:</span>
              <span className="font-bold text-blue-600 print:text-black">{stats.avgPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="mb-3 print:mb-2 print:break-avoid">
          <h3 className="text-md font-semibold text-gray-800 mb-2 print:text-xs print:text-black print:compact">Exam Results</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-400 text-xs print:text-2xs">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-50">
                  <th className="border border-gray-400 px-2 py-1 text-left font-semibold">Subject</th>
                  <th className="border border-gray-400 px-2 py-1 text-center font-semibold">Marks</th>
                  <th className="border border-gray-400 px-2 py-1 text-center font-semibold">Percentage</th>
                  <th className="border border-gray-400 px-2 py-1 text-center font-semibold">Grade</th>
                  <th className="border border-gray-400 px-2 py-1 text-center font-semibold">Points</th>
                  <th className="border border-gray-400 px-2 py-1 text-left font-semibold">Comment</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 print:bg-white' : 'bg-white'}>
                    <td className="border border-gray-400 px-2 py-1 font-medium">
                      {result.subject?.name || 'N/A'}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      {result.marksObtained}/{result.outOf}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center font-semibold">
                      {Number(result.percentage).toFixed(2)}%
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center font-semibold">
                      {result.grade}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center font-semibold">
                      {result.points}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-left">
                      {result.comment || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Footer */}
        <div className="border-t border-gray-300 pt-3 text-center mt-auto print:pt-2 print:break-avoid">
          <div className="grid grid-cols-3 gap-3 text-xs print:text-2xs">
            <div>
              <p className="font-semibold mb-1">Parent/Guardian</p>
              <div className="border-b border-gray-400 h-5"></div>
              <p className="mt-1">Date: ___________</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Generated On</p>
              <p>{new Date().toLocaleDateString('en-GB')}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">School Stamp</p>
              <div className="border border-gray-400 h-10 rounded bg-gray-50"></div>
            </div>
          </div>
          <div className="mt-3 pt-1 border-t border-gray-200 text-2xs">
            <p className="mt-1 text-gray-500 ">
              This exam report is computer generated and valid without signature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}