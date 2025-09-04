import React, { useEffect, useState, useCallback } from 'react';
import { FaClipboardList } from 'react-icons/fa'; // Import icon for UI
import {
  submitResult, // Renamed from submitResult in results.js API
  getResultsByTeacher // To fetch existing results for pre-filling
} from '../../api/results'; // Ensure this path is correct for your results API functions
import { getMyClassSubjects, getStudentsInSubject } from '../../api/classSubjects'; // Ensure these paths are correct
import { toast } from 'react-toastify';
import Spinner from '../../components/Spinner';
import { getTeacherTerms } from '../../api/terms'; // Ensure this path is correct
import { useAuth } from '../../context/AuthContext';
import { calculateGradeAndPoints } from '../../utils/grading'; // Import grading utility

export default function EnterMarksPage() {
  const { user } = useAuth(); // Get logged-in user from AuthContext

  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState('');
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [students, setStudents] = useState([]);
  // `marks` state now stores { studentId: { marksObtained, outOf, comment, percentage, grade, points } }
  const [marks, setMarks] = useState({});
  const [examType, setExamType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [terms, setTerms] = useState([]);
  const [examTypes] = useState(['Opener', 'Midterm', 'Endterm']); // Fixed exam types

  // Effect 1: Load terms and then class subjects for the teacher
  useEffect(() => {
    async function initializeData() {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Load Terms
        const termsRes = await getTeacherTerms();
        setTerms(termsRes.terms || []);

        let currentTermId = term;
        if (termsRes.terms && termsRes.terms.length > 0 && !term) {
          currentTermId = termsRes.terms[0]._id;
          setTerm(currentTermId);
        }

        // Step 2: Load Class Subjects (only if user and term are available)
        if (user?._id && currentTermId && academicYear) {
          // getMyClassSubjects expects a query string like "term=ID&academicYear=YEAR"
          const classSubjectsRes = await getMyClassSubjects(currentTermId, academicYear);
          const fetchedClassSubjects = classSubjectsRes.classSubjects || [];
          setClassSubjects(fetchedClassSubjects);

          // If there's a selected class subject that's no longer valid, or no subject selected,
          // default to the first available class subject.
          if (fetchedClassSubjects.length > 0) {
            if (!fetchedClassSubjects.some(cs => cs._id === selectedClassSubject)) {
              setSelectedClassSubject(fetchedClassSubjects[0]._id);
            }
          } else {
            setSelectedClassSubject(''); // Clear if no subjects found
          }
        } else {
          setClassSubjects([]);
          setSelectedClassSubject('');
        }

      } catch (err) {
        toast.error(err.message || 'Failed to initialize data (terms or class subjects)');
        setError(err.message || 'Failed to initialize data');
      } finally {
        setLoading(false);
      }
    }

    if (user?._id) { // Only run this effect if user is loaded
      initializeData();
    }
  }, [user?._id, academicYear, term]); // Re-run when user ID, academic year, or term changes

  // Effect 2: Load students and their existing marks when selectedClassSubject or examType changes
  useEffect(() => {
    async function loadStudentsAndMarks() {
      // Only proceed if we have a selected class subject, academic year, and exam type
      if (!selectedClassSubject || !academicYear || !examType) {
        setStudents([]);
        setMarks({}); // Clear marks if prerequisites not met
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch students for the selected class subject
        // getStudentsInSubject expects classSubjectId and academicYear as parameters
        const studentsRes = await getStudentsInSubject(selectedClassSubject, academicYear);
        const fetchedStudents = studentsRes.students || [];
        setStudents(fetchedStudents);

        // Fetch existing marks for these students for the selected exam type, term, and academic year
        // getResultsByTeacher expects a query string like "subjectId=ID&termId=ID&academicYear=YEAR&examType=TYPE"
        const existingResultsRes = await getResultsByTeacher(
          `subjectId=${selectedClassSubject}&termId=${term}&academicYear=${academicYear}&examType=${examType}`
        );
        const existingResults = existingResultsRes.results || [];

        // Pre-fill marks state with existing data
        const initialMarks = {};
        fetchedStudents.forEach(student => {
          const existingMark = existingResults.find(
            // Check both populated student object or just student ID
            result => result.student?._id === student._id || result.student === student._id
          );
          initialMarks[student._id] = {
            marksObtained: existingMark ? existingMark.marksObtained : '',
            outOf: existingMark ? existingMark.outOf : '',
            comment: existingMark ? existingMark.comment : '',
            percentage: existingMark ? existingMark.percentage : null,
            grade: existingMark ? existingMark.grade : null,
            points: existingMark ? existingMark.points : null,
          };
        });
        setMarks(initialMarks);

      } catch (err) {
        toast.error(err.message || 'Failed to load students or existing marks');
        setError(err.message || 'Failed to load students or existing marks');
        setStudents([]);
        setMarks({});
      } finally {
        setLoading(false);
      }
    }
    // Re-run this effect when selectedClassSubject, academicYear, examType, or term changes
    // User is also a dependency because getTeacherResults uses user._id on the backend implicitly.
    loadStudentsAndMarks();
  }, [selectedClassSubject, academicYear, examType, term, user]);

  // Handle changes in marks input fields
  const handleChange = useCallback((studentId, field, value) => {
    setMarks(prev => {
      const updatedStudentMarks = {
        ...prev[studentId],
        [field]: value,
      };

      // Frontend calculation for immediate display (backend will re-calculate and store)
      const marksObtained = Number(updatedStudentMarks.marksObtained);
      const outOf = Number(updatedStudentMarks.outOf);

      if (!isNaN(marksObtained) && !isNaN(outOf) && outOf > 0) {
        const percentage = (marksObtained / outOf) * 100;
        // Use consistent grading utility for frontend display (matches backend calculation)
        const { grade, points } = calculateGradeAndPoints(percentage);

        updatedStudentMarks.percentage = percentage;
        updatedStudentMarks.grade = grade;
        updatedStudentMarks.points = points;
        // Comment is not auto-generated on frontend to allow manual input
      } else {
        updatedStudentMarks.percentage = null;
        updatedStudentMarks.grade = null;
      }

      return {
        ...prev,
        [studentId]: updatedStudentMarks,
      };
    });
  }, []);


  // Handle saving marks for a single student
  const handleSave = async (studentId) => {
    const studentMarks = marks[studentId];

    // Frontend validation for required fields
    if (!studentMarks || studentMarks.marksObtained === '' || studentMarks.outOf === '') {
      toast.error('Please enter both marks obtained and total marks.');
      return;
    }

    if (!selectedClassSubject || !examType || !term || !academicYear) {
      toast.error('Please select Class & Subject, Exam Type, Term, and Academic Year.');
      return;
    }

    const marksObtained = Number(studentMarks.marksObtained);
    const outOf = Number(studentMarks.outOf);

    if (marksObtained < 0 || outOf <= 0) {
      toast.error('Marks must be non-negative. "Out Of" must be greater than 0.');
      return;
    }
    if (marksObtained > outOf) {
      toast.error('Marks obtained cannot be greater than "Out Of" marks.');
      return;
    }

    setLoading(true); // Set loading state for the save operation
    setError(null);
    try {
      // Prepare data that matches the backend API expectations for `submitMarks`
      const resultData = {
        studentId: studentId,                  // Student ID
        classSubjectId: selectedClassSubject,  // ID of the ClassSubject assignment
        termId: term,                         // Term ID
        academicYear: academicYear,           // Academic Year
        examType: examType,                 // Exam Type
        marksObtained: marksObtained,         // Marks obtained
        outOf: outOf,                         // Total marks
        comment: studentMarks.comment || '',  // Optional comment (will be overwritten by backend if empty)
        enteredBy: user._id,                 // The logged-in teacher's user ID
      };
console.log(JSON.stringify(resultData));
      await submitResult(resultData); // Call the submitMarks API function
      toast.success('Marks saved successfully!');

      // After saving, re-fetch students and marks to ensure the table reflects the latest data
      // including backend-calculated grade, percentage, and comment.
      // This re-triggers Effect 2.
      // We explicitly call loadStudentsAndMarks to refresh the data after a successful save.
     // await loadStudentsAndMarks();

    } catch (err) {
      console.error('Failed to save marks:', err);
      toast.error(err.message || 'Failed to save marks.');
      setError(err.message || 'Failed to save marks.');
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Render loading spinner or error message if global loading/error
  if (loading && (!terms.length || !classSubjects.length || !students.length)) {
    return <Spinner message="Loading data..." />;
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-lg mt-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <FaClipboardList className="text-blue-600" /> Enter Marks
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col">
          <label htmlFor="academicYear" className="text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <input
            type="text"
            id="academicYear"
            value={academicYear}
            onChange={e => setAcademicYear(e.target.value)}
            className="border px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 2025"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="termSelect" className="text-sm font-medium text-gray-700 mb-1">Term</label>
          <select
            id="termSelect"
            value={term}
            onChange={e => setTerm(e.target.value)}
            className="border px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Term</option>
            {terms.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="examTypeSelect" className="text-sm font-medium text-gray-700 mb-1">Exam Type</label>
          <select
            id="examTypeSelect"
            value={examType}
            onChange={e => setExamType(e.target.value)}
            className="border px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Exam Type</option>
            {examTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 flex flex-col">
        <label htmlFor="classSubjectSelect" className="text-sm font-medium text-gray-700 mb-1">Class & Subject</label>
        <select
          id="classSubjectSelect"
          value={selectedClassSubject}
          onChange={e => setSelectedClassSubject(e.target.value)}
          className="border px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Class & Subject</option>
          {classSubjects.map(cs => (
            <option key={cs._id} value={cs._id}>
              {cs.class?.name} - {cs.subject?.name} ({cs.term?.name} {cs.academicYear})
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
          <p>No students are currently enrolled in this class and subject for the selected academic year. Please ensure students are enrolled via the Admin panel.</p>
        </div>
      ) : null}

      {students.length > 0 && selectedClassSubject && examType && (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Marks Obtained</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Total Marks</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Percentage</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map(student => {
                const studentMarks = marks[student._id] || {};
                const percentage = studentMarks.percentage !== null ? studentMarks.percentage : 'N/A';
                const grade = studentMarks.grade || 'N/A';
                
                return (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={studentMarks.marksObtained || ''}
                        onChange={e => handleChange(student._id, 'marksObtained', e.target.value)}
                        className="w-24 border border-gray-300 p-2 rounded focus:border-blue-500 focus:outline-none text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="1"
                        value={studentMarks.outOf || ''}
                        onChange={e => handleChange(student._id, 'outOf', e.target.value)}
                        className="w-24 border border-gray-300 p-2 rounded focus:border-blue-500 focus:outline-none text-center"
                        placeholder="100"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        percentage >= 80 ? 'bg-green-100 text-green-800' :
                        percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        percentage >= 40 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Number(percentage).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                        grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                        grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                        grade.startsWith('D') ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSave(student._id)}
                        disabled={loading || !studentMarks.marksObtained || !studentMarks.outOf}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Save Marks
                      </button>
                    </td>
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
