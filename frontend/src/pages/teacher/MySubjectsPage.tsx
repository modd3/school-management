import React, { useState } from 'react';
import { FaBook, FaUsers, FaChartBar, FaCalendarAlt, FaSearch, FaFilter } from 'react-icons/fa';
import { useAuth, useDocumentTitle } from '@/hooks';
import { useGetTeacherSubjectsQuery } from '@/store/api/classSubjectsApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const MySubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  useDocumentTitle('My Subjects - Teacher Portal');

  const {
    data: subjectsData,
    isLoading,
    error,
    refetch
  } = useGetTeacherSubjectsQuery({
    teacherId: user?.profileId,
    academicYear
  });

  const subjects = subjectsData?.data || [];

  const filteredSubjects = subjects.filter(classSubject =>
    classSubject.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classSubject.class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classSubject.class?.stream?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSubjectStats = (classSubject: any) => {
    return {
      enrolledStudents: classSubject.enrolledStudents?.length || 0,
      totalLessons: classSubject.weeklyLessons || 0,
      category: classSubject.subject?.category || 'N/A'
    };
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'core': return 'bg-blue-100 text-blue-800';
      case 'elective': return 'bg-green-100 text-green-800';
      case 'extra': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <h3 className="text-red-800 font-semibold">Error Loading Subjects</h3>
        <p className="text-red-600 mt-2">Unable to load your assigned subjects. Please try again.</p>
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
            <FaBook className="text-blue-600 text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
              <p className="text-gray-600">Subjects assigned to you for teaching</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{subjects.length}</p>
            <p className="text-sm text-gray-600">Assigned Subjects</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects or classes..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[2024, 2023, 2022].map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaFilter />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FaBook className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No Subjects Found</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm 
              ? 'Try adjusting your search terms.'
              : 'No subjects have been assigned to you for this academic year.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((classSubject) => {
            const stats = getSubjectStats(classSubject);
            return (
              <div key={classSubject._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FaBook className="text-blue-600 text-xl" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{classSubject.subject?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {classSubject.class?.name} {classSubject.class?.stream}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(stats.category)}`}>
                    {stats.category}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaUsers className="text-gray-400 text-sm" />
                      <span className="text-sm text-gray-600">Students Enrolled</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stats.enrolledStudents}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt className="text-gray-400 text-sm" />
                      <span className="text-sm text-gray-600">Weekly Lessons</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stats.totalLessons}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaChartBar className="text-gray-400 text-sm" />
                      <span className="text-sm text-gray-600">Academic Year</span>
                    </div>
                    <span className="font-semibold text-gray-900">{classSubject.academicYear}</span>
                  </div>
                </div>

                <div className="border-t pt-4 flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Enter Results
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    View Reports
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySubjectsPage;
