import React, { useEffect, useState } from 'react';
import {
  getClassSubjectsByTeacher,
  submitResult,
} from '../../api/results';
import { getStudentsInClass } from '../../api/classes'; // expects backend endpoint
import { toast } from 'react-toastify';

export default function EnterMarksPage({ user }) {
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [examType, setExamType] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026'); // Can be auto-filled later
  const [term, setTerm] = useState('');
  const [marks, setMarks] = useState({}); // { studentId: { marksObtained, outOf } }

  useEffect(() => {
    async function loadClassSubjects() {
      try {
        const res = await getClassSubjectsByTeacher(user._id, term, academicYear);
        setClassSubjects(res.classSubjects || []);
      } catch (err) {
        toast.error('Failed to load assigned class-subjects');
      }
    }

    if (term && academicYear) {
      loadClassSubjects();
    }
  }, [term, academicYear, user._id]);

  useEffect(() => {
    async function loadStudents() {
      const selected = classSubjects.find(cs => cs._id === selectedClassSubject);
      if (!selected) return;
      try {
        const res = await getStudentsInClass(selected.class._id, academicYear);
        setStudents(res.students || []);
      } catch (err) {
        toast.error('Failed to load students');
      }
    }

    if (selectedClassSubject) {
      loadStudents();
    }
  }, [selectedClassSubject]);

  const handleMarkChange = (studentId, field, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };



const handleSubmit = async (e) => {
  e.preventDefault();
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
    toast.success(`✅ Marks saved! Grade: ${grade}, Points: ${points}`);
  } else {
    toast.error(data.message || '❌ Error saving marks');
  }
};

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Enter Marks</h2>

      <div className="flex gap-4 mb-4">
        <select value={term} onChange={e => setTerm(e.target.value)} className="border px-3 py-2 rounded w-full">
          <option value="">Select Term</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>

        <input
          type="text"
          value={academicYear}
          onChange={e => setAcademicYear(e.target.value)}
          className="border px-3 py-2 rounded w-full"
          placeholder="Academic Year"
        />
      </div>

      <div className="mb-4">
        <select value={selectedClassSubject} onChange={e => setSelectedClassSubject(e.target.value)} className="border px-3 py-2 rounded w-full">
          <option value="">Select Class & Subject</option>
          {classSubjects.map(cs => (
            <option key={cs._id} value={cs._id}>
              {cs.class.name} - {cs.subject.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <select value={examType} onChange={e => setExamType(e.target.value)} className="border px-3 py-2 rounded w-full">
          <option value="">Select Exam Type</option>
          <option value="Opener">Opener</option>
          <option value="Midterm">Midterm</option>
          <option value="Endterm">Endterm</option>
        </select>
      </div>

      {students.length > 0 && (
        <table className="w-full border mt-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Student</th>
              <th className="p-2">Marks</th>
              <th className="p-2">Out Of</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{s.firstName} {s.lastName}</td>
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    name="marksObtained"
                    value={marks[s._id]?.marksObtained || ''}
                    onChange={(e) => handleMarkChange(s._id, 'marksObtained', e.target.value)}
                    className="border px-2 py-1 w-20"
                    required
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="1"
                    name="outOf"
                    value={marks[s._id]?.outOf || ''}
                    onChange={(e) => handleMarkChange(s._id, 'outOf', e.target.value)}
                    className="border px-2 py-1 w-20"
                    required
                  />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleSubmit(s._id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
