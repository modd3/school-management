import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaCalendarAlt, FaVenusMars, FaIdCardAlt, FaEdit, FaUser, FaSchool } from 'react-icons/fa'; // Added FaUser and FaSchool for consistency
import { getStudentById, updateStudent } from '../../api/students';
import { getAllParents } from '../../api/parents';
import { getClasses } from '../../api/classes'; // Import getClasses to fetch class options
import { toast } from 'react-toastify'; // Import toast

export default function EditStudentPage() {
  const { studentId } = useParams(); // Extract studentId from URL parameters
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [parentOptions, setParentOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]); // State for class options
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed local error/success states, will use toast
  // const [error, setError] = useState(null);
  // const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get student data first
        const res = await getStudentById(studentId); // Use 'studentId' from useParams
        const student = res.student;

        // Get all parents
        const parentsRes = await getAllParents();
        setParentOptions(parentsRes.parents || []);

        // Get all classes
        const classesRes = await getClasses();
        setClassOptions(classesRes.classes || []);

        // Set form data with parent contacts and current class
        setFormData({
          ...student,
          // If student has parent contacts, use them, otherwise empty array
          parentContacts: student.parentContacts || [],
          // Ensure date format is correct for date input
          dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
          // Ensure currentClass is just the ID if populated
          currentClass: student.currentClass?._id || '',
        });

      } catch (err) {
        toast.error('Failed to load student or parents/classes.'); // Use toast for error
        console.error('Fetch data error:', err);
        // setError('Failed to load student or parents/classes.'); // Removed
      }
    }
    fetchData();
  }, [studentId]); // Depend on 'studentId'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update handleParentChange to handle array of parent IDs (if multiple parents are allowed)
  // Your current form only allows selecting one parent, so we'll adjust this
  const handleParentChange = (e) => {
    const selectedParentId = e.target.value;
    setFormData(prev => ({
      ...prev,
      parentContacts: selectedParentId ? [selectedParentId] : [] // Store as array of IDs
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // setError(null); // Removed
    // setSuccess(null); // Removed
    try {
      // Filter out auto-generated fields if they are not meant to be updated
      const dataToUpdate = { ...formData };
      delete dataToUpdate.admissionNumber; // Assuming admissionNumber is auto-generated and not editable

      await updateStudent(studentId, dataToUpdate); // Use 'studentId' from useParams
      toast.success('Student updated successfully!'); // Use toast for success
      setTimeout(() => navigate('/admin/students'), 1200);
    } catch (err) {
      toast.error(err.message || 'Failed to update student.'); // Use toast for error
      console.error('Update student error:', err);
      // setError(err.message || 'Failed to update student.'); // Removed
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) return <div className="p-8 text-center text-gray-700">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-3">
          <FaUserGraduate className="text-blue-600"/>
          Edit Student
        </h1>
        {/* {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>} */}
        {/* {success && <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">{success}</div>} */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName || ''}
              onChange={handleChange}
              className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName || ''}
              onChange={handleChange}
              className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <FaIdCardAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <input
              type="text"
              name="admissionNumber"
              placeholder="Admission Number"
              value={formData.admissionNumber || ''}
              readOnly // Make it read-only as it's auto-generated
              className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="relative">
            <FaCalendarAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <input
              type="date"
              name="dateOfBirth"
              placeholder="Date of Birth"
              value={formData.dateOfBirth || ''}
              onChange={handleChange}
              className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <FaVenusMars className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <select
              name="gender"
              value={formData.gender || ''}
              onChange={handleChange}
              className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              required
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
            <FaSchool className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <select
              name="currentClass"
              value={formData.currentClass || ''}
              onChange={handleChange}
              className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">Select Class</option>
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
              name="stream"
              placeholder="Stream"
              value={formData.stream || ''}
              onChange={handleChange}
              className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20}/>
            <select
              name="parentContacts"
              value={formData.parentContacts?.[0] || ''} // Assuming single parent for simplicity
              onChange={handleParentChange}
              className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">Select Parent (Optional)</option>
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
              name="studentPhotoUrl"
              placeholder="Photo URL"
              value={formData.studentPhotoUrl || ''}
              onChange={handleChange}
              className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive || false}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Is Active</label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <FaEdit size={20}/>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
