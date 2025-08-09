import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaBookOpen } from 'react-icons/fa';
import { getStudentResults } from '../../api/results'; // Ensure this uses the updated getStudentResults
import { getTerms } from '../../api/terms';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext'; // Assuming you have an AuthContext to get logged-in user

const EXAM_TYPES = [
  { value: 'Opener', label: 'Opener' },
  { value: 'Midterm', label: 'Midterm' },
  { value: 'Endterm', label: 'Endterm' },
];

export default function StudentExamReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams(); // To read initial termId and examType from URL
  const { user } = useAuth(); // Get logged-in user to ensure student context

  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(params.termId || '');
  const [selectedExamType, setSelectedExamType] = useState(params.examType || 'Opener');
  const [results, setResults] = useState([]); // Array of subject results for the selected exam
  const [studentInfo, setStudentInfo] = useState(null); // Full student object
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch terms on mount
  useEffect(() => {
    async function loadTerms() {
      try {
        const data = await getTerms();
        setTerms(data.terms || []);
        // If no term selected from URL and terms are available, default to the first term's ID
        if (!params.termId && data.terms && data.terms.length > 0) {
          setSelectedTerm(data.terms[0]._id);
        }
      } catch (err) {
        setError('Failed to load terms.');
        console.error('Error loading terms:', err);
      }
    }
    loadTerms();
  }, [params.termId]); // Depend on params.termId to avoid re-running if URL changes

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
    // Pass parameters directly instead of as a query string
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
  }, [selectedTerm, selectedExamType, user]); // Depend on user to trigger fetch when auth state is ready

  // Update URL when selection changes (optional, for shareable links)
  useEffect(() => {
    // Only navigate if both are selected and different from current URL params
    if (selectedTerm && selectedExamType &&
        (selectedTerm !== params.termId || selectedExamType !== params.examType)) {
      navigate(`/student/report/${selectedTerm}/${selectedExamType}`, { replace: true });
    }
  }, [selectedTerm, selectedExamType, navigate, params.termId, params.examType]);

  if (loading) return <Spinner text="Loading student report..." />;
  if (error) return <div className="text-red-600 text-center mt-8 text-xl">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <FaBookOpen className="text-blue-600"/> {selectedExamType} Exam Report
      </h2>

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

      {studentInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg shadow-sm text-gray-800">
          <p className="text-lg font-semibold">Student Information:</p>
          <p><strong>Name:</strong> {studentInfo.firstName} {studentInfo.lastName}</p>
          <p><strong>Adm No:</strong> {studentInfo.admissionNumber}</p>
          <p><strong>Class:</strong> {studentInfo.currentClass?.name || 'N/A'}</p>
          <p><strong>Stream:</strong> {studentInfo.stream || 'N/A'}</p>
        </div>
      )}

      <table className="w-full table-auto border border-gray-300 text-sm rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2 text-left">Subject</th>
            <th className="border px-4 py-2">Marks</th>
            <th className="border px-4 py-2">Grade</th>
            <th className="border px-4 py-2">Points</th>
            <th className="border px-4 py-2">Comment</th>
          </tr>
        </thead>
        <tbody>
          {results.length > 0 ? (
            results.map((result, index) => (
              <tr key={result._id || index} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{result.subject?.name || 'N/A'}</td>
                <td className="border px-4 py-2">{result.marksObtained}/{result.outOf}</td>
                <td className="border px-4 py-2">{result.grade}</td>
                <td className="border px-4 py-2">{result.points}</td>
                <td className="border px-4 py-2">{result.comment}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-4 text-gray-500">No results available for this selection.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
