import React, { useState } from 'react';
import { FaChild, FaChartLine, FaTrophy, FaEye, FaCalendarAlt, FaBookOpen } from 'react-icons/fa';
import { useAuth, useDocumentTitle } from '@/hooks';
import { useGetParentChildrenQuery, useGetChildProgressQuery } from '@/store/api/resultsApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChildrenProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  useDocumentTitle('Children Progress - Parent Portal');

  const {
    data: childrenData,
    isLoading: childrenLoading,
    error: childrenError
  } = useGetParentChildrenQuery(user?.profileId);

  const {
    data: progressData,
    isLoading: progressLoading,
    error: progressError
  } = useGetChildProgressQuery({
    parentId: user?.profileId,
    studentId: selectedChild,
    academicYear
  }, { skip: !selectedChild });

  const children = childrenData?.data || [];
  const progress = progressData?.data || {};

  // Auto-select first child if none selected
  React.useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]._id);
    }
  }, [children, selectedChild]);

  const selectedChildData = children.find(child => child._id === selectedChild);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'C': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'D': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'E': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const calculateTotalMarks = (result: any) => {
    const cat1 = result.cat1?.marks || 0;
    const cat2 = result.cat2?.marks || 0;
    const endterm = result.endterm?.marks || 0;
    return cat1 + cat2 + endterm;
  };

  const getProgressChart = () => {
    if (!progress.termProgress || progress.termProgress.length === 0) return null;

    const chartData = {
      labels: progress.termProgress.map((term: any) => `Term ${term.term}`),
      datasets: [
        {
          label: 'Average Score (%)',
          data: progress.termProgress.map((term: any) => term.averageScore || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Class Average (%)',
          data: progress.termProgress.map((term: any) => term.classAverage || 0),
          borderColor: 'rgb(156, 163, 175)',
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          tension: 0.1,
          borderDash: [5, 5],
        }
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    };

    return <Line data={chartData} options={options} />;
  };

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (childrenError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Error Loading Children</h3>
        <p className="text-red-600 mt-2">Unable to load your children's data. Please try again.</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <FaChild className="mx-auto text-6xl text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600">No Children Found</h3>
        <p className="text-gray-500 mt-2">You don't have any children enrolled in the system.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaChild className="text-blue-600 text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Children Progress</h1>
              <p className="text-gray-600">Monitor your children's academic performance</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{children.length}</p>
            <p className="text-sm text-gray-600">{children.length === 1 ? 'Child' : 'Children'}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a child...</option>
              {children.map(child => (
                <option key={child._id} value={child._id}>
                  {child.firstName} {child.lastName} - {child.currentClass?.name} {child.currentClass?.stream}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[2024, 2023, 2022].map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedChild ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FaChild className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">Select a Child</h3>
          <p className="text-gray-500 mt-2">Choose a child from the dropdown above to view their progress.</p>
        </div>
      ) : (
        <>
          {/* Child Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {selectedChildData?.studentPhotoUrl ? (
                  <img 
                    src={selectedChildData.studentPhotoUrl} 
                    alt="Student" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-blue-600 font-bold">
                    {selectedChildData?.firstName?.[0]}{selectedChildData?.lastName?.[0]}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedChildData?.firstName} {selectedChildData?.lastName}
                </h3>
                <p className="text-gray-600">{selectedChildData?.admissionNumber}</p>
                <p className="text-blue-600 font-medium">
                  {selectedChildData?.currentClass?.name} {selectedChildData?.currentClass?.stream}
                </p>
              </div>
            </div>

            {/* Progress Stats */}
            {progressLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : progressError ? (
              <div className="text-center py-8 text-red-600">
                Failed to load progress data
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <FaChartLine className="mx-auto text-blue-600 text-2xl mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{progress.overallAverage?.toFixed(1) || '0.0'}%</p>
                  <p className="text-sm text-blue-600">Overall Average</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <FaTrophy className="mx-auto text-green-600 text-2xl mb-2" />
                  <p className="text-2xl font-bold text-green-900">{progress.classRank || 'N/A'}</p>
                  <p className="text-sm text-green-600">Class Rank</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <FaBookOpen className="mx-auto text-purple-600 text-2xl mb-2" />
                  <p className="text-2xl font-bold text-purple-900">{progress.totalSubjects || 0}</p>
                  <p className="text-sm text-purple-600">Subjects</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <FaCalendarAlt className="mx-auto text-yellow-600 text-2xl mb-2" />
                  <p className="text-lg font-bold text-yellow-900">{progress.currentTerm || 'N/A'}</p>
                  <p className="text-sm text-yellow-600">Current Term</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Academic Progress Trend</h3>
            {getProgressChart() || (
              <div className="text-center py-8 text-gray-500">
                No progress data available for chart
              </div>
            )}
          </div>

          {/* Recent Results */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900">Recent Results</h3>
            </div>

            {!progress.recentResults || progress.recentResults.length === 0 ? (
              <div className="text-center py-12">
                <FaBookOpen className="mx-auto text-6xl text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No Recent Results</h3>
                <p className="text-gray-500 mt-2">No recent exam results available for this student.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Term
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CAT1 (30)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CAT2 (30)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endterm (40)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total (100)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {progress.recentResults.map((result: any) => (
                      <tr key={result._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{result.subject?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Term {result.term}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.cat1?.marks || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.cat2?.marks || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.endterm?.marks || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {calculateTotalMarks(result)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getGradeColor(result.overallGrade)}`}>
                            {result.overallGrade || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChildrenProgressPage;
