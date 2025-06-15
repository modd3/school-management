import React, { useState, useEffect } from 'react';
import { FaLaptopHouse, FaEdit, FaTrashAlt, FaSearch, FaPlusCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getClasses, createClass, deleteClass, assignClassTeacher } from '../../api/classes'; // Add assignClassTeacher API
import { getTeachers } from '../../api/teachers'; // You need to implement this API call

export default function ManageClassesPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const navigate = useNavigate();

  // Load classes and teachers on mount
  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClasses();
      setClasses(data.classes || []);
    } catch (err) {
      setError(err.message || 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await getTeachers();
      // Only class teachers
      setTeachers((data.teachers || []).filter(t => t.teacherType === 'class_teacher'));
    } catch (err) {
      // Optionally handle error
      console.log(err)
    }
  };

  const handleAssignTeacher = async (classId, teacherId) => {
    try {
      await assignClassTeacher(classId, teacherId);
      loadClasses(); // Refresh classes to show updated teacher
    } catch (err) {
      setError('Failed to assign class teacher.');
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      setError("Class name cannot be empty.");
      return;
    }
    try {
      const newClassData = { name: newClassName.trim() };
      const data = await createClass(newClassData); // Use the real API call
      setClasses([...classes, data.class]); // Assuming backend returns { success: true, class: { ... } }
      setNewClassName(''); // Clear input field
      setError(null);
      // You might want to display a success message
    } catch (err) {
      console.error("Failed to add class:", err);
      setError(err.message || 'Failed to add class.');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone and may affect linked students/teachers.')) {
      try {
        await deleteClass(classId); // Use the real API call
        setClasses(classes.filter(_class => _class._id !== classId));
      } catch (err) {
        console.error("Failed to delete class:", err);
        setError(err.message || 'Failed to delete class.');
      }
    }
  };

  const handleEditClass = (classId) => {
    navigate(`/admin/classes/edit/${classId}`); // You'll need to create this route and page for editing
  };

  const filteredClasses = classes.filter(_class =>
    (_class.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (_class.classTeacher?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (_class.classTeacher?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading classes...</p>
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
            <FaLaptopHouse className="text-blue-600"/> Manage Classes
          </h1>
          <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search classes..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18}/>
          </div>
        </div>

        <form onSubmit={handleAddClass} className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="New Class Name (e.g., Grade 1A)"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className="flex-grow py-2 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
          >
            <FaPlusCircle /> Add Class
          </button>
        </form>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {filteredClasses.length === 0 ? (
          <p className="text-center text-gray-600">No classes found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Teacher</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.map((_class) => (
                  <tr key={_class._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{_class.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <select
                        value={_class.classTeacher?._id || ''}
                        onChange={e => handleAssignTeacher(_class._id, e.target.value)}
                        className="py-1 px-2 border rounded"
                      >
                        <option value="">Assign Class Teacher</option>
                        {teachers.map(teacher => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.firstName} {teacher.lastName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                      <button
                        onClick={() => handleEditClass(_class._id)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        title="Edit Class"
                      >
                        <FaEdit size={18}/>
                      </button>
                      <button
                        onClick={() => handleDeleteClass(_class._id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                        title="Delete Class"
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