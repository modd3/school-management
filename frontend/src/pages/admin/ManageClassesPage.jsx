import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  getClasses,
  createClass,
  deleteClass,
  assignClassTeacher,
} from '../../api/classes';
import { getTeachers } from '../../api/teachers';
import { FaPlusCircle, FaTrashAlt, FaEdit,FaLaptopHouse } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function ManageClassesPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    grade: '',
    stream: '',
    classCode: '',
    academicYear: '',
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}`;

  useEffect(() => {
    setForm(prev => ({ ...prev, academicYear: defaultAcademicYear }));
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true); // Start loading
      const [classRes, teacherRes] = await Promise.all([
        getClasses(),
        getTeachers(),
      ]);

      setClasses(classRes.classes || []);
      const classTeachers = (teacherRes.teachers || []).filter(
        t => t.teacherType === 'class_teacher'
      );
      setTeachers(classTeachers);
    } catch (err) {
      toast.error('Failed to load class data');
      console.error('Error loading class data:', err);
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async e => {
    e.preventDefault();
    const { name, grade, stream, classCode, academicYear } = form;

    if (!name || !grade || !stream || !classCode || !academicYear) {
      toast.error('All fields are required');
      return;
    }

    try {
      const res = await createClass({
        name,
        grade: parseInt(grade),
        stream: [stream], // Assuming stream is an array on backend
        classCode: classCode.toUpperCase(),
        academicYear,
      });

      toast.success('Class created successfully!');
      setClasses(prev => [...prev, res.class]);
      setForm({ name: '', grade: '', stream: '', classCode: '', academicYear: defaultAcademicYear });
    } catch (err) {
      toast.error(err.message || 'Failed to create class');
      console.error('Error creating class:', err);
    }
  };

  const handleDelete = async classId => {
    if (!window.confirm('Are you sure you want to delete this class?')) return; // Consider custom modal
    try {
      await deleteClass(classId);
      setClasses(prev => prev.filter(c => c._id !== classId));
      toast.success('Class deleted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to delete class');
      console.error('Error deleting class:', err);
    }
  };

  const handleAssignTeacher = async (classId, teacherId) => {
    try {
      if (!teacherId) {
        toast.error('Please select a teacher');
        return;
      }
      if (!window.confirm('Are you sure you want to assign this teacher?')) return; // Consider custom modal
      await assignClassTeacher(classId, teacherId);
      toast.success('Class teacher assigned successfully!');
      loadData(); // Reload data to show updated assignment
    } catch (err) {
      toast.error(err.message || 'Failed to assign teacher');
      console.error('Error assigning teacher:', err);
    }
  };

  const handleEditClass = (classId) => {
    navigate(`/admin/classes/edit/${classId}`); // Navigate to the new EditClassPage
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading classes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
          <FaLaptopHouse className="text-blue-600"/> Manage Classes
        </h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg shadow-inner">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Class Name (e.g., Form 1)" className="border p-2 rounded focus:ring-blue-500 focus:border-blue-500" required />
          <input name="grade" value={form.grade} onChange={handleChange} placeholder="Grade (e.g., 1)" type="number" min="1" className="border p-2 rounded focus:ring-blue-500 focus:border-blue-500" required />
          <input name="stream" value={form.stream} onChange={handleChange} placeholder="Stream (e.g., West)" className="border p-2 rounded focus:ring-blue-500 focus:border-blue-500" required />
          <input name="classCode" value={form.classCode} onChange={handleChange} placeholder="Class Code (e.g., F1W)" className="border p-2 rounded focus:ring-blue-500 focus:border-blue-500" required />
          <input name="academicYear" value={form.academicYear} onChange={handleChange} placeholder="Academic Year (e.g., 2025-2026)" className="border p-2 rounded focus:ring-blue-500 focus:border-blue-500" required />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors duration-200 col-span-full sm:col-span-1">
            <FaPlusCircle /> Add Class
          </button>
        </form>

        {classes.length === 0 ? (
          <p className="text-center text-gray-600 p-4">No classes found. Add a new class above.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
                  <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                  <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Teacher</th>
                  <th className="p-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map(cls => (
                  <tr key={cls._id} className="border-t text-sm hover:bg-gray-50">
                    <td className="p-2">{cls.name}</td>
                    <td className="p-2">{cls.stream?.join(', ') || '—'}</td>
                    <td className="p-2">{cls.grade}</td>
                    <td className="p-2">{cls.classCode}</td>
                    <td className="p-2">{cls.academicYear}</td>
                    <td className="p-2">
                      <select
                        value={cls.classTeacher?._id || ''}
                        onChange={e => handleAssignTeacher(cls._id, e.target.value)}
                        className="border px-2 py-1 rounded focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Assign Teacher</option>
                        {teachers.map(t => (
                          <option key={t._id} value={t.userId}>
                            {t.firstName} {t.lastName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 flex gap-2 justify-center">
                      <button
                        onClick={() => handleEditClass(cls._id)} // NEW EDIT BUTTON
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                        title="Edit Class"
                      >
                        <FaEdit size={18}/>
                      </button>
                      <button
                        onClick={() => handleDelete(cls._id)}
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
