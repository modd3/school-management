import React, { useState } from 'react';
import { FaChartBar, FaEye, FaTrophy, FaBookOpen, FaCalendarAlt, FaDownload } from 'react-icons/fa';
import { useAuth, useDocumentTitle } from '@/hooks';
import { useGetStudentResultsQuery, useGetStudentProgressQuery } from '@/store/api/resultsApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StudentResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [selectedTerm, setSelectedTerm] = useState('');

  useDocumentTitle('My Results - Student Portal');

  const {
    data: resultsData,
    isLoading: resultsLoading,
    error: resultsError
  } = useGetStudentResultsQuery({
    studentId: user?.profileId,
    academicYear,
    term: selectedTerm
  });

  const {
    data: progressData,
    isLoading: progressLoading
  } = useGetStudentProgressQuery({
    studentId: user?.profileId,
    academicYear
  });

  const results = resultsData?.data || [];
  const progress = progressData?.data || {};

  const calculateTotalMarks = (result: any) => {
    const cat1 = result.cat1?.marks || 0;
    const cat2 = result.cat2?.marks || 0;
    const endterm = result.endterm?.marks || 0;
    return cat1 + cat2 + endterm;
  };

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

  const getOverallStats = () => {
    if (results.length === 0) return { average: 0, gradeDistribution: {}, bestSubject: null };

    const totalMarks = results.reduce((sum, result) => sum + calculateTotalMarks(result), 0);
    const average = totalMarks / results.length;

    const gradeDistribution = results.reduce((acc: any, result) => {
      const grade = result.overallGrade || 'N/A';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    const bestSubject = results.reduce((best, current) => {
      const currentTotal = calculateTotalMarks(current);
      const bestTotal = calculateTotalMarks(best);
      return currentTotal > bestTotal ? current : best;
    });

    return { average, gradeDistribution, bestSubject };
  };

  const stats = getOverallStats();

  const chartData = {
    labels: results.map(r => r.subject?.name || 'Unknown'),
    datasets: [
      {
        label: 'Marks (%)',
        data: results.map(r => calculateTotalMarks(r)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const gradeDistributionData = {
    labels: Object.keys(stats.gradeDistribution),
    datasets: [
      {
        data: Object.values(stats.gradeDistribution),
        backgroundColor: [
          '#10B981', // Green for A
          '#3B82F6', // Blue for B
          '#F59E0B', // Yellow for C
          '#F97316', // Orange for D
          '#EF4444', // Red for E
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  if (resultsLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (resultsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold">Error Loading Results</h3>
        <p className="text-red-600 mt-2">Unable to load your results. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaChartBar className="text-blue-600 text-2xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
              <p className="text-gray-600">View your academic performance and progress</p>
            </div>
          </div>
          <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            <FaDownload />
            <span>Download Report</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {[2024, 2023, 2022].map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>

          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Terms</option>
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <FaChartBar className="text-blue-600 text-2xl" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Average</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.average.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <FaTrophy className="text-yellow-600 text-2xl" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Best Subject</h3>
              <p className="text-lg font-bold text-yellow-600">
                {stats.bestSubject?.subject?.name || 'N/A'}
              </p>
              {stats.bestSubject && (
                <p className="text-sm text-gray-600">
                  {calculateTotalMarks(stats.bestSubject)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3">
            <FaBookOpen className="text-green-600 text-2xl" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Subjects</h3>
              <p className="text-3xl font-bold text-green-600">{results.length}</p>
              <p className="text-sm text-gray-600">Enrolled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
          {results.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="text-center py-8 text-gray-500">No results to display</div>
          )}
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
          {Object.keys(stats.gradeDistribution).length > 0 ? (
            <div className="flex items-center justify-center">
              <div style={{ width: '250px', height: '250px' }}>
                <Doughnut data={gradeDistributionData} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No grades to display</div>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-900">Detailed Results</h3>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-12">
            <FaChartBar className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Results Available</h3>
            <p className="text-gray-500 mt-2">
              {selectedTerm 
                ? 'No results found for the selected term.'
                : 'You don\'t have any exam results yet.'
              }
            </p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{result.subject?.name}</div>
                      <div className="text-sm text-gray-500">Term {result.term}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.overallPoints || '-'}
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

export default StudentResultsPage;
