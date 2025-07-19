// frontend/src/pages/admin/ManageClassSubjectsPage.jsx
import React, { useEffect, useState } from 'react';
import { getAllClasses } from '../../api/classes';
import { getAllTeachers } from '../../api/teachers';
import { getSubjects } from '../../api/subjects';
import {
  getSubjectsByClass,
  assignSubjectToTeacher,
} from '../../api/classSubjects';
import { toast } from 'react-toastify';

const ManageClassSubjectsPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classSubjects, setClassSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [classRes, teacherRes] = await Promise.all([
          getAllClasses(),
          getAllTeachers(),
        ]);
        setClasses(classRes.classes || []);
        setTeachers(teacherRes.teachers || []);
      } catch (err) {
        toast.error('Failed to load metadata');
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    const fetchClassSubjects = async () => {
      if (!selectedClassId) return;
      setLoading(true);
      try {
        const res = await getSubjectsByClass(selectedClassId);
        setClassSubjects(res.classSubjects || []);
      } catch (err) {
        toast.error('Failed to load class subjects');
      } finally {
        setLoading(false);
      }
    };
    fetchClassSubjects();
  }, [selectedClassId]);

  const handleTeacherAssign = async (classSubjectId, teacherId) => {
    try {
      await assignSubjectToTeacher(classSubjectId, teacherId);
      toast.success('Teacher assigned');
      setClassSubjects((prev) =>
        prev.map((cs) =>
          cs._id === classSubjectId
            ? { ...cs, teacher: { _id: teacherId } }
            : cs
        )
      );
    } catch (err) {
      toast.error('Failed to assign teacher');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Class Subject Management</h2>

      <select
        value={selectedClassId}
        onChange={(e) => setSelectedClassId(e.target.value)}
        className="border p-2 rounded mb-4 w-full"
      >
        <option value="">Select Class</option>
        {classes.map((cls) => (
          <option key={cls._id} value={cls._id}>
            {cls.name} ({cls.classCode})
          </option>
        ))}
      </select>

      {loading && <p>Loading subjects...</p>}

      {!loading && selectedClassId && (
        <div className="bg-white shadow rounded p-4">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left p-2">Subject</th>
                <th className="text-left p-2">Category</th>
                <th className="text-left p-2">Group</th>
                <th className="text-left p-2">Assigned Teacher</th>
              </tr>
            </thead>
            <tbody>
              {classSubjects.map((cs) => (
                <tr key={cs._id} className="border-t">
                  <td className="p-2">{cs.subject?.name}</td>
                  <td className="p-2">{cs.subject?.category}</td>
                  <td className="p-2">{cs.subject?.group || '—'}</td>
                  <td className="p-2">
                    <select
                      value={cs.teacher?._id || ''}
                      onChange={(e) =>
                        handleTeacherAssign(cs._id, e.target.value)
                      }
                      className="border p-1 rounded"
                    >
                      <option value="">-- Assign Teacher --</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {classSubjects.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500 py-4">
                    No subjects assigned for this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageClassSubjectsPage;
