// frontend/src/pages/teacher/TeacherSubjectsPage.jsx
import React, { useState, useEffect } from 'react';
import { FaChalkboardTeacher, FaBookOpen, FaCalendarAlt, FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { getMyClassSubjects } from '../../api/classSubjects'; // Assuming you create this API call
import { getTerms } from '../../api/terms'; // To populate term dropdown
import { toast } from 'react-toastify'; // For notifications

export default function TeacherSubjectsPage() {
  const { user } = useAuth();
  const [classSubjects, setClassSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString()); // Default to current year

  useEffect(() => {
    async function loadTerms() {
      try {
        const res = await getTerms();
        setTerms(res.terms || []);
        // Optionally set a default term if available and not already selected
        // For now, let's just leave it blank or set the first one if needed
        // if (!selectedTerm && res.terms.length > 0) {
        //   setSelectedTerm(res.terms[0]._id);
        // }
      } catch (err) {
        toast.error('Failed to load terms.');
        console.error('Error loading terms:', err);
      }
    }
    loadTerms();
  }, []);

  useEffect(() => {
    async function fetchMySubjects() {
      if (!user || !user._id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (selectedTerm) {
          queryParams.append('term', selectedTerm);
        }
        if (academicYear) {
          queryParams.append('academicYear', academicYear);
        }

        // Make sure your getMyClassSubjects API function accepts query parameters
        const res = await getMyClassSubjects(queryParams.toString()); // Pass query string
        setClassSubjects(res.classSubjects || []);
      } catch (err) {
        console.error('Failed to fetch teacher subjects:', err);
        setError(err.message || 'Failed to load your assigned subjects.');
        toast.error(err.message || 'Failed to load your assigned subjects.');
      } finally {
        setLoading(false);
      }
    }

    fetchMySubjects();
  }, [user, selectedTerm, academicYear]); // Re-run when user, term, or year changes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading your subjects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <p className="text-xl text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaChalkboardTeacher className="text-blue-600"/> My Assigned Subjects
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <input
              type="text"
              id="academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g., 2024-2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="termSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Term</label>
            <select
              id="termSelect"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Terms</option>
              {terms.map(term => (
                <option key={term._id} value={term._id}>{term.name}</option>
              ))}
            </select>
          </div>
        </div>


        {classSubjects.length === 0 ? (
          <p className="text-center text-gray-600">No subjects assigned to you for the selected period.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classSubjects.map((cs) => (
                  <tr key={cs._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <FaGraduationCap className="inline-block mr-2 text-gray-500" />{cs.class?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <FaBookOpen className="inline-block mr-2 text-gray-500" />{cs.subject?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{cs.subject?.code || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{cs.academicYear}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <FaCalendarAlt className="inline-block mr-2 text-gray-500" />{cs.term?.name || 'N/A'}
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
}
