import React, { useEffect, useState } from 'react';
import { getStudentFinalReport } from '../../api/results';
import { getAcademicCalendars } from '../../api/academicCalendar';
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner';

export default function StudentFinalReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const data = await getAcademicCalendars();
        setCalendars(data);
        const activeYear = data.find(c => c.status === 'active');
        if (activeYear) {
          setSelectedYear(activeYear.academicYear);
          if (activeYear.terms.length > 0) {
            setSelectedTerm(activeYear.terms[0].termNumber);
          }
        }
      } catch (err) {
        toast.error('Failed to load academic calendars.');
      }
    };
    fetchCalendars();
  }, []);

  useEffect(() => {
    if (!selectedYear || !selectedTerm) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentFinalReport(selectedYear, selectedTerm);
        setReport(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch report.');
        toast.error(err.message || 'Failed to fetch report.');
      }
      setLoading(false);
    };

    fetchReport();
  }, [selectedYear, selectedTerm]);

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Final Term Report</h1>
      
      <div className="flex gap-4 mb-4">
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="p-2 border rounded">
          {calendars.map(c => <option key={c._id} value={c.academicYear}>{c.academicYear}</option>)}
        </select>
        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="p-2 border rounded">
          {calendars.find(c => c.academicYear === selectedYear)?.terms.map(t => <option key={t.termNumber} value={t.termNumber}>{t.name}</option>)}
        </select>
      </div>

      {report && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><strong>Mean Points:</strong> {report.summary.meanPoints}</div>
            <div><strong>Mean Grade:</strong> {report.summary.meanGrade}</div>
          </div>

          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2">Subject</th>
                <th>Final Percentage</th>
                <th>Grade</th>
                <th>Points</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((res, index) => (
                <tr key={index} className="text-center">
                  <td className="py-2">{res.subject}</td>
                  <td>{res.finalPercentage}%</td>
                  <td>{res.grade}</td>
                  <td>{res.points}</td>
                  <td>{res.teacherComments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
