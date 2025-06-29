import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function EnterMarksPage() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [examType, setExamType] = useState('Opener');
  const [marks, setMarks] = useState('');
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  // Fetch students, subjects, and terms on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/teacher/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStudents(data.students || []));
    fetch(`${API_BASE_URL}/teacher/subjects`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setSubjects(data.subjects || []));
    fetch(`${API_BASE_URL}/teacher/terms`, { headers: { Authorization: `Bearer ${token}` } })
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
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        studentId: selectedStudent,
        subjectId: selectedSubject,
        termId: selectedTerm,
        examType,
        marksObtained: Number(marks),
        comment
      })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Marks saved! Grade: ' + data.result.grade + ', Points: ' + data.result.points);
    } else {
      setMessage(data.message || 'Error saving marks');
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
        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required className="w-full border p-2 rounded">
          <option value="">Select Subject</option>
          {subjects.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
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
        <input type="number" value={marks} onChange={e => setMarks(e.target.value)} placeholder="Marks" min={0} max={100} required className="w-full border p-2 rounded" />
        <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment (optional)" className="w-full border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Marks</button>
      </form>
      {message && <div className="mt-4 text-center text-green-700">{message}</div>}
    </div>
  );
}