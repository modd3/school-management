import React, { useEffect, useState } from 'react';
import { getClasses } from '../../api/classes';
import { getTerms } from '../../api/terms';
import { getStudents } from '../../api/students';
import { getClassSubjectsByClass } from '../../api/classSubjects';
import { enrollStudentToClass, assignSubjectsToStudent } from '../../api/studentClasses';
import { toast } from 'react-toastify';

const EnrollStudentPage = () => {
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [students, setStudents] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);

  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    termId: '',
    rollNumber: '',
    isClassRepresentative: false,
    promotionStatus: 'Promoted',
    selectedElectives: {}
  });

  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classRes, termRes, studentRes] = await Promise.all([
          getClasses(),
          getTerms(),
          getStudents(),
        ]);
        setClasses(classRes.classes || []);
        setTerms(termRes.terms || []);
        setStudents(studentRes.students || []);
      } catch (err) {
        toast.error('Failed to load data');
      }
    };
    loadData();
  }, []);

  // Load subjects when classId or termId changes
  useEffect(() => {
    const loadSubjects = async () => {
      if (!formData.classId || !formData.termId) return;
      setLoadingSubjects(true);
      try {
        const res = await getClassSubjectsByClass(formData.classId, formData.termId);
        setClassSubjects(res.classSubjects || []);
      } catch (err) {
        toast.error('Failed to load subjects');
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [formData.classId, formData.termId]);

  const handleElectiveChange = (group, value) => {
    setFormData(prev => ({
      ...prev,
      selectedElectives: {
        ...prev.selectedElectives,
        [group]: value,
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      studentId, classId, termId,
      rollNumber, isClassRepresentative,
      promotionStatus, selectedElectives
    } = formData;

    if (!studentId || !classId || !termId) {
      toast.error('Student, class, and term are required');
      return;
    }

    try {
      // Step 1: Enroll student to class
      const response = await enrollStudentToClass({
        studentId, classId, termId,
        rollNumber,
        isClassRepresentative,
        promotionStatus,
        status: 'Active'
      });

      const studentClassId = response.studentClass?._id;
      if (!studentClassId) throw new Error('Student class creation failed');

      // Step 2: Assign subjects to student
      const coreSubjects = classSubjects.filter(cs => cs.subject.category === 'Core');
      const selectedElectiveIds = Object.values(selectedElectives).filter(Boolean);
      const allSubjectIds = [...coreSubjects.map(cs => cs._id), ...selectedElectiveIds];

      await assignSubjectsToStudent(studentClassId, { classSubjectIds: allSubjectIds });

      toast.success('✅ Student enrolled and subjects assigned');
      setFormData({ studentId: '', classId: '', termId: '', rollNumber: '', isClassRepresentative: false, promotionStatus: 'Promoted', selectedElectives: {} });
    } catch (err) {
      toast.error(err?.response?.data?.message || '❌ Enrollment failed');
    }
  };

  const electiveGroups = {};
  classSubjects
    .filter(cs => cs.subject.category === 'Elective' && cs.subject.isActive)
    .forEach(cs => {
      const group = cs.subject.group || 'General Electives';
      if (!electiveGroups[group]) electiveGroups[group] = [];
      electiveGroups[group].push(cs);
    });

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-blue-700">Enroll Student to Class & Subjects</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Select student */}
        <select name="studentId" value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })} className="w-full border p-2 rounded">
          <option value="">Select Student</option>
          {students.map(s => (
            <option key={s._id} value={s._id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>

        {/* Select class */}
        <select name="classId" value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} className="w-full border p-2 rounded">
          <option value="">Select Class</option>
          {classes.map(c => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.classCode})
            </option>
          ))}
        </select>

        {/* Select term */}
        <select name="termId" value={formData.termId} onChange={e => setFormData({ ...formData, termId: e.target.value })} className="w-full border p-2 rounded">
          <option value="">Select Term</option>
          {terms.map(t => (
            <option key={t._id} value={t._id}>
              {t.name}, {t.academicYear}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Roll Number (Optional)"
          value={formData.rollNumber}
          onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
          className="w-full border p-2 rounded"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isClassRepresentative}
            onChange={e => setFormData({ ...formData, isClassRepresentative: e.target.checked })}
          />
          Class Representative
        </label>

        {/* Promotion Status */}
        <select
          value={formData.promotionStatus}
          onChange={(e) => setFormData({ ...formData, promotionStatus: e.target.value })}
          className="w-full border p-2 rounded"
        >
          <option value="Promoted">Promoted</option>
          <option value="Repeated">Repeated</option>
          <option value="Transferred">Transferred</option>
        </select>

        {/* Elective selection */}
        {Object.keys(electiveGroups).length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Select Electives</h4>
            {Object.entries(electiveGroups).map(([group, subjects]) => (
              <div key={group}>
                <label className="block mb-1">{group}</label>
                <select
                  value={formData.selectedElectives[group] || ''}
                  onChange={(e) => handleElectiveChange(group, e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="">-- Select one --</option>
                  {subjects.map((cs) => (
                    <option key={cs._id} value={cs._id}>
                      {cs.subject.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Enroll Student
        </button>
      </form>
    </div>
  );
};

export default EnrollStudentPage;
