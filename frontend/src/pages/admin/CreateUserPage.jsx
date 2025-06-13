import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser} from '../../api/auth'; 
import {getAllParents, getParentById} from '../../api/parents'; // Import the API call to get all parents
import {
  FaUserPlus,     // Create User icon
  FaEnvelope,     // Mail icon
  FaLock,         // Lock icon
  FaUser,         // User icon
  FaBriefcase,    // Briefcase icon for role
} from 'react-icons/fa';

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student', // Default role
  });
  const [parentOptions, setParentOptions] = useState([]); // For parent selection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate(); // For potential redirection after success

  useEffect(() => {
    // Fetch all parents for selection
    async function fetchParents() {
      try {
        const res = await getAllParents();
        setParentOptions(res.parents || []);
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchParents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    // Basic frontend validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("All fields are required.");
      setIsSubmitting(false);
      return;
    }

    // Build profileData based on role
    let profileData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
    };

    if (formData.role === 'subject_teacher' || formData.role === 'class_teacher') {
      // Example: add staffId and phoneNumber if you have those fields in your form
      if (formData.staffId) profileData.staffId = formData.staffId;
      if (formData.teacherType) profileData.teacherType = formData.teacherType;
      if (formData.phoneNumber) profileData.phoneNumber = formData.phoneNumber;
      if (formData.email) profileData.email = formData.email; // <-- add this line
    }
    if (formData.role === 'student') {
      if (formData.admissionNumber) profileData.admissionNumber = formData.admissionNumber;
      if (formData.dateOfBirth) profileData.dateOfBirth = formData.dateOfBirth;
      if (formData.gender) profileData.gender = formData.gender;
      if (formData.parentContacts) profileData.parentContacts = formData.parentContacts;
      if (formData.stream) profileData.stream = formData.stream;
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
      // Optional: Redirect after a short delay
      setTimeout(() => navigate('/admin/users'), 2000);

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-105">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center justify-center gap-3">
                <FaUserPlus className="text-blue-600"/> Create New User
            </h1>
            <p className="text-gray-500 text-lg">Add a new member to the school system.</p>
        </div>

        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-center gap-2" role="alert">
                <FaUserPlus className="text-red-500" size={20}/>
                <p className="font-bold">Error:</p>
                <p>{error}</p>
            </div>
        )}

        {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md flex items-center gap-2" role="alert">
                <FaUserPlus className="text-green-500" size={20}/>
                <p className="font-bold">Success:</p>
                <p>{success}</p>
            </div>
        )}

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
                className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-800"
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
                className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-800"
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
                className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-800"
                required
            />
          </div>
          <div className="relative">
            <FaLock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-800"
              required
            />
          </div>
          <div className="relative">
            <FaBriefcase className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-800"
            >
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="subject_teacher">Subject Teacher</option>
              <option value="class_teacher">Class Teacher</option>
              <option value="admin">Admin</option> {/* Admins can create other admins */}
            </select>
            {/* Custom arrow for select dropdown */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z"/></svg>
            </div>
          </div>
          {(formData.role === 'subject_teacher' || formData.role === 'class_teacher' || formData.role === 'principal' || formData.role === 'deputy_principal') && (
            <div className="relative">
              <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
              <select
                name="teacherType"
                value={formData.teacherType || ''}
                onChange={handleChange}
                className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-800"
                required
              >
                <option value="">Select Teacher Type</option>
                <option value="principal">Principal</option>
                <option value="deputy_principal">Deputy Principal</option>
                <option value="class_teacher">Class Teacher</option>
                <option value="subject_teacher">Subject Teacher</option>
              </select>
            </div>
          )}
          {(formData.role === 'subject_teacher' || formData.role === 'class_teacher') && (
            <>
              <div className="relative">
                <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <input
                  type="text"
                  name="staffId"
                  placeholder="Staff ID"
                  value={formData.staffId || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-800"
                  required
                />
              </div>
              <div className="relative">
                <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <input
                  type="text"
                  name="teacherType"
                  placeholder="Teacher Type (e.g. Subject/Class)"
                  value={formData.teacherType || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-800"
                  required
                />
              </div>
              <div className="relative">
                <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber || ''}
                  onChange={handleChange}
                  className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-gray-800"
                />
              </div>
            </>
          )}
          {formData.role === 'student' && (
            <>
              <div className="relative">
                <input
                  type="text"
                  name="admissionNumber"
                  placeholder="Admission Number"
                  value={formData.admissionNumber || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  name="dateOfBirth"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                  required
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
                  value={formData.parentContacts || ''}
                  onChange={e => setFormData(prev => ({ ...prev, parentContacts: [e.target.value] }))}
                  className="pl-3 w-full py-2.5 border border-gray-300 rounded-lg"
                  required
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

          {formData.role === 'parent' && (
  <>
    <div className="relative">
      <input
        type="text"
        name="phoneNumber"
        placeholder="Phone Number"
        value={formData.phoneNumber || ''}
        onChange={handleChange}
        className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
        required
      />
    </div>
    <div className="relative">
      <input
        type="email"
        name="parentEmail"
        placeholder="Parent Email (optional)"
        value={formData.parentEmail || ''}
        onChange={handleChange}
        className="pl-10 w-full py-2.5 border border-gray-300 rounded-lg"
      />
    </div>
  </>
)}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-blue-400 transition-all duration-300"
            >
              <FaUserPlus size={20}/>
              {isSubmitting ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}