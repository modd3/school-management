import React, { useEffect, useState } from 'react';
import { calculateGradeAndPoints } from '../../utils/grading'; // Adjust path as needed

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function EnterMarksPage() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [examType, setExamType] = useState('Opener');
  const [marksObtained, setMarksObtained] = useState('');
  const [outOf, setOutOf] = useState('');
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  // Live computed values
  const percentage = (marksObtained && outOf) ? ((marksObtained / outOf) * 100).toFixed(2) : '';
  const { grade, points } = calculateGradeAndPoints(Number(percentage));

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`${API_BASE_URL}/teacher/students`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStudents(data.students || []));

    fetch(`${API_BASE_URL}/teacher/my-subjects`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSubjects(data.subjects || []));

    fetch(`${API_BASE_URL}/teacher/terms`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTerms(data.terms || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_BASE_URL}/teacher/results/enter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        studentId: selectedStudent,
        subjectId: selectedSubject,
        termId: selectedTerm,
        examType,
        marksObtained: Number(marksObtained),
        outOf: Number(outOf),
        percentage: Number(percentage),
        grade,
        points,
        comment
      })
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`✅ Marks saved! Grade: ${grade}, Points: ${points}`);
    } else {
      setMessage(data.message || '❌ Error saving marks');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Enter Marks</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required className="w-full border p-2 rounded">
          <option value="">Select Student</option>
          {students.map(s => (
            <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
          ))}
        </select>

      <select
  value={selectedSubject}
  onChange={e => setSelectedSubject(e.target.value)}
  required
  className="w-full border p-2 rounded"
>
  <option value="">Select Subject</option>
  {subjects.map(s => (
    <option key={s._id} value={s._id}>
      {s.code}
    </option>
  ))}
</select>

        <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} required className="w-full border p-2 rounded">
          <option value="">Select Term</option>
          {terms.map(t => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>

        <select value={examType} onChange={e => setExamType(e.target.value)} required className="w-full border p-2 rounded">
          <option value="Opener">Opener</option>
          <option value="Midterm">Midterm</option>
          <option value="Endterm">Endterm</option>
        </select>

        <input
          type="number"
          value={marksObtained}
          onChange={e => setMarksObtained(e.target.value)}
          placeholder="Marks Obtained"
          min={0}
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          value={outOf}
          onChange={e => setOutOf(e.target.value)}
          placeholder="Out of"
          min={1}
          required
          className="w-full border p-2 rounded"
        />

        {percentage && (
          <div className="bg-gray-100 p-3 rounded text-sm">
            📊 <strong>Percentage:</strong> {percentage}%<br />
            🏷️ <strong>Grade:</strong> {grade}<br />
            ⭐ <strong>Points:</strong> {points}
          </div>
        )}

        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Comment (optional)"
          className="w-full border p-2 rounded"
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Marks
        </button>
      </form>

      {message && <div className="mt-4 text-center text-green-700">{message}</div>}
    </div>
  );
}
