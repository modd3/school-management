import React, { useEffect, useState } from 'react';
import {
  getClassSubjectsByTeacher,
  submitResult,
} from '../../api/results';
import { getStudentsInClass } from '../../api/classes'; // expects backend endpoint
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner'; // Assuming you have a Spinner component
import { getTerms } from '../../api/terms'; // Import getTerms API call

export default function EnterMarksPage({ user }) {
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState('');
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [examType, setExamType] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state
  const [error, setError] = useState(null); // Added error state

  const [terms, setTerms] = useState([]); // State to store fetched terms

  // Effect 1: Load terms from the backend
  useEffect(() => {
    async function loadTerms() {
      setLoading(true);
      setError(null);
      try {
        const res = await getTerms();
        setTerms(res.terms || []);
        // Pre-select the first term if available and no term is already selected
        if (res.terms && res.terms.length > 0 && !term) {
          setTerm(res.terms[0]._id);
        }
      } catch (err) {
        console.error('[EnterMarksPage] Failed to load terms:', err);
        toast.error(err.message || 'Failed to load terms');
        setError(err.message || 'Failed to load terms');
      } finally {
        setLoading(false);
      }
    }
    loadTerms();
  }, []); // Run once on component mount

  // Effect 2: Load class subjects assigned to the logged-in teacher
  useEffect(() => {
    async function loadClassSubjects() {
      // Ensure user, term, and academicYear are available before fetching
      if (!user || !user._id || !term || !academicYear) {
        setClassSubjects([]);
        setSelectedClassSubject(''); // Clear selection if prerequisites not met
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Ensure getClassSubjectsByTeacher is configured to use req.user._id on backend
        // and populates 'class', 'subject', and 'term'
        const res = await getClassSubjectsByTeacher(term, academicYear);
        const fetchedClassSubjects = res.classSubjects || [];
        setClassSubjects(fetchedClassSubjects);

        // If there are fetched class subjects, attempt to pre-select the first one
        // ONLY if selectedClassSubject is currently empty or no longer valid
        if (fetchedClassSubjects.length > 0 && !fetchedClassSubjects.some(cs => cs._id === selectedClassSubject)) {
          setSelectedClassSubject(fetchedClassSubjects[0]._id);
        } else if (fetchedClassSubjects.length === 0) {
          setSelectedClassSubject(''); // Clear if no subjects found
        }
      } catch (err) {
        console.error('[EnterMarksPage] Failed to load assigned class-subjects:', err);
        toast.error(err.message || 'Failed to load assigned class-subjects');
        setError(err.message || 'Failed to load assigned class-subjects');
      } finally {
        setLoading(false);
      }
    };
    // Only call loadClassSubjects if term and academicYear are set
    if (term && academicYear) {
      loadClassSubjects();
    }
  }, [term, academicYear, user?._id]); // Depend on user?._id for safety

  // Effect 3: Load students in the selected class subject
  useEffect(() => {
    async function loadStudents() {
      // Only proceed if selectedClassSubject has a value and classSubjects is not empty
      if (!selectedClassSubject || classSubjects.length === 0 || !academicYear) {
        setStudents([]);
        setMarks({});
        return;
      }

      // Find the selected class subject object
      const selected = classSubjects.find(cs => cs._id === selectedClassSubject);

      // IMPORTANT: Robust checks for 'selected' and its nested 'class' property
      if (!selected || !selected.class || !selected.class._id) {
        setStudents([]);
        setMarks({});
        // Only show a warning if a subject was actually selected but data is bad
        if (selectedClassSubject && !loading && !error) {
            toast.warn('Selected subject has incomplete class information. Please check data setup or select another subject.');
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Call the API to get students in the selected class
        const res = await getStudentsInClass(selected.class._id, academicYear);
        setStudents(res.students || []);

        // Initialize marks state for new students
        const initialMarks = {};
        (res.students || []).forEach(s => {
          initialMarks[s._id] = {
            marksObtained: '',
            outOf: '',
            classSubjectId: selectedClassSubject,
            academicYear,
            term,
            examType,
          };
        });
        setMarks(initialMarks);
      } catch (err) {
        console.error('[EnterMarksPage] Failed to load students:', err);
        toast.error(err.message || 'Failed to load students');
        setError(err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    // This effect now depends on selectedClassSubject and classSubjects.
    // It will only run when selectedClassSubject is set and classSubjects has data to find from.
    if (selectedClassSubject && classSubjects.length > 0 && academicYear) { // Added explicit check here
        loadStudents();
    }
  }, [selectedClassSubject, academicYear, classSubjects, examType, term, loading, error]);

  const handleChange = (studentId, field, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSave = async (studentId) => {
    const data = marks[studentId];
    if (!data || data.marksObtained === '' || data.outOf === '') {
      toast.error('Please enter both marks obtained and total marks.');
      return;
    }

    if (!selectedClassSubject || !examType || !term || !academicYear) {
      toast.error('Please select Class & Subject, Exam Type, Term, and Academic Year.');
      return;
    }

    const marksObtained = Number(data.marksObtained);
    const outOf = Number(data.outOf);

    if (marksObtained < 0 || outOf <= 0) {
      toast.error('Marks must be positive numbers. "Out Of" must be greater than 0.');
      return;
    }
    if (marksObtained > outOf) {
        toast.error('Marks obtained cannot be greater than "Out Of" marks.');
        return;
    }

    setLoading(true);
    setError(null);
    try {
      // Find the full classSubject object to get class and subject IDs
      const selectedCS = classSubjects.find(cs => cs._id === selectedClassSubject);

      // Robust check for selected class subject data
      if (!selectedCS || !selectedCS.class || !selectedCS.subject) {
          toast.error('Selected Class & Subject data is incomplete. Cannot save marks.');
          setLoading(false);
          return;
      }

      await submitResult({
        student: studentId, // Changed from studentId to student as per common backend payload
        subject: selectedCS.subject._id, // Use populated subject ID
        class: selectedCS.class._id, // Use populated class ID
        academicYear,
        term, // Use term ID from state
        examType,
        marksObtained: marksObtained,
        outOf: outOf,
        enteredBy: user._id, // Assuming user._id is the teacher's ID
      });
      toast.success('Marks saved successfully!');
      // Clear marks for the saved student to allow new entry or indicate saved state
      setMarks(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], marksObtained: '', outOf: '' }
      }));
    } catch (err) {
      console.error('Failed to save marks:', err);
      toast.error(err.message || 'Failed to save marks.');
      setError(err.message || 'Failed to save marks.');
    } finally {
      setLoading(false);
    }
  };

  // Render loading spinner or error message if global loading/error
  if (loading && (!terms.length || !classSubjects.length || !students.length)) {
    return <Spinner message="Loading data..." />;
  }

  if (error) {
    return <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">Error: {error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">Enter Marks</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          value={academicYear}
          onChange={e => setAcademicYear(e.target.value)}
          className="border px-3 py-2 rounded w-full"
          placeholder="Academic Year"
        />
        <select value={term} onChange={e => setTerm(e.target.value)} className="border px-3 py-2 rounded w-full">
          <option value="">Select Term</option>
          {terms.map(t => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
        <select value={examType} onChange={e => setExamType(e.target.value)} className="border px-3 py-2 rounded w-full">
          <option value="">Select Exam Type</option>
          <option value="Opener">Opener</option>
          <option value="Midterm">Midterm</option>
          <option value="Endterm">Endterm</option>
        </select>
      </div>

      <div className="mb-6">
        <select value={selectedClassSubject} onChange={e => setSelectedClassSubject(e.target.value)} className="border px-3 py-2 rounded w-full">
          <option value="">Select Class & Subject</option>
          {classSubjects.map(cs => (
            // Ensure class and subject are populated before accessing name
            <option key={cs._id} value={cs._id}>
              {cs.class?.name} - {cs.subject?.name} ({cs.term?.name}) {/* Added optional chaining */}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional messages for user guidance */}
      {!term || !academicYear ? (
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded">
          <p className="font-bold">Setup Required</p>
          <p>Please select an academic year and term to view your assigned classes and subjects.</p>
        </div>
      ) : classSubjects.length === 0 && !loading && !error ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-4 rounded">
          <p className="font-bold">No Class Subjects Assigned</p>
          <p>You don't have any class subjects assigned for the selected term and academic year. Please contact the administrator.</p>
        </div>
      ) : !selectedClassSubject ? (
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded">
          <p className="font-bold">Select Class & Subject</p>
          <p>Please select a class and subject from the dropdown above.</p>
        </div>
      ) : !examType ? (
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded">
          <p className="font-bold">Select Exam Type</p>
          <p>Please select an exam type to view students and enter marks.</p>
        </div>
      ) : students.length === 0 && !loading && !error ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-4 rounded">
          <p className="font-bold">No Students Found</p>
          <p>No students are currently enrolled in this class and subject for the selected academic year.</p>
        </div>
      ) : null}


      {students.length > 0 && selectedClassSubject && examType && (
        <table className="w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Student</th>
              <th className="p-2">Marks</th>
              <th className="p-2">Out Of</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{s.firstName} {s.lastName}</td>
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    value={marks[s._id]?.marksObtained || ''}
                    onChange={e => handleChange(s._id, 'marksObtained', e.target.value)}
                    className="border px-2 py-1 rounded w-24"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="1"
                    value={marks[s._id]?.outOf || ''}
                    onChange={e => handleChange(s._id, 'outOf', e.target.value)}
                    className="border px-2 py-1 rounded w-24"
                  />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleSave(s._id)}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
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
};


