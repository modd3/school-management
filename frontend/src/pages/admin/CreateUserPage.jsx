// frontend/src/pages/admin/CreateUserPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth';
import { getClasses } from '../../api/classes';
import { getAllParents } from '../../api/parents';
import { FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const TEACHER_TYPES = [
  { value: '', label: 'Select Teacher Type' },
  { value: 'class_teacher', label: 'Class Teacher' },
  { value: 'subject_teacher', label: 'Subject Teacher' },
  { value: 'principal', label: 'Principal' },
  { value: 'deputy', label: 'Deputy Principal' },
];

const CreateUserPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    teacherType: '',
    staffId: '',
    phoneNumber: '',
    classId: '',
    academicYear: new Date().getFullYear().toString(),
    dateOfBirth: '',
    gender: '',
    parentId: '',
    studentPhotoUrl: '',
  });

  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [classRes, parentRes] = await Promise.all([
          getClasses(),
          getAllParents(),
        ]);
        setClasses(classRes.classes || []);
        setParents(parentRes.parents || []);
      } catch (err) {
        toast.error('Failed to load classes or parents');
      }
    };
    loadInitial();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      role, firstName, lastName, email, password,
      teacherType, staffId, phoneNumber, classId,
      academicYear, parentId, dateOfBirth, gender,
      studentPhotoUrl
    } = formData;

    if (!firstName || !lastName || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    const profileData = { firstName, lastName };

    if (role === 'teacher') {
      Object.assign(profileData, { staffId, teacherType, phoneNumber });
    }

    if (role === 'student') {
      if (!classId || !academicYear) {
        toast.error('Please select a class and academic year for the student');
        return;
      }

      Object.assign(profileData, {
        dateOfBirth,
        gender,
        studentPhotoUrl,
        parentContactIds: parentId ? [parentId] : [],
        classId,
        academicYear,
      });
    }

    if (role === 'parent') {
      Object.assign(profileData, { phoneNumber });
    }

    setLoading(true);
    try {
      await registerUser({ email, password, role, profileData });
      toast.success('✅ User created successfully!');
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || '❌ Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-700">
          <FaUserPlus /> Create New User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name *" required className="w-full border p-2 rounded" />
            <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name *" required className="w-full border p-2 rounded" />
          </div>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email *" required className="w-full border p-2 rounded" />
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password *" required className="w-full border p-2 rounded" />

          <select name="role" value={formData.role} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>

          {formData.role === 'teacher' && (
            <>
              <input name="staffId" value={formData.staffId} onChange={handleChange} placeholder="Staff ID" className="w-full border p-2 rounded" />
              <select name="teacherType" value={formData.teacherType} onChange={handleChange} className="w-full border p-2 rounded">
                {TEACHER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" className="w-full border p-2 rounded" />
            </>
          )}

          {formData.role === 'student' && (
            <>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full border p-2 rounded" />
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select name="parentId" value={formData.parentId} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="">Select Parent</option>
                {parents.map((p) => (
                  <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.phoneNumber})</option>
                ))}
              </select>
              <select name="classId" value={formData.classId} onChange={handleChange} required className="w-full border p-2 rounded">
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.classCode})</option>
                ))}
              </select>
              <input name="academicYear" value={formData.academicYear} onChange={handleChange} type="number" placeholder="Academic Year" className="w-full border p-2 rounded" />
              <input name="studentPhotoUrl" value={formData.studentPhotoUrl} onChange={handleChange} placeholder="Photo URL (Optional)" className="w-full border p-2 rounded" />
            </>
          )}

          {formData.role === 'parent' && (
            <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" className="w-full border p-2 rounded" />
          )}

          <button type="submit" disabled={loading} className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating User...
              </>
            ) : (
              <>
                <FaUserPlus />
                Create User
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUserPage;
