import React, { useEffect, useState } from 'react';
import { getClassFinalReports } from '../../api/results';
import { getAcademicCalendars } from '../../api/academicCalendar';
import { getClasses } from '../../api/classes';
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner';

export default function ClassFinalReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [calendarData, classData] = await Promise.all([getAcademicCalendars(), getClasses()]);
        setCalendars(calendarData);
        setClasses(classData.classes);

        const activeYear = calendarData.find(c => c.status === 'active');
        if (activeYear) {
          setSelectedYear(activeYear.academicYear);
          if (activeYear.terms.length > 0) {
            setSelectedTerm(activeYear.terms[0].termNumber);
          }
        }
        if (classData.classes.length > 0) {
          setSelectedClass(classData.classes[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load initial data.');
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedYear || !selectedTerm || !selectedClass) return;

    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getClassFinalReports(selectedClass, selectedYear, selectedTerm);
        setReports(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch reports.');
        toast.error(err.message || 'Failed to fetch reports.');
      }
      setLoading(false);
    };

    fetchReports();
  }, [selectedYear, selectedTerm, selectedClass]);

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Class Final Reports</h1>
      
      <div className="flex gap-4 mb-4">
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border rounded">
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="p-2 border rounded">
          {calendars.map(c => <option key={c._id} value={c.academicYear}>{c.academicYear}</option>)}
        </select>
        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="p-2 border rounded">
          {calendars.find(c => c.academicYear === selectedYear)?.terms.map(t => <option key={t.termNumber} value={t.termNumber}>{t.name}</option>)}
        </select>
      </div>

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Rank</th>
            <th>Student</th>
            <th>Mean Points</th>
            <th>Mean Grade</th>
            <th>Total Points</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.student._id} className="text-center">
              <td className="py-2">{report.position}</td>
              <td>{report.student.firstName} {report.student.lastName}</td>
              <td>{report.summary.meanPoints.toFixed(2)}</td>
              <td>{report.summary.meanGrade}</td>
              <td>{report.summary.totalPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
