import React, { useEffect, useState } from 'react';
import { FaBookOpen, FaFilter, FaSpinner } from 'react-icons/fa'; // Added FaSpinner
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { getTeacherResults } from '../../api/results'; // Assuming this API call exists
import { getSubjects } from '../../api/subjects'; // To filter by subject name
import { getTerms } from '../../api/terms'; // To filter by term name
import { toast } from 'react-toastify'; // For notifications

export default function TeacherResultsPage() {
  const { user } = useAuth(); // Get user from context
  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSubject, setFilterSubject] = useState(''); // Filter by subject ID
  const [filterTerm, setFilterTerm] = useState('');     // Filter by term ID
  const [filterAcademicYear, setFilterAcademicYear] = useState(new Date().getFullYear().toString()); // Filter by academic year

  // Load subjects and terms for filters
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const subjectsRes = await getSubjects();
        setSubjects(subjectsRes.subjects || []);
        const termsRes = await getTerms();
        setTerms(termsRes.terms || []);
      } catch (err) {
        toast.error('Failed to load filter options (subjects/terms).');
        console.error('Error loading filter options:', err);
      }
    }
    loadFilterOptions();
  }, []);

  useEffect(() => {
    async function fetchResults() {
      if (!user || !user._id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('teacherId', user._id); // Pass logged-in teacher's ID
        if (filterSubject) {
          queryParams.append('subjectId', filterSubject);
        }
        if (filterTerm) {
          queryParams.append('termId', filterTerm);
        }
        if (filterAcademicYear) {
          queryParams.append('academicYear', filterAcademicYear);
        }

        // Make sure your getTeacherResults API call accepts query parameters
        // Example: const res = await getTeacherResults(user._id, filterSubject, filterTerm, filterAcademicYear);
        const res = await getTeacherResults(queryParams.toString()); // Pass query string
        setResults(res.results || []);
      } catch (err) {
        console.error('[TeacherResultsPage] Fetch error:', err);
        setError(err.message || 'Failed to fetch results');
        toast.error(err.message || 'Failed to fetch results');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [user, filterSubject, filterTerm, filterAcademicYear]); // Re-fetch when filters or user change

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-blue-600 text-4xl mr-3" />
        <p className="text-xl text-gray-700">Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4 text-center text-xl">Error: {error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl max-w-6xl mx-auto mt-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaBookOpen className="text-blue-600"/> My Results
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="">All Subjects</option>
            {subjects.map(sub => (
              <option key={sub._id} value={sub._id}>{sub.name}</option>
            ))}
          </select>
          <select
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="">All Terms</option>
            {terms.map(term => (
              <option key={term._id} value={term._id}>{term.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Academic Year"
            value={filterAcademicYear}
            onChange={(e) => setFilterAcademicYear(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          />
        </div>
      </div>

      {results.length === 0 ? (
        <p className="text-center text-gray-600 p-4">No results found for the selected filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{r.student?.firstName} {r.student?.lastName}</td>
                  <td className="border px-4 py-2">{r.subject?.name}</td>
                  <td className="border px-4 py-2">{r.term?.name}</td>
                  <td className="border px-4 py-2">{r.examType}</td>
                  <td className="border px-4 py-2">{r.marksObtained}/{r.outOf}</td>
                  <td className="border px-4 py-2">{r.percentage?.toFixed(1)}%</td>
                  <td className="border px-4 py-2">{r.grade}</td>
                  <td className="border px-4 py-2">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
