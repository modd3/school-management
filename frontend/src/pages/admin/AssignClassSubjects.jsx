import React, { useEffect, useState } from 'react';
import { getClasses } from '../../api/classes';
import { getSubjects } from '../../api/subjects';
import { getTeachers } from '../../api/teachers';
import { assignClassSubject, getClassSubjectsByClass } from '../../api/classSubjects';
import { getTerms } from '../../api/terms';
import { getStudents } from '../../api/students';
import { toast } from 'react-toastify';

export default function AssignClassSubject() {
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    term: '',
  });

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedClassForView, setSelectedClassForView] = useState('');
  const [selectedTermForView, setSelectedTermForView] = useState('');
  const [classAssignments, setClassAssignments] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, subjectRes, teacherRes, termRes] = await Promise.all([
          getClasses(),
          getSubjects(),
          getTeachers(),
          getTerms(),
        ]);

        setClasses(classRes.classes || []);
        setSubjects(subjectRes.subjects?.filter(s => s.isActive) || []);
        setTeachers(teacherRes.teachers || []);
        setTerms(termRes.terms || []);
      } catch (err) {
        toast.error('❌ Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClassForView && selectedTermForView) {
      fetchClassAssignments();
      fetchClassStudents();
    }
  }, [selectedClassForView, selectedTermForView]);

  const fetchClassAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const response = await getClassSubjectsByClass(selectedClassForView, selectedTermForView);
      setClassAssignments(response.classSubjects || []);
    } catch (err) {
      toast.error('❌ Failed to load class assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchClassStudents = async () => {
    try {
      const response = await getStudents(selectedClassForView);
      setClassStudents(response.students || []);
    } catch (err) {
      toast.error('❌ Failed to load class students');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { classId, subjectId, teacherId, term } = formData;

    if (!classId || !subjectId || !teacherId || !term) {
      toast.error('❌ All fields are required');
      return;
    }

    try {
      await assignClassSubject(formData); // no academicYear param
      toast.success('✅ Subject assigned successfully');

      if (selectedClassForView === classId && selectedTermForView === term) {
        fetchClassAssignments();
      }

      setFormData({
        classId: '',
        subjectId: '',
        teacherId: '',
        term: '',
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || '❌ Assignment failed');
    }
  };

  const selectedClass = classes.find(c => c._id === selectedClassForView);
  const selectedTerm = terms.find(t => t._id === selectedTermForView);

  if (loading) return <p className="text-center py-6">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Assignment Form */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Assign Subject to Teacher</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <select name="classId" value={formData.classId} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.classCode})</option>
            ))}
          </select>

          <select name="subjectId" value={formData.subjectId} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          <select name="teacherId" value={formData.teacherId} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Teacher</option>
            {teachers.map(t => (
              <option key={t._id} value={t.userId}>{t.firstName} {t.lastName}</option>
            ))}
          </select>

          <select name="term" value={formData.term} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Term</option>
            {terms.map(t => (
              <option key={t._id} value={t._id}>{t.name}, {t.academicYear}</option>
            ))}
          </select>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Assign Subject
          </button>
        </form>
      </div>

      {/* View Assignments */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">View Class Assignments</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <select value={selectedClassForView} onChange={(e) => setSelectedClassForView(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.classCode})</option>
            ))}
          </select>

          <select value={selectedTermForView} onChange={(e) => setSelectedTermForView(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Select Term</option>
            {terms.map(t => (
              <option key={t._id} value={t._id}>{t.name}, {t.academicYear}</option>
            ))}
          </select>
        </div>

        {selectedClass && selectedTerm && (
          <>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <p><strong>Class:</strong> {selectedClass.name} ({selectedClass.classCode})</p>
              <p><strong>Term:</strong> {selectedTerm.name}, {selectedTerm.academicYear}</p>
              <p><strong>Students:</strong> {classStudents.length}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Assigned Subjects</h4>
              {loadingAssignments ? (
                <p>Loading...</p>
              ) : classAssignments.length === 0 ? (
                <p className="text-gray-500">No assignments found for this class and term.</p>
              ) : (
                <table className="w-full border mt-2">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2">Subject</th>
                      <th className="text-left px-3 py-2">Teacher</th>
                      <th className="text-left px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classAssignments.map(assignment => (
                      <tr key={assignment._id}>
                        <td className="px-3 py-2 border-t">{assignment.subject?.name || '—'}</td>
                        <td className="px-3 py-2 border-t">
                          {assignment.teacher
                            ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}`
                            : 'Unassigned'}
                        </td>
                        <td className="px-3 py-2 border-t">
                          {assignment.isActive ? (
                            <span className="text-green-600 font-medium">Active</span>
                          ) : (
                            <span className="text-red-500">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
