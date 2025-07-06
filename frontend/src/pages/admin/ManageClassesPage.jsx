import React, { useState, useEffect } from 'react';
import { FaLaptopHouse, FaEdit, FaTrashAlt, FaSearch, FaPlusCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getClasses, createClass, deleteClass, assignClassTeacher } from '../../api/classes';
import { getTeachers } from '../../api/teachers';

export default function ManageClassesPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassStream, setNewClassStream] = useState('');
  const navigate = useNavigate();

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
      console.log(data);
      setTeachers((data.teachers || []).filter(t => t.teacherType === 'class_teacher'));
    } catch (err) {
      console.error(err);
    }
  };

const handleAssignTeacher = async (classId, teacherId) => {
  console.log('📤 Assigning teacher:', teacherId, 'to class:', classId); // ← ADD THIS

  try {
    await assignClassTeacher(classId, teacherId);
    loadClasses(); // Refresh classes to show updated teacher
  } catch (err) {
    setError('Failed to assign class teacher.');
    console.error('❌ Assign teacher error:', err); // ← Log error
  }
};

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return setError("Class name is required.");
    if (!newClassStream.trim()) return setError("Class stream is required.");

    try {
      const newClassData = {
        name: newClassName.trim(),
        stream: [newClassStream.trim()]
      };
      const data = await createClass(newClassData);
      setClasses([...classes, data.class]);
      setNewClassName('');
      setNewClassStream('');
      setError(null);
    } catch (err) {
      console.error("Add class error:", err);
      setError(err.message || 'Failed to add class.');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm('Delete this class? This cannot be undone.')) {
      try {
        await deleteClass(classId);
        setClasses(classes.filter(_class => _class._id !== classId));
      } catch (err) {
        setError(err.message || 'Failed to delete class.');
      }
    }
  };

  const handleEditClass = (classId) => {
    navigate(`/admin/classes/edit/${classId}`);
  };

  const filteredClasses = classes.filter(_class =>
    (_class.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (_class.stream?.join(', ')?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaLaptopHouse className="text-blue-600" /> Manage Classes
          </h1>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search classes..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <form onSubmit={handleAddClass} className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Class Name (e.g., Form 1)"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className="flex-grow py-2 px-4 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Stream (e.g., West)"
            value={newClassStream}
            onChange={(e) => setNewClassStream(e.target.value)}
            className="flex-grow py-2 px-4 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <FaPlusCircle /> Add Class
          </button>
        </form>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {filteredClasses.length === 0 ? (
          <p className="text-center text-gray-600">No classes found.</p>
        ) : (
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stream</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Teacher</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.map(_class => (
                  <tr key={_class._id}>
                    <td className="px-6 py-4">{_class.name}</td>
                      {/* NEW COLUMN: Stream */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                           {_class.stream && _class.stream.length > 0 ? _class.stream.join(', ') : '—'}
                       </td>
      
                    <td className="px-6 py-4">
                      <select
                        value={_class.classTeacher?._id || ''}
                        onChange={(e) => handleAssignTeacher(_class._id, e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Assign Class Teacher</option>
                        {teachers.map(t => (
                          <option key={t._id} value={t._id}>
                            {t.firstName} {t.lastName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleEditClass(_class._id)} className="text-blue-600 p-2">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeleteClass(_class._id)} className="text-red-600 p-2">
                        <FaTrashAlt />
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
