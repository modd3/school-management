import React, { useState, useEffect } from 'react';
import { FaBookOpen, FaEdit, FaTrashAlt, FaSearch, FaPlusCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getSubjects, createSubject, deleteSubject } from '../../api/subjects'; 

export default function ManageSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const navigate = useNavigate();

  // Function to load subjects from the API
  const loadSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubjects(); 
      setSubjects(data.subjects || []); 
    } catch (err) {
      console.error("Failed to load subjects:", err);
      setError(err.message || 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  // Load subjects on component mount
  useEffect(() => {
    loadSubjects();
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      setError("Subject name cannot be empty.");
      return;
    }
    try {
      const newSubjectData = { name: newSubjectName.trim() };
      const data = await createSubject(newSubjectData); // Use the real API call
      setSubjects([...subjects, data.subject]); // Assuming backend returns { success: true, subject: { ... } }
      setNewSubjectName(''); // Clear input field
      setError(null);
    } catch (err) {
      console.error("Failed to add subject:", err);
      setError(err.message || 'Failed to add subject.');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteSubject(subjectId); // Use the real API call
        setSubjects(subjects.filter(subject => subject._id !== subjectId));
      } catch (err) {
        console.error("Failed to delete subject:", err);
        setError(err.message || 'Failed to delete subject.');
      }
    }
  };

  const handleEditSubject = (subjectId) => {
    navigate(`/admin/subjects/edit/${subjectId}`); // You'll need to create this route and page for editing
  };

  const filteredSubjects = subjects.filter(subject =>
    (subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading subjects...</p>
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
            <FaBookOpen className="text-blue-600"/> Manage Subjects
          </h1>
          <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search subjects..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18}/>
          </div>
        </div>

        <form onSubmit={handleAddSubject} className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="New Subject Name (e.g., Chemistry)"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="flex-grow py-2 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <FaPlusCircle /> Add Subject
          </button>
        </form>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {filteredSubjects.length === 0 ? (
          <p className="text-center text-gray-600">No subjects found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubjects.map((subject) => (
                  <tr key={subject._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{subject.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                      <button
                        onClick={() => handleEditSubject(subject._id)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        title="Edit Subject"
                      >
                        <FaEdit size={18}/>
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subject._id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                        title="Delete Subject"
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