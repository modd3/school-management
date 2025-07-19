import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaBookOpen } from 'react-icons/fa';
import { fetchStudentResults } from '../../api/results';
import { getTerms } from '../../api/terms';
import Spinner from '../../components/Spinner';

const EXAM_TYPES = [
  { value: 'Opener', label: 'Opener' },
  { value: 'Midterm', label: 'Midterm' },
  { value: 'Endterm', label: 'Endterm' },
];

export default function StudentExamReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(params.termId || '');
  const [selectedExamType, setSelectedExamType] = useState(params.examType || 'Opener');
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch terms on mount
  useEffect(() => {
    async function loadTerms() {
      try {
        const data = await getTerms();
        setTerms(data.terms || []);
        // If no term selected, default to first term
        if (!selectedTerm && data.terms && data.terms.length > 0) {
          setSelectedTerm(data.terms[0]._id);
        }
      } catch (err) {
        setError('Failed to load terms');
      }
    }
    loadTerms();
    // eslint-disable-next-line
  }, []);

  // Fetch results when term or exam type changes
  useEffect(() => {
    if (!selectedTerm || !selectedExamType) return;
    async function loadResults() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchStudentResults(selectedTerm, selectedExamType);
        setResults(Array.isArray(response.subjects) ? response.subjects : []);
        setStudent(response.student || null);
      } catch (err) {
        setError('Failed to load exam report');
        setResults([]);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [selectedTerm, selectedExamType]);

  // Update URL when selection changes (optional, for shareable links)
  useEffect(() => {
    if (selectedTerm && selectedExamType) {
      navigate(`/student/report/${selectedTerm}/${selectedExamType}`, { replace: true });
    }
    // eslint-disable-next-line
  }, [selectedTerm, selectedExamType]);

  if (loading) return <Spinner text="Loading student report..." />;
  if (error) return <div className="text-red-600 text-center mt-8">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <FaBookOpen /> {selectedExamType} Exam Report
      </h2>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          className="border px-3 py-2 rounded"
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
          className="border px-3 py-2 rounded"
          value={selectedExamType}
          onChange={e => setSelectedExamType(e.target.value)}
        >
          {EXAM_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <p><strong>Name:</strong> {student?.name || 'N/A'}</p>
        <p><strong>Adm No:</strong> {student?.admissionNumber}</p>
        <p><strong>Class:</strong> {student?.class}</p>
        <p><strong>Stream:</strong> {student?.stream}</p>
      </div>

      <table className="w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Subject</th>
            <th className="border px-4 py-2">Marks</th>
            <th className="border px-4 py-2">Grade</th>
            <th className="border px-4 py-2">Points</th>
            <th className="border px-4 py-2">Comment</th>
          </tr>
        </thead>
        <tbody>
          {results.length > 0 ? (
            results.map((result, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{result.subject}</td>
                <td className="border px-4 py-2">{result.marks}</td>
                <td className="border px-4 py-2">{result.grade}</td>
                <td className="border px-4 py-2">{result.points}</td>
                <td className="border px-4 py-2">{result.comment}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-4 text-gray-500">No results available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
