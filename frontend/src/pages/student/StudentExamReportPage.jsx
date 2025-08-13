import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaBookOpen, FaSpinner } from 'react-icons/fa';
import { getStudentResults } from '../../api/results';
import { getTerms } from '../../api/terms';
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

  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(params.termId || '');
  const [selectedExamType, setSelectedExamType] = useState(params.examType || 'Opener');
  const [results, setResults] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch terms on mount
  useEffect(() => {
    async function loadTerms() {
      try {
        const data = await getTerms();
        setTerms(data.terms || []);
        if (!params.termId && data.terms && data.terms.length > 0) {
          setSelectedTerm(data.terms[0]._id);
        }
      } catch (err) {
        setError('Failed to load terms.');
        console.error('Error loading terms:', err);
      }
    }
    loadTerms();
  }, [params.termId]);

  // Fetch results when selectedTerm, selectedExamType, or user changes
  useEffect(() => {
    if (!user || !user._id || !selectedTerm || !selectedExamType) {
      setResults([]);
      setStudentInfo(null);
      setLoading(false);
      return;
    }

    async function loadResults() {
      setLoading(true);
      setError(null);
      try {
        const response = await getStudentResults(selectedTerm, selectedExamType);
        setResults(Array.isArray(response.results) ? response.results : []);
        setStudentInfo(response.student || null);
      } catch (err) {
        console.error('Failed to load exam report:', err);
        setError(err.message || 'Failed to load exam report.');
        setResults([]);
        setStudentInfo(null);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [selectedTerm, selectedExamType, user]);

  // Update URL when selection changes
  useEffect(() => {
    if (selectedTerm && selectedExamType &&
        (selectedTerm !== params.termId || selectedExamType !== params.examType)) {
      navigate(`/student/results/${selectedTerm}/${selectedExamType}`, { replace: true });
    }
  }, [selectedTerm, selectedExamType, navigate, params.termId, params.examType]);

  // Statistics
  const stats = useMemo(() => {
    if (!results.length) return { totalResults: 0, avgPercentage: 0, gradeDistribution: {} };

    const totalResults = results.length;
    const avgPercentage = results.reduce((sum, result) => sum + (result.percentage || 0), 0) / totalResults;

    const gradeDistribution = results.reduce((acc, result) => {
      const grade = result.grade || 'N/A';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    return {
      totalResults,
      avgPercentage: Number(avgPercentage).toFixed(2),
      gradeDistribution
    };
  }, [results]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-blue-600 text-4xl mr-3" />
        <p className="text-xl text-gray-700">Loading your report...</p>
      </div>
    );
  }

  if (error) {
    return (
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
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <FaBookOpen className="text-blue-600"/> {selectedExamType} Exam Report
      </h2>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">Total Results</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.totalResults}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-1">Average Percentage</h3>
          <p className="text-2xl font-bold text-green-900">{stats.avgPercentage}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-800 mb-1">Grade Distribution</h3>
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
              <span key={grade} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                {grade}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
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
          className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          value={selectedExamType}
          onChange={e => setSelectedExamType(e.target.value)}
        >
          {EXAM_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Student Info */}
      {studentInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg shadow-sm text-gray-800">
          <p className="text-lg font-semibold">Student Information:</p>
          <p><strong>Name:</strong> {studentInfo.firstName} {studentInfo.lastName}</p>
          <p><strong>Adm No:</strong> {studentInfo.admissionNumber}</p>
          <p><strong>Class:</strong> {studentInfo.currentClass?.name || 'N/A'}</p>
          <p><strong>Stream:</strong> {studentInfo.stream || 'N/A'}</p>
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percent(%)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.length > 0 ? (
              results.map((result, index) => (
                <tr key={result._id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">{result.subject?.name || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{result.marksObtained}/{result.outOf}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-medium ${
                      result.percentage >= 75 ? 'text-green-600' :
                      result.percentage >= 60 ? 'text-blue-600' :
                      result.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Number(result.percentage).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ['A', 'A+'].includes(result.grade) ? 'bg-green-100 text-green-800' :
                      ['B', 'B+'].includes(result.grade) ? 'bg-blue-100 text-blue-800' :
                      ['C', 'C+'].includes(result.grade) ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {result.points}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {result.comment}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">No results available for this selection.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
