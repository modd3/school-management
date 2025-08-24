import React, { useEffect, useState, useCallback } from 'react';
import { FaClipboardList } from 'react-icons/fa';
import { enterMarks, getResultsByTeacher } from '../../api/results';
import { getMyClassSubjects, getStudentsInSubject } from '../../api/classSubjects';
import { getAcademicCalendars } from '../../api/academicCalendar'; // New API call
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

export default function EnterMarksPage() {
  const { user } = useAuth();

  // State aligned with new backend structure
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(''); // Now stores term number e.g., 1, 2, 3
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedClassSubject, setSelectedClassSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { studentId: { assessments: { cat1: ..., cat2: ... }, teacherComments: '' } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Effect 1: Load academic calendars
  useEffect(() => {
    async function loadCalendars() {
      try {
        const calendars = await getAcademicCalendars();
        setAcademicYears(calendars);
        const currentYear = new Date().getFullYear().toString();
        const activeYear = calendars.find(c => c.academicYear.startsWith(currentYear) && c.status === 'active');
        if (activeYear) {
          setActiveAcademicYear(activeYear);
          setSelectedYear(activeYear.academicYear);
          if (activeYear.terms.length > 0) {
            setSelectedTerm(activeYear.terms[0].termNumber);
          }
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load academic calendars');
        setError(err.message);
      }
    }
    loadCalendars();
  }, []);

  // Effect 2: Load class subjects when year or term changes
  useEffect(() => {
    if (!user?._id || !selectedYear || !selectedTerm) return;

    async function loadClassSubjects() {
      setLoading(true);
      try {
        const res = await getMyClassSubjects(selectedYear, selectedTerm);
        setClassSubjects(res.classSubjects || []);
        if (res.classSubjects?.length > 0) {
          setSelectedClassSubject(res.classSubjects[0]);
        } else {
          setSelectedClassSubject(null);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load class subjects');
      } finally {
        setLoading(false);
      }
    }
    loadClassSubjects();
  }, [user?._id, selectedYear, selectedTerm]);

  // Effect 3: Load students and their marks when class-subject changes
  useEffect(() => {
    if (!selectedClassSubject) {
      setStudents([]);
      setMarks({});
      return;
    }

    async function loadStudentsAndMarks() {
      setLoading(true);
      try {
        const studentsRes = await getStudentsInSubject(selectedClassSubject._id);
        const fetchedStudents = studentsRes.students || [];
        setStudents(fetchedStudents);

        // Fetch all results for this term and pre-fill
        const resultsRes = await getResultsByTeacher(`classSubjectId=${selectedClassSubject._id}&academicYear=${selectedYear}&term=${selectedTerm}`);
        const existingResults = resultsRes.results || [];

        const initialMarks = {};
        fetchedStudents.forEach(student => {
          const result = existingResults.find(r => r.student._id === student._id);
          initialMarks[student._id] = {
            assessments: {
              cat1: { marks: result?.assessments?.cat1?.marks || '' },
              cat2: { marks: result?.assessments?.cat2?.marks || '' },
              endterm: { marks: result?.assessments?.endterm?.marks || '' },
            },
            teacherComments: result?.teacherComments || ''
          };
        });
        setMarks(initialMarks);

      } catch (err) {
        toast.error(err.message || 'Failed to load students or marks');
      } finally {
        setLoading(false);
      }
    }
    loadStudentsAndMarks();
  }, [selectedClassSubject, selectedYear, selectedTerm]);

  const handleMarksChange = useCallback((studentId, assessment, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        assessments: {
          ...prev[studentId].assessments,
          [assessment]: { ...prev[studentId].assessments[assessment], marks: value }
        }
      }
    }));
  }, []);

  const handleCommentChange = useCallback((studentId, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], teacherComments: value }
    }));
  }, []);

  const handleSave = async (studentId) => {
    const studentMarks = marks[studentId];
    if (!studentMarks || !selectedClassSubject) {
      toast.error('Cannot save, data is missing.');
      return;
    }

    const maxMarks = selectedClassSubject.maxMarks;

    const resultData = {
      studentId: studentId,
      classSubjectId: selectedClassSubject._id,
      academicYear: selectedYear,
      term: selectedTerm,
      assessments: {
        cat1: { marks: Number(studentMarks.assessments.cat1.marks), maxMarks: maxMarks.cat1 },
        cat2: { marks: Number(studentMarks.assessments.cat2.marks), maxMarks: maxMarks.cat2 },
        endterm: { marks: Number(studentMarks.assessments.endterm.marks), maxMarks: maxMarks.endterm },
      },
      teacherComments: studentMarks.teacherComments
    };

    setLoading(true);
    try {
      await enterMarks(resultData);
      toast.success('Marks saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save marks.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Enter Marks</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select onChange={e => setSelectedYear(e.target.value)} value={selectedYear}>
          {academicYears.map(y => <option key={y._id} value={y.academicYear}>{y.academicYear}</option>)}
        </select>
        <select onChange={e => setSelectedTerm(Number(e.target.value))} value={selectedTerm}>
          {activeAcademicYear?.terms.map(t => <option key={t.termNumber} value={t.termNumber}>{t.name}</option>)}
        </select>
        <select onChange={e => setSelectedClassSubject(classSubjects.find(cs => cs._id === e.target.value))} value={selectedClassSubject?._id || ''}>
          <option value="">Select Class & Subject</option>
          {classSubjects.map(cs => <option key={cs._id} value={cs._id}>{cs.class.name} - {cs.subject.name}</option>)}
        </select>
      </div>

      {loading && <Spinner />}

      {/* Marks Table */}
      {students.length > 0 && selectedClassSubject && (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Student</th>
                <th>CAT 1 (/{selectedClassSubject.maxMarks.cat1})</th>
                <th>CAT 2 (/{selectedClassSubject.maxMarks.cat2})</th>
                <th>End Term (/{selectedClassSubject.maxMarks.endterm})</th>
                <th>Comments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const studentMarks = marks[student._id] || { assessments: { cat1:{}, cat2:{}, endterm:{} }, teacherComments: '' };
                return (
                  <tr key={student._id}>
                    <td>{student.firstName} {student.lastName}</td>
                    <td><input type="number" value={studentMarks.assessments.cat1.marks} onChange={e => handleMarksChange(student._id, 'cat1', e.target.value)} className="w-24 p-2" /></td>
                    <td><input type="number" value={studentMarks.assessments.cat2.marks} onChange={e => handleMarksChange(student._id, 'cat2', e.target.value)} className="w-24 p-2" /></td>
                    <td><input type="number" value={studentMarks.assessments.endterm.marks} onChange={e => handleMarksChange(student._id, 'endterm', e.targe.value)} className="w-24 p-2" /></td>
                    <td><input type="text" value={studentMarks.teacherComments} onChange={e => handleCommentChange(student._id, e.target.value)} className="w-full p-2" /></td>
                    <td><button onClick={() => handleSave(student._id)} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
