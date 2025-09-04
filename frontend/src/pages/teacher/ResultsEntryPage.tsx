import React, { useState, useEffect } from 'react';
import { 
  FaClipboardList, FaPlus, FaSearch, FaSave, FaEdit, FaEye,
  FaChartLine, FaFileDownload, FaSyncAlt, FaCheck
} from 'react-icons/fa';
import { useDocumentTitle, useAuth } from '@/hooks';
import { useGetStudentsQuery } from '@/store/api/usersApi';
import { useCreateResultMutation, useCreateBulkResultsMutation } from '@/store/api/resultsApi';
import { toast } from 'react-toastify';

interface ResultFormData {
  studentId: string;
  subjectId: string;
  classId: string;
  academicYear: string;
  termNumber: number;
  examType: 'cat1' | 'cat2' | 'endterm';
  marks: number;
  maxMarks: number;
  teacherComments?: string;
}

const ResultsEntryPage: React.FC = () => {
  useDocumentTitle('Enter Results');
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [selectedExamType, setSelectedExamType] = useState<'cat1' | 'cat2' | 'endterm'>('cat1');
  const [academicYear] = useState<string>('2024');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ResultFormData[]>([]);

  const { 
    data: studentsData, 
    isLoading: studentsLoading,
    refetch: refetchStudents 
  } = useGetStudentsQuery({ 
    page: 1, 
    limit: 100,
    class: selectedClass || undefined,
    search: search.trim() || undefined
  });

  // RTK Query mutations
  const [createBulkResults, { isLoading: isSubmitting }] = useCreateBulkResultsMutation();

  // Mock data for demonstration
  const classes = [
    { _id: '1', name: 'Grade 1A', grade: 1 },
    { _id: '2', name: 'Grade 2B', grade: 2 },
    { _id: '3', name: 'Grade 3C', grade: 3 },
  ];

  const subjects = [
    { _id: '1', name: 'Mathematics', code: 'MATH' },
    { _id: '2', name: 'English', code: 'ENG' },
    { _id: '3', name: 'Science', code: 'SCI' },
    { _id: '4', name: 'Social Studies', code: 'SS' },
  ];

  const examTypes = [
    { value: 'cat1', label: 'CAT 1', maxMarks: 30 },
    { value: 'cat2', label: 'CAT 2', maxMarks: 30 },
    { value: 'endterm', label: 'End Term', maxMarks: 70 },
  ];

  const getCurrentMaxMarks = () => {
    const examType = examTypes.find(et => et.value === selectedExamType);
    return examType?.maxMarks || 100;
  };

  // Initialize results when dependencies change
  useEffect(() => {
    const students = studentsData?.data || [];
    
    if (!selectedClass || !selectedSubject || !students.length) {
      setResults([]);
      return;
    }

    const newResults: ResultFormData[] = students.map(student => ({
      studentId: student._id,
      subjectId: selectedSubject,
      classId: selectedClass,
      academicYear,
      termNumber: selectedTerm,
      examType: selectedExamType,
      marks: 0,
      maxMarks: getCurrentMaxMarks(),
      teacherComments: ''
    }));

    setResults(newResults);
  }, [selectedClass, selectedSubject, selectedTerm, selectedExamType, studentsData?.data, academicYear]);

  const handleMarksChange = (studentId: string, marks: number) => {
    setResults(prev => 
      prev.map(result => 
        result.studentId === studentId 
          ? { ...result, marks: Math.min(marks, result.maxMarks) }
          : result
      )
    );
  };

  const handleCommentsChange = (studentId: string, comments: string) => {
    setResults(prev => 
      prev.map(result => 
        result.studentId === studentId 
          ? { ...result, teacherComments: comments }
          : result
      )
    );
  };

  const handleSubmitResults = async () => {
    if (!selectedClass || !selectedSubject) {
      toast.error('Please select class and subject');
      return;
    }

    const validResults = results.filter(result => result.marks > 0);
    
    if (validResults.length === 0) {
      toast.error('Please enter marks for at least one student');
      return;
    }

    try {
      const response = await createBulkResults(validResults).unwrap();
      
      toast.success(`Successfully submitted results for ${validResults.length} students`);
      
      // Reset results after successful submission - clear marks
      setResults(prev => prev.map(result => ({
        ...result,
        marks: 0,
        teacherComments: ''
      })));
      
    } catch (error: any) {
      console.error('Error submitting results:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to submit results. Please try again.';
      toast.error(errorMessage);
    }
  };

  const getGradeFromPercentage = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'B-';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 30) return 'C-';
    if (percentage >= 20) return 'D+';
    if (percentage >= 10) return 'D';
    return 'E';
  };

  const calculatePercentage = (marks: number, maxMarks: number): number => {
    return maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Enter Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Enter student examination marks and grades
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetchStudents()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <FaSyncAlt className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Selection Criteria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Term 1</option>
              <option value={2}>Term 2</option>
              <option value={3}>Term 3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam Type
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value as 'cat1' | 'cat2' | 'endterm')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {examTypes.map(examType => (
                <option key={examType.value} value={examType.value}>
                  {examType.label} (/{examType.maxMarks})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClass && selectedSubject && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <FaCheck className="inline w-4 h-4 mr-2" />
              Ready to enter marks for <strong>{subjects.find(s => s._id === selectedSubject)?.name}</strong> 
              {' '}- <strong>{classes.find(c => c._id === selectedClass)?.name}</strong>
              {' '}- <strong>Term {selectedTerm}</strong>
              {' '}- <strong>{examTypes.find(et => et.value === selectedExamType)?.label}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      {selectedClass && selectedSubject && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSubmitResults}
                disabled={isSubmitting || results.filter(r => r.marks > 0).length === 0}
                className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4 mr-2" />
                    Submit Results
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Entry Table */}
      {selectedClass && selectedSubject && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Enter Marks - {examTypes.find(et => et.value === selectedExamType)?.label} 
              (Max: {getCurrentMaxMarks()} marks)
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Admission No.
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Marks
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Comments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {studentsLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="ml-4">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="h-8 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="h-6 bg-gray-200 rounded w-8 mx-auto animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : (studentsData?.data || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FaClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No students found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Please select a class to view students.
                      </p>
                    </td>
                  </tr>
                ) : (
                  (studentsData?.data || []).map((student) => {
                    const result = results.find(r => r.studentId === student._id);
                    const percentage = result ? calculatePercentage(result.marks, result.maxMarks) : 0;
                    const grade = getGradeFromPercentage(percentage);
                    
                    return (
                      <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {student.otherNames}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {student.admissionNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              max={getCurrentMaxMarks()}
                              value={result?.marks || 0}
                              onChange={(e) => handleMarksChange(student._id, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="ml-2 text-sm text-gray-500">/{getCurrentMaxMarks()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            grade === 'A' ? 'bg-green-100 text-green-800' :
                            grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                            grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                            grade.startsWith('D') ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="Teacher comments..."
                            value={result?.teacherComments || ''}
                            onChange={(e) => handleCommentsChange(student._id, e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedClass && selectedSubject && results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{(studentsData?.data || []).length}</div>
              <div className="text-sm text-gray-500">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {results.filter(r => r.marks > 0).length}
              </div>
              <div className="text-sm text-gray-500">Marks Entered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {results.filter(r => r.marks === 0).length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {results.filter(r => r.marks > 0).length > 0 
                  ? (results.filter(r => r.marks > 0).reduce((sum, r) => sum + calculatePercentage(r.marks, r.maxMarks), 0) / results.filter(r => r.marks > 0).length).toFixed(1)
                  : 0}%
              </div>
              <div className="text-sm text-gray-500">Class Average</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsEntryPage;
