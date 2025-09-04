import React, { useEffect, useState, useMemo } from 'react';
import { FaBookOpen, FaFilter, FaSpinner, FaSearch, FaTimes, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getResultsByTeacher } from '../../api/results'; // Updated to match your API function name
import { getMyClassSubjects } from '../../api/classSubjects';
import { getTeacherTerms } from '../../api/terms';
import { toast } from 'react-toastify';

export default function TeacherResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [teacherAssignedClassSubjects, setTeacherAssignedClassSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filterClassSubject, setFilterClassSubject] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState(new Date().getFullYear().toString());
  const [filterExamType, setFilterExamType] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting states
  const [sortBy, setSortBy] = useState('studentName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Load filter options (terms and teacher's assigned class-subjects)
  useEffect(() => {
    async function loadInitialData() {
      if (!user || !user._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch terms
        const termsRes = await getTeacherTerms();
        setTerms(termsRes.terms || []);

        // Fetch class subjects assigned to the logged-in teacher
        // Pass current filter values to get relevant class subjects
        const classSubjectsRes = await getMyClassSubjects(filterTerm, filterAcademicYear);
        setTeacherAssignedClassSubjects(classSubjectsRes.classSubjects || []);

      } catch (err) {
        toast.error('Failed to load filter options.');
        console.error('Error loading initial data:', err);
        setError(err.message || 'Failed to load initial data.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [user, filterTerm, filterAcademicYear]);

  // Load results based on filters
  useEffect(() => {
    async function fetchResults() {
      if (!user || !user._id) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        
        // Add filters to query params
        if (filterClassSubject) {
          queryParams.append('classSubjectId', filterClassSubject);
        }
        if (filterTerm) {
          queryParams.append('termId', filterTerm);
        }
        if (filterAcademicYear) {
          queryParams.append('academicYear', filterAcademicYear);
        }
        if (filterExamType) {
          queryParams.append('examType', filterExamType);
        }
        if (searchStudent.trim()) {
          queryParams.append('search', searchStudent.trim());
        }

        // Call the API with the constructed query string
        const res = await getResultsByTeacher(queryParams.toString());
        setResults(res.results || []);
      } catch (err) {
        console.error('[TeacherResultsPage] Fetch results error:', err);
        setError(err.message || 'Failed to fetch results');
        toast.error(err.message || 'Failed to fetch results');
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [user, filterClassSubject, filterTerm, filterAcademicYear, filterExamType, searchStudent]);

  // Get unique values from results for filter dropdowns
  const filterOptions = useMemo(() => {
    const academicYears = [...new Set(results.map(r => r.academicYear?.toString()).filter(Boolean))];
    const examTypes = [...new Set(results.map(r => r.examType).filter(Boolean))];
    
    return {
      academicYears: academicYears.sort((a, b) => b.localeCompare(a)), // Latest year first
      examTypes: examTypes.sort()
    };
  }, [results]);

  // Enhanced sorting logic
  const sortedResults = useMemo(() => {
    if (!results.length) return [];

    const sorted = [...results].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'studentName':
          aValue = `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.toLowerCase();
          bValue = `${b.student?.firstName || ''} ${b.student?.lastName || ''}`.toLowerCase();
          break;
        case 'admissionNumber':
          aValue = a.student?.admissionNumber || '';
          bValue = b.student?.admissionNumber || '';
          break;
        case 'className':
          aValue = a.class?.name?.toLowerCase() || '';
          bValue = b.class?.name?.toLowerCase() || '';
          break;
        case 'subjectName':
          aValue = a.subject?.name?.toLowerCase() || '';
          bValue = b.subject?.name?.toLowerCase() || '';
          break;
        case 'termName':
          aValue = a.term?.name?.toLowerCase() || '';
          bValue = b.term?.name?.toLowerCase() || '';
          break;
        case 'examType':
          aValue = a.examType?.toLowerCase() || '';
          bValue = b.examType?.toLowerCase() || '';
          break;
        case 'marksObtained':
          aValue = a.marksObtained || 0;
          bValue = b.marksObtained || 0;
          break;
        case 'percentage':
          aValue = a.percentage || 0;
          bValue = b.percentage || 0;
          break;
        case 'grade':
          aValue = a.grade?.toLowerCase() || '';
          bValue = b.grade?.toLowerCase() || '';
          break;
        case 'points':
          aValue = a.points || 0;
          bValue = b.points || 0;
          break;
        case 'academicYear':
          aValue = a.academicYear || '';
          bValue = b.academicYear || '';
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return sorted;
  }, [results, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    if (!results.length) return { totalResults: 0, avgPercentage: 0, gradeDistribution: {} };

    const totalResults = results.length;
    const avgPercentage = results.reduce((sum, result) => sum + (result.percentage || 0), 0) / totalResults;
    
    const gradeDistribution = results.reduce((acc, result) => {
      const grade = result.grade || 'N/A';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    return {
      totalResults,
      avgPercentage: avgPercentage.toFixed(1),
      gradeDistribution
    };
  }, [results]);

  // Clear all filters
  const clearFilters = () => {
    setFilterClassSubject('');
    setFilterTerm('');
    setFilterAcademicYear(new Date().getFullYear().toString());
    setFilterExamType('');
    setSearchStudent('');
    setSortBy('studentName');
    setSortOrder('asc');
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-400" />;
    return sortOrder === 'asc' ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-blue-600 text-4xl mr-3" />
        <p className="text-xl text-gray-700">Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <div className="text-red-600 text-xl mb-4">Error: {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl max-w-7xl mx-auto mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaBookOpen className="text-blue-600" /> My Results
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {sortedResults.length} results found
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaFilter />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">Total Results</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.totalResults}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-1">Average Percentage</h3>
          <p className="text-2xl font-bold text-green-900">{stats.avgPercentage}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-800 mb-1">Grade Distribution</h3>
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
              <span key={grade} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                {grade}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {/* Student Search */}
            <div className="relative lg:col-span-2">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search student name or admission number..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Combined Class & Subject Filter */}
            <select
              value={filterClassSubject}
              onChange={(e) => setFilterClassSubject(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes & Subjects</option>
              {teacherAssignedClassSubjects.map(cs => (
                <option key={cs._id} value={cs._id}>
                  {cs.class?.name} - {cs.subject?.name} ({cs.academicYear})
                </option>
              ))}
            </select>

            {/* Term Filter */}
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Terms</option>
              {terms.map(term => (
                <option key={term._id} value={term._id}>{term.name}</option>
              ))}
            </select>

            {/* Academic Year Filter */}
            <select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {filterOptions.academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Exam Type Filter */}
            <select
              value={filterExamType}
              onChange={(e) => setFilterExamType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Exam Types</option>
              {filterOptions.examTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="studentName-asc">Student Name (A-Z)</option>
              <option value="studentName-desc">Student Name (Z-A)</option>
              <option value="className-asc">Class (A-Z)</option>
              <option value="className-desc">Class (Z-A)</option>
              <option value="subjectName-asc">Subject (A-Z)</option>
              <option value="subjectName-desc">Subject (Z-A)</option>
              <option value="percentage-desc">Percentage (High-Low)</option>
              <option value="percentage-asc">Percentage (Low-High)</option>
              <option value="marksObtained-desc">Marks (High-Low)</option>
              <option value="marksObtained-asc">Marks (Low-High)</option>
              <option value="academicYear-desc">Year (Recent First)</option>
              <option value="academicYear-asc">Year (Oldest First)</option>
            </select>

            {/* Clear Filters Button */}
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <FaTimes />
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Table */}
      {sortedResults.length === 0 ? (
        <div className="text-center py-12">
          <FaBookOpen className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-xl text-gray-600 mb-2">No results found</p>
          <p className="text-gray-500">
            {teacherAssignedClassSubjects.length === 0
              ? "You don't have any class subjects assigned. Please contact the administrator."
              : "Try adjusting your filters or enter marks for your assigned subjects."
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('studentName')}
                >
                  <div className="flex items-center gap-1">
                    Student {getSortIcon('studentName')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('className')}
                >
                  <div className="flex items-center gap-1">
                    Class {getSortIcon('className')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('subjectName')}
                >
                  <div className="flex items-center gap-1">
                    Subject {getSortIcon('subjectName')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('termName')}
                >
                  <div className="flex items-center gap-1">
                    Term {getSortIcon('termName')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('examType')}
                >
                  <div className="flex items-center gap-1">
                    Exam {getSortIcon('examType')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('marksObtained')}
                >
                  <div className="flex items-center gap-1">
                    Marks {getSortIcon('marksObtained')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('percentage')}
                >
                  <div className="flex items-center gap-1">
                    % {getSortIcon('percentage')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('grade')}
                >
                  <div className="flex items-center gap-1">
                    Grade {getSortIcon('grade')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('points')}
                >
                  <div className="flex items-center gap-1">
                    Points {getSortIcon('points')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('academicYear')}
                >
                  <div className="flex items-center gap-1">
                    Year {getSortIcon('academicYear')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedResults.map((result, index) => (
                <tr key={result._id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {result.student?.firstName} {result.student?.lastName}
                      </div>
                      {result.student?.admissionNumber && (
                        <div className="text-xs text-gray-500">
                          {result.student.admissionNumber}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {result.class?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {result.subject?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {result.term?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      result.examType === 'Opener' ? 'bg-blue-100 text-blue-800' :
                      result.examType === 'Midterm' ? 'bg-yellow-100 text-yellow-800' :
                      result.examType === 'Endterm' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {result.examType}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-medium">{result.marksObtained}</span>
                    <span className="text-gray-500">/{result.outOf}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-medium ${
                      result.percentage >= 75 ? 'text-green-600' :
                      result.percentage >= 60 ? 'text-blue-600' :
                      result.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result.percentage?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ['A', 'A+'].includes(result.grade) ? 'bg-green-100 text-green-800' :
                      ['B', 'B+'].includes(result.grade) ? 'bg-blue-100 text-blue-800' :
                      ['C', 'C+'].includes(result.grade) ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {result.points}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {result.academicYear}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}