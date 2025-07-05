import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth';
import { getAllParents } from '../../api/parents';
import { getClasses } from '../../api/classes';
import {
  FaUserPlus,
  FaEnvelope,
  FaLock,
  FaUser,
  FaBriefcase,
} from 'react-icons/fa';

const TEACHER_TYPES = [
  { value: '', label: 'Select Teacher Type' },
  { value: 'class_teacher', label: 'Class Teacher' },
  { value: 'subject_teacher', label: 'Subject Teacher' },
  { value: 'principal', label: 'Principal' },
  { value: 'deputy_principal', label: 'Deputy Principal' },
];

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
  });

  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchParents() {
      try {
        const res = await getAllParents();
        setParentOptions(res.parents || []);
      } catch (err) {
        console.error("Failed to fetch parents");
      }
    }

    async function fetchClasses() {
      try {
        const res = await getClasses();
        setClasses(res.classes || []);
      } catch (err) {
        console.error("Failed to fetch classes");
      }
    }

    fetchParents();
    fetchClasses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'role') {
      let resetFields = {};
      if (value === 'teacher') {
        resetFields = {
          staffId: '',
          teacherType: '',
          phoneNumber: '',
          dateOfBirth: '',
          gender: '',
          parentContacts: '',
          stream: '',
          studentPhotoUrl: '',
        };
      } else if (value === 'student') {
        resetFields = {
          staffId: '',
          teacherType: '',
          phoneNumber: '',
          dateOfBirth: '',
          gender: '',
          parentContacts: '',
          studentPhotoUrl: '',
        };
      } else if (value === 'parent') {
        resetFields = {
          phoneNumber: '',
        };
      } else {
        resetFields = {};
      }

      setFormData((prev) => ({
        ...prev,
        role: value,
        ...resetFields,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("All fields are required.");
      setIsSubmitting(false);
      return;
    }

    let profileData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
    };

    if (formData.role === 'teacher') {
      if (formData.staffId) profileData.staffId = formData.staffId;
      if (formData.teacherType) profileData.teacherType = formData.teacherType;
      if (formData.phoneNumber) profileData.phoneNumber = formData.phoneNumber;
      if (formData.email) profileData.email = formData.email;
    }

    if (formData.role === 'student') {
      if (formData.dateOfBirth) profileData.dateOfBirth = formData.dateOfBirth;
      if (formData.gender) profileData.gender = formData.gender;
      if (formData.parentContacts) profileData.parentContacts = formData.parentContacts;
      if (selectedClass) profileData.currentClass = selectedClass;
      if (formData.studentPhotoUrl) profileData.studentPhotoUrl = formData.studentPhotoUrl;
    }

    if (formData.role === 'parent') {
      if (formData.phoneNumber) profileData.phoneNumber = formData.phoneNumber;
    }

    try {
      const userDataToSend = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profileData,
      };

      const result = await registerUser(userDataToSend);

      setSuccess(result.message || 'User created successfully!');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'student',
      });
      setSelectedClass('');
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-blue-50 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FaUserPlus className="text-blue-500" />
          Create New User
        </h2>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
          <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />

          <select name="role" value={formData.role} onChange={handleChange} className="w-full border px-3 py-2 rounded">
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>

          {/* Student fields */}
          {formData.role === 'student' && (
            <>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
              <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full border px-3 py-2 rounded" required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select name="parentContacts" value={formData.parentContacts || ''} onChange={e => setFormData(prev => ({ ...prev, parentContacts: [e.target.value] }))} className="w-full border px-3 py-2 rounded" required>
                <option value="">Select Parent</option>
                {parentOptions.map(p => (
                  <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.phoneNumber})</option>
                ))}
              </select>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full border px-3 py-2 rounded" required>
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name} {c.stream}</option>
                ))}
              </select>
              <input type="text" name="studentPhotoUrl" placeholder="Photo URL" value={formData.studentPhotoUrl || ''} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
            </>
          )}

          {/* Teacher fields */}
          {formData.role === 'teacher' && (
            <>
              <input
                type="text"
                name="staffId"
                placeholder="Staff ID"
                value={formData.staffId || ''}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />
              <select
                name="teacherType"
                value={formData.teacherType || ''}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              >
                {TEACHER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber || ''}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </>
          )}

          {/* Parent fields */}
          {formData.role === 'parent' && (
            <>
              <input type="text" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber || ''} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </>
          )}

          {/* Admin fields (if you want to add any, add here) */}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}
