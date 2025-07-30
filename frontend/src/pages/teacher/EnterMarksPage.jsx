import React, { useEffect, useState } from 'react';
import {
  getClassSubjectsByTeacher,
  submitResult,
} from '../../api/results';
import { getStudentsInClass } from '../../api/classes'; // expects backend endpoint
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner'; // Assuming you have a Spinner component
import { getTerms } from '../../api/terms'; // Import getTerms API call
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook

export default function EnterMarksPage() {
  // Get user from AuthContext directly
  const { user } = useAuth();

  // Initial state declarations
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState('');
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [examType, setExamType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [terms, setTerms] = useState([]); // State to store fetched terms

  // --- DEBUG LOGS FOR INITIAL RENDER AND PROP CHANGES ---
  console.log('--- EnterMarksPage Component Render ---');
  console.log('Current User from useAuth:', user);
  console.log('Current Academic Year State:', academicYear);
  console.log('Current Term State:', term);
  console.log('Current Selected Class Subject State:', selectedClassSubject);
  console.log('Current Class Subjects Array Length:', classSubjects.length);
  console.log('Current Students Array Length:', students.length);
  console.log('Current Loading State:', loading);
  console.log('Current Error State:', error);
  // ---------------------------------------------------

  // Effect 1: Load terms from the backend and then class subjects
  useEffect(() => {
    async function initializeData() {
      console.log('[EFFECT 1 - InitializeData] triggered.');
      setLoading(true);
      setError(null);

      try {
        // Step 1: Load Terms
        console.log('[EFFECT 1] Attempting to load terms.');
        const termsRes = await getTerms();
        console.log('[EFFECT 1] Raw response from getTerms:', termsRes);
        setTerms(termsRes.terms || []);

        let currentTermId = term;
        if (termsRes.terms && termsRes.terms.length > 0 && !term) {
          currentTermId = termsRes.terms[0]._id;
          setTerm(currentTermId);
          console.log('[EFFECT 1] Pre-selected term ID:', currentTermId, 'Name:', termsRes.terms[0].name);
        } else if (term) {
          console.log('[EFFECT 1] Term already set:', term);
        } else {
          console.log('[EFFECT 1] No terms fetched or no term to pre-select.');
        }

        // Step 2: Load Class Subjects (only if user and term are available)
        // This part now runs immediately after terms are handled in the same effect
        if (user?._id && currentTermId && academicYear) {
          console.log(`[EFFECT 1] Attempting to fetch class subjects for teacher: ${user._id}, term: ${currentTermId}, academicYear: ${academicYear}`);
          const classSubjectsRes = await getClassSubjectsByTeacher(user._id, currentTermId, academicYear);
          console.log('[EFFECT 1] Raw response from getClassSubjectsByTeacher:', classSubjectsRes);
          const fetchedClassSubjects = classSubjectsRes.classSubjects || [];
          console.log('[EFFECT 1] Processed fetchedClassSubjects (array):', fetchedClassSubjects);
          setClassSubjects(fetchedClassSubjects);

          if (fetchedClassSubjects.length > 0) {
            if (!fetchedClassSubjects.some(cs => cs._id === selectedClassSubject)) {
              setSelectedClassSubject(fetchedClassSubjects[0]._id);
              console.log('[EFFECT 1] Pre-selected first class subject:', fetchedClassSubjects[0]._id);
            } else {
              console.log('[EFFECT 1] Selected class subject is still valid or already set.');
            }
          } else {
            setSelectedClassSubject(''); // Clear if no subjects found
            console.log('[EFFECT 1] No class subjects found, clearing selection.');
          }
        } else {
          console.log('[EFFECT 1] Skipping class subjects fetch: User, term, or academicYear not ready.');
          setClassSubjects([]);
          setSelectedClassSubject('');
        }

      } catch (err) {
        console.error('[EFFECT 1] Initialization failed:', err);
        toast.error(err.message || 'Failed to initialize data (terms or class subjects)');
        setError(err.message || 'Failed to initialize data');
      } finally {
        setLoading(false);
      }
    }

    // Only run this comprehensive initialization effect when user is available or term/academicYear changes
    // This ensures it runs when user logs in, or if the year/term is manually changed.
    initializeData();
  }, [user?._id, academicYear, term]); // Dependencies: user ID, academic year, and term (for re-trigger on manual change)

  // Effect 2: Load students when selectedClassSubject changes
  useEffect(() => {
    async function loadStudents() {
      console.log('[EFFECT 2 - LoadStudents] triggered.');
      console.log('  Dependencies: selectedClassSubject=', selectedClassSubject, 'academicYear=', academicYear);

      // Only proceed if we have a selected class subject and academic year
      if (!selectedClassSubject || !academicYear) {
        console.log('[EFFECT 2] Skipping loadStudents: Prerequisites not met.');
        setStudents([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log(`[EFFECT 2] Attempting to fetch students for classSubject: ${selectedClassSubject}, academicYear: ${academicYear}`);
        
        // Use the class-subjects API to get students enrolled in this specific subject
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/class-subjects/${selectedClassSubject}/students?academicYear=${academicYear}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch students');
        }

        const res = await response.json();
        console.log('[EFFECT 2] Raw response from getStudentsInSubject:', res);
        const fetchedStudents = res.students || [];
        console.log('[EFFECT 2] Processed fetchedStudents (array):', fetchedStudents);
        setStudents(fetchedStudents);
      } catch (err) {
        console.error('[EFFECT 2] Failed to load students:', err);
        toast.error(err.message || 'Failed to load students');
        setError(err.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, [selectedClassSubject, academicYear]);

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
      // Prepare data that matches the backend API expectations
      const resultData = {
        studentId: studentId,                  // Required by backend
        classSubjectId: selectedClassSubject,  // Required by backend (this is the class-subject combination)
        termId: term,                         // Required by backend
        examType,                             // Required by backend
        marksObtained: marksObtained,         // Required by backend
        outOf: outOf,                         // Required by backend
        academicYear: academicYear,           // Required by backend Result model
        comment: data.comment || '',          // Optional comment
        // enteredBy is set automatically in backend from req.user.profileId
      };

      console.log('Submitting result data:', resultData);
      
      await submitResult(resultData);
      toast.success('Marks saved successfully!');
      
      // Clear marks for the saved student to allow new entry or indicate saved state
      setMarks(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], marksObtained: '', outOf: '', comment: '' }
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
  if (loading && (!terms.length || !classSubjects.length)) {
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
              <th className="p-2">Comment</th>
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
                    placeholder="0"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="1"
                    value={marks[s._id]?.outOf || ''}
                    onChange={e => handleChange(s._id, 'outOf', e.target.value)}
                    className="border px-2 py-1 rounded w-24"
                    placeholder="100"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={marks[s._id]?.comment || ''}
                    onChange={e => handleChange(s._id, 'comment', e.target.value)}
                    className="border px-2 py-1 rounded w-32"
                    placeholder="Optional comment"
                    maxLength="500"
                  />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleSave(s._id)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Saving...' : 'Save'}
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