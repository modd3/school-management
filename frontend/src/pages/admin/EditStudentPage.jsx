import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUserGraduate } from 'react-icons/fa';
import { getStudentById, updateStudent } from '../../api/students';
import { getAllParents } from '../../api/parents';

export default function EditStudentPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [parentOptions, setParentOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get student data first
        const res = await getStudentById(studentId);
        const student = res.student;

        // Get all parents
        const parentsRes = await getAllParents();
        setParentOptions(parentsRes.parents || []);

        // Set form data with parent contacts
        setFormData({
          ...student,
          // If student has parent contacts, use them, otherwise empty array
          parentContacts: student.parentContacts || [],
          // Ensure date format is correct for date input
          dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : ''
        });

      } catch (err) {
        setError('Failed to load student or parents.');
      }
    }
    fetchData();
  }, [studentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update handleParentChange to handle array of parent IDs
  const handleParentChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      parentContacts: selectedOptions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await updateStudent(studentId, formData);
      setSuccess('Student updated successfully!');
      setTimeout(() => navigate('/admin/students'), 1200);
    } catch (err) {
      setError(err.message || 'Failed to update student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-3">
          <FaUserGraduate className="text-blue-600"/>
          Edit Student
        </h1>
        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName || ''}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName || ''}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="date"
            name="dateOfBirth"
            placeholder="Date of Birth"
            value={formData.dateOfBirth ? formData.dateOfBirth.slice(0, 10) : ''}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg"
            required
          />
          <select
            name="gender"
            value={formData.gender || ''}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="text"
            name="stream"
            placeholder="Stream"
            value={formData.stream || ''}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg"
          />
          <select
            name="parentContacts"
            value={formData.parentContacts?.[0] || ''}
            onChange={handleParentChange}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg"
          >
            {formData.parentContacts?.length > 0 ? (
              // Show current parent's info
              <option value={formData.parentContacts[0]}>
                {parentOptions.find(p => p._id === formData.parentContacts[0])?.firstName || ''} {' '}
                {parentOptions.find(p => p._id === formData.parentContacts[0])?.lastName || ''} {' '}
                ({parentOptions.find(p => p._id === formData.parentContacts[0])?.phoneNumber || ''})
              </option>
            ) : (
              <option value="">No Parent Assigned</option>
            )}
            {parentOptions.map(parent => (
              <option key={parent._id} value={parent._id}>
                {parent.firstName} {parent.lastName} ({parent.phoneNumber})
              </option>
            ))}
          </select>
          <input
            type="text"
            name="studentPhotoUrl"
            placeholder="Photo URL"
            value={formData.studentPhotoUrl || ''}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}