import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ReportCardPage({ studentId, termId }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/teacher/results/student/${studentId}/term/${termId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Calculate total and average
          const total = data.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
          const avg = data.length ? total / data.length : 0;
          setReport({ results: data, total, avg });
        } else {
          setError(data.message || 'No results found');
        }
      });
  }, [studentId, termId]);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!report) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Report Card</h2>
      <table className="w-full border mb-4">
        <thead>
          <tr>
            <th className="border p-2">Subject</th>
            <th className="border p-2">Marks</th>
            <th className="border p-2">Grade</th>
            <th className="border p-2">Points</th>
            <th className="border p-2">Comment</th>
          </tr>
        </thead>
        <tbody>
          {report.results.map(r => (
            <tr key={r._id}>
              <td className="border p-2">{r.subject.name}</td>
              <td className="border p-2">{r.marksObtained}</td>
              <td className="border p-2">{r.grade}</td>
              <td className="border p-2">{r.points}</td>
              <td className="border p-2">{r.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="font-semibold">Total: {report.total}</div>
      <div className="font-semibold">Average: {report.avg.toFixed(2)}</div>
    </div>
  );
}