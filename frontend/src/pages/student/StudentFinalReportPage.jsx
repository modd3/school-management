import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaBookOpen, FaSpinner, FaPrint, FaFilePdf, FaCalendarAlt } from 'react-icons/fa';
import { getTerms } from '../../api/terms';
import { useAuth } from '../../context/AuthContext';
import { getClassFinalReports } from '../../api/results';

export default function StudentFinalReportPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const reportRef = useRef();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  // KCSE Grading Scale
  const kcseGradingScale = [
    { range: [0, 29.99], grade: 'E', points: 1 },
    { range: [30, 34.99], grade: 'D-', points: 2 },
    { range: [35, 39.99], grade: 'D', points: 3 },
    { range: [40, 44.99], grade: 'D+', points: 4 },
    { range: [45, 49.99], grade: 'C-', points: 5 },
    { range: [50, 54.99], grade: 'C', points: 6 },
    { range: [55, 59.99], grade: 'C+', points: 7 },
    { range: [60, 64.99], grade: 'B-', points: 8 },
    { range: [65, 69.99], grade: 'B', points: 9 },
    { range: [70, 74.99], grade: 'B+', points: 10 },
    { range: [75, 79.99], grade: 'A-', points: 11 },
    { range: [80, 100], grade: 'A', points: 12 }
  ];

  const getGradeFromPoints = (points) => {
    const match = kcseGradingScale.find(entry => entry.points === Math.round(points));
    return match ? match.grade : 'E';
  };

  // Print styles for compact layout
  React.useEffect(() => {
    const styleId = 'report-print-styles';
    let existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
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

  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(params.termId || '');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
   const [studentClass, setStudentClass] = useState(null);
  const [academicYear, setAcademicYear] = useState('');
  const [classPosition, setClassPosition] = useState({ position: null, outOf: null });

  // Fetch terms on mount
  useEffect(() => {
    async function loadTerms() {
      try {
        const data = await getTerms();
        setTerms(data.terms || []);
        if (!params.termId && data.terms && data.terms.length > 0) {
          setSelectedTerm(data.terms[0]._id);
          setAcademicYear(data.terms[0].academicYear);
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

  // Fetch final report when selectedTerm or user changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!selectedTerm || !user || !token) {
      setReport(null);
      setLoading(false);
      return;
    }
    async function fetchFinalReport() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/student/final-report/${selectedTerm}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to fetch final report (${res.status})`
          );
        }
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
        setReport(null);
      } finally {
        setLoading(false);
      }
    }
    fetchFinalReport();
  }, [selectedTerm, user]);

  // New effect to fetch student position directly
  useEffect(() => {
    async function fetchStudentPosition() {
      if (!studentClass?.class?._id || !selectedTerm || !user) return;
      try {
        const res = await fetch(
          `${API_BASE_URL}/student/class-position/${studentClass.class._id}/${selectedTerm}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (!res.ok) {
          setClassPosition({ position: null, outOf: null });
          return;
        }
        const data = await res.json();
        setClassPosition({ position: data.position, outOf: data.outOf });
      } catch (err) {
        setClassPosition({ position: null, outOf: null });
      }
    }
    fetchStudentPosition();
  }, [studentClass, selectedTerm, user, API_BASE_URL]);

  useEffect(() => {
    if (selectedTerm && selectedTerm !== params.termId) {
      navigate(`/student/final-report/${selectedTerm}`, { replace: true });
    }
  }, [selectedTerm, navigate, params.termId]);

  const {
    finalResults = [],
    student = {},
    classTeacherRemarks,
    principalRemarks,
    classTeacher,
    principal,
    closingDate,
    openingDate,
    term: termInfo
  } = report || {};

  // Use studentClassInfo for class, stream, academicYear
  const className = studentClass?.class?.name || student.class || student.currentClass?.name || 'N/A';
  const stream = studentClass?.class?.stream?.[0] || student.stream || student.currentClass?.stream || 'N/A';


  const calculateStatistics = () => {
    if (!finalResults.length) return { totalPoints: 0, meanGradePoint: 0, overallGrade: '-' };
    const totalPts = finalResults.reduce((sum, res) => sum + (res.points || 0), 0);
    const meanGP = totalPts / finalResults.length;
    const overallGrade = getGradeFromPoints(meanGP);
    return {
      totalPoints: totalPts,
      meanGradePoint: meanGP.toFixed(2),
      overallGrade: overallGrade
    };
  };
  const stats = calculateStatistics();

  const handlePrint = () => window.print();
  const handleExportPDF = () => window.print();

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

  function autoTeacherRemark(grade) {
    if (!grade) return 'No remarks available.';
    if (['A', 'A-', 'B+'].includes(grade)) return 'Excellent performance. Keep it up!';
    if (['B', 'B-'].includes(grade)) return 'Good work. Aim higher next term!';
    if (['C+', 'C', 'C-'].includes(grade)) return 'Fair effort. You can do better!';
    if (['D+', 'D', 'D-'].includes(grade)) return 'Needs improvement. Work harder!';
    return 'Seek help and put in more effort.';
  }
  function autoPrincipalRemark(grade) {
    if (!grade) return 'No remarks available.';
    if (['A', 'A-', 'B+'].includes(grade)) return 'Congratulations on your outstanding achievement!';
    if (['B', 'B-'].includes(grade)) return 'Well done. Strive for excellence!';
    if (['C+', 'C', 'C-'].includes(grade)) return 'Satisfactory. Aim for higher grades!';
    if (['D+', 'D', 'D-'].includes(grade)) return 'You need to improve your performance.';
    return 'Parental guidance is advised.';
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <FaSpinner className="animate-spin text-blue-600 text-4xl mr-3" />
      <p className="text-xl text-gray-700">Loading your final report...</p>
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
  if (finalResults.length === 0) return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <FaBookOpen /> Final Report Card
      </h2>
      <div className="mb-6">
        <select
          className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>
      <div className="text-center mt-8 text-gray-600">
        No final results available for this term.
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg mt-4 print:shadow-none print:mt-0 print:max-w-full print:p-2 print-container">
      {/* Print/Export Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 gap-2 print:hidden border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaBookOpen /> Student Report Card
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

      {/* Report Card Content */}
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
              STUDENT REPORT CARD
            </h2>
          </div>
        </div>

        {/* Student Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 print:mb-2 print:text-xs print:break-avoid">
          <div className="space-y-1 text-sm print:text-xs print:compact">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Name:</span>
              <span>{student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Admission No:</span>
              <span>{student.admissionNumber || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Class:</span>
              <span>{className || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Stream:</span>
              <span>{stream || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-1 text-sm print:text-xs print:compact">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Term:</span>
              <span>
                {
                  termInfo?.name ||
                  (terms.find(t => t._id === selectedTerm)?.name) ||
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Academic Year:</span>
              <span>
                {
                  academicYear ||
                  (terms.find(t => t._id === selectedTerm)?.academicYear) ||
                  'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Class Position:</span>
              <span>
                {classPosition.position ? `${classPosition.position} / ${classPosition.outOf}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold">Overall Grade:</span>
              <span className="font-bold text-blue-600 print:text-black">{stats.overallGrade}</span>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="mb-3 print:mb-2 print:compact-table print:break-avoid">
          <h3 className="text-md font-semibold text-gray-800 mb-2 print:text-xs print:text-black print:compact">Academic Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-400 text-xs print:text-2xs">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-50">
                  <th className="border border-gray-400 px-1 py-0.5 text-left font-semibold">Subject</th>
                  <th className="border border-gray-400 px-1 py-0.5 text-center font-semibold">Opener</th>
                  <th className="border border-gray-400 px-1 py-0.5 text-center font-semibold">Midterm</th>
                  <th className="border border-gray-400 px-1 py-0.5 text-center font-semibold">Endterm</th>
                  <th className="border border-gray-400 px-1 py-0.5 text-center font-semibold">Final</th>
                  <th className="border border-gray-400 px-1 py-0.5 text-center font-semibold">Grade</th>
                  <th className="border border-gray-400 px-1 py-0.5 text-center font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {finalResults.map((res, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 print:bg-white' : 'bg-white'}>
                    <td className="border border-gray-400 px-1 py-0.5 font-medium">
                      {res.subject?.name || res.subjectName || '-'}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">
                      {res.breakdown?.opener !== undefined ? Number(res.breakdown.opener).toFixed(0) : '-'}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">
                      {res.breakdown?.midterm !== undefined ? Number(res.breakdown.midterm).toFixed(0) : '-'}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center">
                      {res.breakdown?.endterm !== undefined ? Number(res.breakdown.endterm).toFixed(0) : '-'}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center font-semibold">
                      {res.finalPercentage !== undefined ? Number(res.finalPercentage).toFixed(0) : '-'}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center font-semibold">
                      {res.grade || '-'}
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 text-center font-semibold">
                      {res.points !== undefined ? res.points : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-2 mb-4 print:mb-2 print:text-xs print:compact">
          <div className="text-center">
            <p className="font-bold">Total Points</p>
            <p className="text-lg print:text-base">{stats.totalPoints}</p>
          </div>
          <div className="text-center">
            <p className="font-bold">Mean Points</p>
            <p className="text-lg print:text-base">{stats.meanGradePoint}</p>
          </div>
          <div className="text-center">
            <p className="font-bold">Overall Grade</p>
            <p className="text-lg print:text-base">{stats.overallGrade}</p>
          </div>
        </div>

        {/* Comments and Remarks */}
        <div className="mb-4 print:mb-2 print:break-avoid">
          {/* Teacher Remarks */}
          <div className="mb-3 print:mb-2">
            <h4 className="text-sm font-semibold border-b pb-1 mb-1 print:text-xs">Class Teacher's Remarks:</h4>
            <p className="text-xs print:text-2xs">
              {classTeacherRemarks || autoTeacherRemark(stats.overallGrade)}
            </p>
            <div className="mt-1 text-right">
              <span className="text-xs text-gray-500 print:text-black">
                {classTeacher?.name || classTeacher || '-'}
              </span>
            </div>
          </div>

          {/* Principal Remarks */}
          <div className="mb-3 print:mb-2">
            <h4 className="text-sm font-semibold border-b pb-1 mb-1 print:text-xs">Principal's Remarks:</h4>
            <p className="text-xs print:text-2xs">
              {principalRemarks || autoPrincipalRemark(stats.overallGrade)}
            </p>
            <div className="mt-1 text-right">
              <span className="text-xs text-gray-500 print:text-black">
                {principal?.name || principal || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Important Dates */}
        <div className="flex justify-between text-xs mb-3 print:mb-1 print:text-2xs">
          <div>
            <span className="font-semibold">Closing: </span>
            {formatDate(closingDate) || 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Opening: </span>
            {formatDate(openingDate) || 'N/A'}
          </div>
        </div>

        {/* Report Footer */}
        <div className="border-t border-gray-300 pt-3 text-center print:pt-2 print:break-avoid">
          <div className="grid grid-cols-3 gap-3 text-xs print:text-2xs print:gap-1">
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
          <div className="mt-3 pt-1 border-t border-gray-200 text-2xs print:text-2xs">
            <footer>
            <p className="mt-1 text-gray-500">
              This report card is computer generated and valid without signature
            </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}