import React, { useState, useEffect } from 'react';
import { FaChalkboardTeacher, FaEdit, FaTrashAlt, FaSearch, FaPlusCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getTeachers, deleteTeacher } from '../../api/teachers'; 

export default function ManageTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Function to load teachers from the API
  const loadTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeachers(); 
      setTeachers(data.teachers || []); 
    } catch (err) {
      console.error("Failed to load teachers:", err);
      setError(err.message || 'Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  };

  // Load teachers on component mount
  useEffect(() => {
    loadTeachers();
  }, []);

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await deleteTeacher(teacherId); // Use the real API call
        setTeachers(teachers.filter(teacher => teacher._id !== teacherId));
      } catch (err) {
        console.error("Failed to delete teacher:", err);
        setError(err.message || 'Failed to delete teacher.');
      }
    }
  };

  const handleEditTeacher = (teacherId) => {
    navigate(`/admin/teachers/edit/${teacherId}`); // You'll need to create this route and page
  };

  const handleAddTeacher = () => {
    navigate('/admin/create-user'); // Re-use create user page, or create a dedicated add teacher page
  };

  const filteredTeachers = teachers.filter(teacher =>
    (teacher.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (teacher.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (teacher.teacherId?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (teacher.subjects?.some(subject => subject.name?.toLowerCase().includes(searchTerm.toLowerCase())) || '') // Assuming subjects is an array of objects with 'name'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading teachers...</p>
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
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaChalkboardTeacher className="text-blue-600"/> Manage Teachers
          </h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search teachers..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18}/>
            </div>
            <button
              onClick={handleAddTeacher}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <FaPlusCircle /> Add Teacher
            </button>
          </div>
        </div>

        {filteredTeachers.length === 0 ? (
          <p className="text-center text-gray-600">No teachers found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.teacherId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{teacher.subjects?.map(sub => sub.name).join(', ') || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                      <button
                        onClick={() => handleEditTeacher(teacher._id)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        title="Edit Teacher"
                      >
                        <FaEdit size={18}/>
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher._id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                        title="Delete Teacher"
                      >
                        <FaTrashAlt size={18}/>
                      </button>
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