import React, { useEffect, useState } from 'react';
import {
  getClasses,
  createClass,
  deleteClass,
  assignClassTeacher,
} from '../../api/classes';
import { getTeachers } from '../../api/teachers';
import { FaPlusCircle, FaTrashAlt, FaEdit } from 'react-icons/fa';
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

  const currentYear = new Date().getFullYear();
  const defaultAcademicYear = `${currentYear}`;

  useEffect(() => {
    setForm(prev => ({ ...prev, academicYear: defaultAcademicYear }));
    loadData();
  }, []);

  const loadData = async () => {
    try {
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
        stream: [stream],
        classCode: classCode.toUpperCase(),
        academicYear,
      });

      toast.success('Class created');
      setClasses(prev => [...prev, res.class]);
      setForm({ name: '', grade: '', stream: '', classCode: '', academicYear: defaultAcademicYear });
    } catch (err) {
      toast.error(err.message || 'Failed to create class');
    }
  };

  const handleDelete = async classId => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await deleteClass(classId);
      setClasses(prev => prev.filter(c => c._id !== classId));
      toast.success('Class deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleAssignTeacher = async (classId, teacherId) => {
    try {
      if (!teacherId) {
        toast.error('Please select a teacher');
        return;
      }
      console.log('Assigning teacher:', teacherId);
      if (!window.confirm('Are you sure you want to assign this teacher?')) return; 
      await assignClassTeacher(classId, teacherId);
      toast.success('Class teacher assigned');
      loadData();
    } catch (err) {
      toast.error('Assign failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Classes</h2>

      <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Class Name (e.g., Form 1)" className="border p-2 rounded" />
        <input name="grade" value={form.grade} onChange={handleChange} placeholder="Grade (e.g., 1)" type="number" min="1" className="border p-2 rounded" />
        <input name="stream" value={form.stream} onChange={handleChange} placeholder="Stream (e.g., West)" className="border p-2 rounded" />
        <input name="classCode" value={form.classCode} onChange={handleChange} placeholder="Class Code (e.g., F1W)" className="border p-2 rounded" />
        <input name="academicYear" value={form.academicYear} onChange={handleChange} placeholder="Academic Year (e.g., 2025-2026)" className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700">
          <FaPlusCircle /> Add Class
        </button>
      </form>

      {classes.length === 0 ? (
        <p>No classes found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Stream</th>
                <th className="p-2">Grade</th>
                <th className="p-2">Code</th>
                <th className="p-2">Academic Year</th>
                <th className="p-2">Class Teacher</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls._id} className="border-t text-sm">
                  <td className="p-2">{cls.name}</td>
                  <td className="p-2">{cls.stream?.join(', ') || '—'}</td>
                  <td className="p-2">{cls.grade}</td>
                  <td className="p-2">{cls.classCode}</td>
                  <td className="p-2">{cls.academicYear}</td>
                  <td className="p-2">
                    <select
                      value={cls.classTeacher?._id || ''}
                      onChange={e => handleAssignTeacher(cls._id, e.target.value)}
                      className="border px-2 py-1 rounded"
                    >
                      <option value="">Assign Teacher</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t.userId}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => handleDelete(cls._id)} className="text-red-600 hover:underline flex items-center gap-1">
                      <FaTrashAlt /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
