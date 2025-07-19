import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaBookOpen } from 'react-icons/fa';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

export default function StudentFinalReportPage() {
  const { termId } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!termId || !user || !token) {
      return;
    }

  const fetchFinalReport = async () => {
    try {
      const res = await fetch(`/api/student/final-report/${termId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error(`Failed to fetch final report (${res.status})`);

      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  fetchFinalReport();
      }, [termId, user?.token, user]);

  const { finalResults = [], student = {} } = report || {};

  if (loading) return <Spinner text="Loading final report..." />;
  if (error) return <div className="text-red-600 text-center mt-8">{error}</div>;
  if (finalResults.length === 0) return <div className="text-center mt-8 text-gray-600">No final results available.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <FaBookOpen /> Final Report Card
      </h2>

      <div className="mb-4 text-sm text-gray-700 space-y-1">
        <p><strong>Name:</strong> {student.name || '-'}</p>
        <p><strong>Adm No:</strong> {student.admissionNumber || '-'}</p>
        <p><strong>Class:</strong> {student.class || '-'}</p>
        <p><strong>Stream:</strong> {student.stream || '-'}</p>
      </div>

      <table className="w-full table-auto border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Subject</th>
            <th className="border px-2 py-1">Opener %</th>
            <th className="border px-2 py-1">Midterm %</th>
            <th className="border px-2 py-1">Endterm %</th>
            <th className="border px-2 py-1 font-semibold">Final %</th>
            <th className="border px-2 py-1">Grade</th>
            <th className="border px-2 py-1">Points</th>
            <th className="border px-2 py-1">Comment</th>
          </tr>
        </thead>
        <tbody>
          {finalResults.map((res, index) => (
            <tr key={index}>
              <td className="border px-2 py-1">{res.subject?.name || '-'}</td>
              <td className="border px-2 py-1 text-center">{res.breakdown?.opener ?? '-'}</td>
              <td className="border px-2 py-1 text-center">{res.breakdown?.midterm ?? '-'}</td>
              <td className="border px-2 py-1 text-center">{res.breakdown?.endterm ?? '-'}</td>
              <td className="border px-2 py-1 text-center font-semibold">{res.finalPercentage || '-'}</td>
              <td className="border px-2 py-1 text-center">{res.grade || '-'}</td>
              <td className="border px-2 py-1 text-center">{res.points ?? '-'}</td>
              <td className="border px-2 py-1">{res.comment || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
