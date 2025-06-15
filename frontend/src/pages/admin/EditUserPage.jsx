import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser } from '../../api/users'; // You must implement these
import { getAllParents } from '../../api/parents';
import {
  FaUserEdit, FaEnvelope, FaLock, FaUser, FaBriefcase
} from 'react-icons/fa';

export default function EditUserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [parentOptions, setParentOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch user and parents
  useEffect(() => {
    async function fetchData() {
      try {
        const person = await getUserById(userId);
        const user = person.user.profileId;
        setFormData({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roleMapping: person.user.roleMapping,
          // Profile fields (if any)
          staffId: user.staffId || "",
          teacherType: user.teacherType || "",
          phoneNumber: user.phoneNumber || "",
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
          gender: user.gender || "",
          parentContacts: user.parentContacts || [],
          stream: user.stream || "",
          studentPhotoUrl: user.studentPhotoUrl || "",
        });
        const parentsRes = await getAllParents();
        setParentOptions(parentsRes.parents || []);
      } catch (err) {
        setError('Failed to load user or parents.');
      }
    }
    fetchData();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(e.target.value);
    // Reset role-specific fields if role changes
    if (name === "roleMapping") {
      let resetFields = {};
      if (value === "teacher") {
        resetFields = {
          staffId: "",
          teacherType: "",
          phoneNumber: "",
          dateOfBirth: "",
          gender: "",
          parentContacts: "",
          stream: "",
          studentPhotoUrl: "",
        };
      } else if (value === "student") {
        resetFields = {
          staffId: "",
          teacherType: "",
          phoneNumber: "",
          dateOfBirth: "",
          gender: "",
          parentContacts: "",
          stream: "",
          studentPhotoUrl: "",
        };
      } else if (value === "parent") {
        resetFields = {
          staffId: "",
          teacherType: "",
          dateOfBirth: "",
          gender: "",
          parentContacts: "",
          stream: "",
          studentPhotoUrl: "",
          phoneNumber: "",
        };
      } else {
        resetFields = {
          staffId: "",
          teacherType: "",
          phoneNumber: "",
          dateOfBirth: "",
          gender: "",
          parentContacts: "",
          stream: "",
          studentPhotoUrl: "",
        };
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

    // Build profileData based on role
    let profileData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
    };
    if (formData.roleMapping === 'Teacher') {
      if (formData.staffId) profileData.staffId = formData.staffId;
      if (formData.teacherType) profileData.teacherType = formData.teacherType;
      if (formData.phoneNumber) profileData.phoneNumber = formData.phoneNumber;
      if (formData.roleMapping) profileData.roleMapping === formData.roleMapping;
    }
    if (formData.roleMapping === 'Student') {
      if (formData.dateOfBirth) profileData.dateOfBirth = formData.dateOfBirth;
      if (formData.gender) profileData.gender = formData.gender;
      if (formData.parentContacts) profileData.parentContacts = formData.parentContacts;
      if (formData.stream) profileData.stream = formData.stream;
      if (formData.studentPhotoUrl) profileData.studentPhotoUrl = formData.studentPhotoUrl;
    }
    if (formData.roleMapping === 'Parent') {
      if (formData.phoneNumber) profileData.phoneNumber = formData.phoneNumber;
      if (formData.roleMapping) profileData.roleMapping === formData.roleMapping;
    }
console.log(formData.roleMapping)
    try {
      await updateUser(userId, {
        email: formData.email,
        role: formData.role,
        profileData,
      });
      setSuccess('User updated successfully!');
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 justify-center">
            <FaUserEdit className="text-blue-600" /> Edit User
          </h1>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{success}</div>}
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
          <div className="relative">
            <FaBriefcase className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <select
              name="roleMapping"
              value={formData.roleMapping}
              onChange={handleChange}
              className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
            >
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {/* Role-specific fields */}
          {formData.roleMapping === 'Teacher' && (
            <>
              <div className="relative">
                <input
                  type="text"
                  name="staffId"
                  placeholder="Staff ID"
                  value={formData.staffId || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="relative">
                <select
                  name="teacherType"
                  value={formData.teacherType || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Teacher Type</option>
                  <option value="principal">Principal</option>
                  <option value="deputy_principal">Deputy Principal</option>
                  <option value="class_teacher">Class Teacher</option>
                  <option value="subject_teacher">Subject Teacher</option>
                </select>
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}
          {formData.roleMapping === 'Student' && (
            <>
              <div className="relative">
                <input
                  type="date"
                  name="dateOfBirth"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="relative">
                <select
                  name="parentContacts"
                  value={formData.parentContacts[0] || ''}
                  onChange={e => setFormData(prev => ({ ...prev, parentContacts: [e.target.value] }))}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Parent</option>
                  {parentOptions.map(parent => (
                    <option key={parent._id} value={parent._id}>
                      {parent.firstName} {parent.lastName} ({parent.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="stream"
                  placeholder="Stream (e.g. East, West, North)"
                  value={formData.stream || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="studentPhotoUrl"
                  placeholder="Photo URL"
                  value={formData.studentPhotoUrl || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}
          {formData.roleMapping === 'Parent' && (
            <div className="relative">
              <input
                type="text"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber || ''}
                onChange={handleChange}
                className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
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