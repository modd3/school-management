import React, { useState } from 'react';
import { FaFileAlt, FaEdit, FaEye, FaFilter, FaSearch, FaDownload } from 'react-icons/fa';
import { useAuth, useDocumentTitle, useNotifications } from '@/hooks';
import { useGetResultsByTeacherQuery } from '@/store/api/resultsApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface FilterState {
  academicYear: string;
  term: string;
  classId: string;
  subjectId: string;
}

const MyResultsPage: React.FC = () => {
  const { user } = useAuth();
  const { error: notifyError } = useNotifications();
  const [filters, setFilters] = useState<FilterState>({
    academicYear: new Date().getFullYear().toString(),
    term: '',
    classId: '',
    subjectId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useDocumentTitle('My Results - Teacher Portal');

  const {
    data: resultsData,
    isLoading,
    error,
    refetch
  } = useGetResultsByTeacherQuery({
    teacherId: user?.profileId,
    ...filters
  });

  const results = resultsData?.data || [];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredResults = results.filter(result =>
    result.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.student?.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.class?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalMarks = (result: any) => {
    const cat1 = result.cat1?.marks || 0;
    const cat2 = result.cat2?.marks || 0;
    const endterm = result.endterm?.marks || 0;
    return cat1 + cat2 + endterm;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'E': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Error Loading Results</h3>
        <p className="text-red-600 mt-2">Unable to load your entered results. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaFileAlt className="text-blue-600 text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
              <p className="text-gray-600">View and manage results you have entered</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{results.length}</p>
            <p className="text-sm text-gray-600">Total Results</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students or subjects..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filters.academicYear}
            onChange={(e) => handleFilterChange('academicYear', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Years</option>
            {[2024, 2023, 2022].map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>

          <select
            value={filters.term}
            onChange={(e) => handleFilterChange('term', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Terms</option>
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>

          <button className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            <FaDownload />
            <span>Export</span>
          </button>

          <button
            onClick={() => refetch()}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaFilter />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <FaFileAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Results Found</h3>
            <p className="text-gray-500 mt-2">
              {searchTerm || Object.values(filters).some(Boolean) 
                ? 'Try adjusting your search or filters.'
                : 'You haven\'t entered any results yet.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CAT1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CAT2
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endterm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <tr key={result._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {result.student?.firstName} {result.student?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.student?.admissionNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.class?.name} {result.class?.stream}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.subject?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.cat1?.marks || '-'}/{result.cat1?.outOf || 30}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.cat2?.marks || '-'}/{result.cat2?.outOf || 30}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.endterm?.marks || '-'}/{result.endterm?.outOf || 40}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {calculateTotalMarks(result)}/100
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.overallGrade)}`}>
                        {result.overallGrade || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit Result"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyResultsPage;
