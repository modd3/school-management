import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser } from '../../api/users';
import { getAllParents } from '../../api/parents';
import { getClasses } from '../../api/classes'; // Assuming you might need classes for student profile
import {
  FaUserEdit, FaEnvelope, FaUser, FaBriefcase, FaPhoneAlt, FaIdBadge, FaCalendarAlt, FaVenusMars, FaLaptopHouse
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const TEACHER_TYPES = [
  { value: 'principal', label: 'Principal' },
  { value: 'deputy_principal', label: 'Deputy Principal' },
  { value: 'class_teacher', label: 'Class Teacher' },
  { value: 'subject_teacher', label: 'Subject Teacher' },
];

export default function EditUserPage() {
  const { userId } = useParams(); // Use userId to match App.jsx route param
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [parentOptions, setParentOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]); // For student's currentClass
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed local error/success states, will use toast
  // const [error, setError] = useState(null);
  // const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const person = await getUserById(userId); // Use 'userId' from useParams
        const user = person.user;
        // console.log("Fetched User:", user); // Debugging

        // Fetch parents and classes regardless, as they might be needed for student/parent roles
        const parentsRes = await getAllParents();
        setParentOptions(parentsRes.parents || []);
        const classesRes = await getClasses();
        setClassOptions(classesRes.classes || []);

        // Initialize formData based on user and its associated profile
        const profile = user.profile || {}; // Assuming profile is directly nested if populated

        setFormData({
          firstName: user.firstName || profile.firstName || "",
          lastName: user.lastName || profile.lastName || "",
          email: user.email || "",
          // Use user.role directly for the main role field
          role: user.role,
          // Profile-specific fields, ensure they are correctly mapped
          staffId: profile.staffId || "",
          teacherType: profile.teacherType || "",
          phoneNumber: profile.phoneNumber || "",
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
          gender: profile.gender || "",
          // For parentContacts, ensure it's an array of IDs if student has parents
          parentContacts: profile.parentContacts?.map(p => p._id || p) || [],
          stream: profile.stream || "",
          studentPhotoUrl: profile.studentPhotoUrl || "",
          // For student's currentClass, use its ID
          currentClass: profile.currentClass?._id || '',
        });

      } catch (err) {
        toast.error('Failed to load user data or related options.');
        console.error('Fetch data error:', err);
        // setError('Failed to load user or parents.'); // Removed
      }
    }
    fetchData();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParentChange = (e) => {
    const selectedParentId = e.target.value;
    setFormData(prev => ({
      ...prev,
      parentContacts: selectedParentId ? [selectedParentId] : []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // setError(null); // Removed
    // setSuccess(null); // Removed

    // Build profileData based on the current role in formData
    let profileData = {};

    // Common fields for all profiles (if they are part of profile model)
    // For simplicity, we'll send all relevant fields based on the role
    // The backend should then pick what's relevant for the specific profile model

    if (formData.role === 'teacher') {
      profileData = {
        staffId: formData.staffId,
        teacherType: formData.teacherType,
        phoneNumber: formData.phoneNumber,
      };
    } else if (formData.role === 'student') {
      profileData = {
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        parentContacts: formData.parentContacts,
        stream: formData.stream,
        studentPhotoUrl: formData.studentPhotoUrl,
        currentClass: formData.currentClass, // Send class ID
      };
    } else if (formData.role === 'parent') {
      profileData = {
        phoneNumber: formData.phoneNumber,
      };
    }
    // Admin role typically doesn't have a separate profile model with these fields

    try {
      await updateUser(userId, { // Use 'userId' from useParams
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role, // Send the updated role
        profileData, // Send profileData based on the role
      });
      toast.success('User updated successfully!'); // Use toast
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err) {
      toast.error(err.message || 'Failed to update user.'); // Use toast
      console.error('Update user error:', err);
      // setError(err.message || 'Failed to update user.'); // Removed
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) return <div className="p-8 text-center text-gray-700">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 justify-center">
            <FaUserEdit className="text-blue-600" /> Edit User
          </h1>
        </div>
        {/* {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>} */}
        {/* {success && <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{success}</div>} */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="relative">
              <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="relative">
            <FaEnvelope className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
              required
            />
          </div>

          {/* Role selection dropdown - always visible */}
          <div className="relative">
            <FaBriefcase className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <select
              name="role" // Changed from roleMapping to role
              value={formData.role}
              onChange={handleChange}
              className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              required
            >
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="class_teacher">Class Teacher</option>
              <option value="subject_teacher">Subject Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z"/></svg>
            </div>
          </div>

          {/* Teacher-specific fields */}
          {(formData.role === 'teacher' || formData.role === 'class_teacher' || formData.role === 'subject_teacher') && (
            <>
              <div className="relative">
                <FaIdBadge className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <input
                  type="text"
                  name="staffId"
                  placeholder="Staff ID"
                  value={formData.staffId || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="relative">
                <FaBriefcase className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <select
                  name="teacherType"
                  value={formData.teacherType || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="">Select Teacher Type</option>
                  {TEACHER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z"/></svg>
                </div>
              </div>
              <div className="relative">
                <FaPhoneAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}
          {formData.role === 'student' && (
            <>
              <div className="relative">
                <FaCalendarAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <input
                  type="date"
                  name="dateOfBirth"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="relative">
                <FaVenusMars className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z"/></svg>
                </div>
              </div>
              <div className="relative">
                <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <select
                  name="parentContacts"
                  value={formData.parentContacts[0] || ''}
                  onChange={handleParentChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="">Select Parent</option>
                  {parentOptions.map(parent => (
                    <option key={parent._id} value={parent._id}>
                      {parent.firstName} {parent.lastName} ({parent.phoneNumber})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z"/></svg>
                </div>
              </div>
              <div className="relative">
                <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <input
                  type="text"
                  name="stream"
                  placeholder="Stream (e.g. East, West, North)"
                  value={formData.stream || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="relative">
                <FaLaptopHouse className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <select
                  name="currentClass"
                  value={formData.currentClass || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="">Select Current Class</option>
                  {classOptions.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z"/></svg>
                </div>
              </div>
              <div className="relative">
                <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <input
                  type="text"
                  name="studentPhotoUrl"
                  placeholder="Photo URL"
                  value={formData.studentPhotoUrl || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}
          {formData.role === 'parent' && ( // Changed from roleMapping to role
            <div className="relative">
              <FaPhoneAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
              <input
                type="text"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber || ''}
                onChange={handleChange}
                className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
              />
            </div>
          )}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md"
            >
              <FaUserEdit size={20}/>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
