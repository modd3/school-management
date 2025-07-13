import React, { useEffect, useState } from 'react';
import { getClasses } from '../../api/classes';
import { getSubjects } from '../../api/subjects';
import { getTeachers } from '../../api/teachers';
import { assignClassSubject } from '../../api/classSubjects';
import { getTerms } from '../../api/terms';
import { toast } from 'react-toastify';

export default function AssignClassSubject() {
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    term: '',
    academicYear: '',
  });

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentYear = new Date().getFullYear().toString();

    const fetchData = async () => {
      try {
        const [classRes, subjectRes, teacherRes, termRes] = await Promise.all([
          getClasses(),
          getSubjects(),
          getTeachers(),
          getTerms(),
        ]);

        setClasses(classRes.classes || []);
        setSubjects(subjectRes.subjects || []);
        setTeachers(teacherRes.teachers || []);
        setTerms(termRes.terms || []);
        setFormData((prev) => ({ ...prev, academicYear: currentYear }));
      } catch (err) {
        toast.error('❌ Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if selected class is active
    const selectedClass = classes.find(cls => cls._id === formData.classId);
    if (!selectedClass) {
      toast.error('❌ Please select a valid class');
      return;
    }

    if (!selectedClass.isActive) {
      toast.error('❌ Cannot assign subject to an inactive class');
      return;
    }

    // Check if selected subject is active
    const selectedSubject = subjects.find(sub => sub._id === formData.subjectId);
    if (!selectedSubject) {
      toast.error('❌ Please select a valid subject');
      return;
    }

    if (!selectedSubject.isActive) {
      toast.error('❌ Cannot assign an inactive subject');
      return;
    }

    try {
      await assignClassSubject(formData);
      toast.success('✅ Subject assigned successfully');
      setFormData({
        classId: '',
        subjectId: '',
        teacherId: '',
        term: '',
        academicYear: formData.academicYear, // retain auto-year
      });
    } catch (err) {
      toast.error(err.message || '❌ Assignment failed');
    }
  };

  // Filter only active classes and subjects for the dropdowns
  const activeClasses = classes.filter(cls => cls.isActive);
  const activeSubjects = subjects.filter(sub => sub.isActive);

  if (loading) return <p className="text-center mt-6">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Assign Subject to Teacher</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Select Class - Only show active classes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Class
          </label>
          <select
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Class</option>
            {activeClasses.map(cls => (
              <option key={cls._id} value={cls._id}>
                {cls.name} - {cls.classCode}
              </option>
            ))}
          </select>
          {activeClasses.length === 0 && (
            <p className="text-sm text-red-600 mt-1">No active classes available</p>
          )}
        </div>

        {/* Select Subject - Only show active subjects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Subject
          </label>
          <select
            name="subjectId"
            value={formData.subjectId}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Subject</option>
            {activeSubjects.map(sub => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </select>
          {activeSubjects.length === 0 && (
            <p className="text-sm text-red-600 mt-1">No active subjects available</p>
          )}
        </div>

        {/* Select Teacher (by userId) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Teacher
          </label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select Teacher</option>
            {teachers.map(t => (
              <option key={t._id} value={t.userId}>
                {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Select Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Term
          </label>
          <select
  name="term"
  value={formData.term}
  onChange={handleChange}
  required
  className="w-full border px-3 py-2 rounded"
>
  <option value="">Select Term</option>
  {terms.map((term) => (
    <option key={term._id} value={term._id}>
      {term.name}, {term.academicYear}
    </option>
  ))}
</select>

        </div>

        {/* Academic Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year
          </label>
          <input
            type="text"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            placeholder="Academic Year (e.g. 2025)"
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          disabled={activeClasses.length === 0 || activeSubjects.length === 0}
        >
          Assign Subject
        </button>
      </form>
    </div>
  );
}