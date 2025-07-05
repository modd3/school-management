import React, { useEffect, useState } from 'react';
import { FaBookOpen, FaFilter } from 'react-icons/fa';
import { fetchTeacherResults } from '../../api/results';
import Spinner from '../../components/Spinner';

export default function TeacherResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

useEffect(() => {
  async function fetchResults() {
    console.log('[ResultsByMePage] Starting fetch...');
    try {
      const res = await fetchTeacherResults();
      console.log('[ResultsByMePage] Results fetched:', res);
      setResults(res.results || []); 
    } catch (err) {
      console.error('[ResultsByMePage] Fetch error:', err);
      setError(err.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }

  fetchResults();
}, []);

  const filteredResults = results.filter((result) =>
    result.subject?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    result.student?.firstName?.toLowerCase().includes(filter.toLowerCase()) ||
    result.student?.lastName?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <Spinner message="Loading your results..." />;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl max-w-6xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaBookOpen className="text-blue-600" /> Results You Entered
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <FaFilter className="text-gray-400" />
          <input
            type="text"
            placeholder="Search subject or student..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="text-center text-gray-500">No results found for your search.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="border px-4 py-2">Student</th>
                <th className="border px-4 py-2">Subject</th>
                <th className="border px-4 py-2">Term</th>
                <th className="border px-4 py-2">Exam</th>
                <th className="border px-4 py-2">Marks</th>
                <th className="border px-4 py-2">%</th>
                <th className="border px-4 py-2">Grade</th>
                <th className="border px-4 py-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">
                    {r.student?.firstName} {r.student?.lastName}
                  </td>
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
