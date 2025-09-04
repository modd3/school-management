import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaEdit, FaTrashAlt, FaSearch, FaPlusCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getStudents, deleteStudent } from '../../api/students';
//import { getAllParents } from '../../api/parents'; // Keep this if parent info is displayed or used
import { toast } from 'react-toastify'; // Import toast

export default function ManageStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // const [parentOptions, setParentOptions] = useState([]); // Not directly used in display, can be removed if not needed
  const navigate = useNavigate();

  // Function to load students from the API
  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudents();
      setStudents(data.students || []);
    } catch (err) {
      console.error("Failed to load students:", err);
      setError(err.message || 'Failed to load students.');
      toast.error(err.message || 'Failed to load students.'); // Use toast
    } finally {
      setLoading(false);
    }
  };

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  // Fetch all parents for selection (only if needed for display or filtering, otherwise can be removed)
  // useEffect(() => {
  //   async function fetchParents() {
  //     try {
  //       const res = await getAllParents();
  //       setParentOptions(res.parents || []);
  //     } catch (err) {
  //       // Optionally handle error
  //     }
  //   }
  //   fetchParents();
  // }, []);

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return; // Consider custom modal
    try {
      await deleteStudent(studentId);
      setStudents(students.filter(student => student._id !== studentId));
      toast.success('Student deleted successfully!'); // Use toast
    } catch (err) {
      console.error("Failed to delete student:", err);
      setError(err.message || 'Failed to delete student.');
      toast.error(err.message || 'Failed to delete student.'); // Use toast
    }
  };

  const handleEditStudent = (studentId) => {
    navigate(`/admin/students/edit/${studentId}`); // Correctly navigates to the edit page
  };

  const handleAddStudent = () => {
    navigate('/admin/create-user'); // Navigates to the create user page
  };

  const filteredStudents = students.filter(student =>
    (student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (student.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || '') || // Changed from studentId to admissionNumber
    (student.currentClass?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') // Assuming 'currentClass' is an object with a 'name' property
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-700">Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <p className="text-xl text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaUserGraduate className="text-blue-600"/> Manage Students
          </h1>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search students..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18}/>
            </div>
            <button
              onClick={handleAddStudent}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <FaPlusCircle /> Add Student
            </button>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p className="text-center text-gray-600">No students found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class & Stream</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.studentPhotoUrl ? (
                            <img className="h-10 w-10 rounded-full" src={student.studentPhotoUrl} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <FaUserGraduate className="text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.currentClass ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.currentClass.name}
                          </div>
                          {student.stream && (
                            <div className="text-sm text-gray-500">
                              {student.stream} Stream
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.gender === 'Male' ? 'bg-blue-100 text-blue-800' :
                        student.gender === 'Female' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.gender || 'Not Specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.parentContacts && student.parentContacts.length > 0 ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.parentContacts[0].firstName} {student.parentContacts[0].lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.parentContacts[0].phoneNumber || 'No phone'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No Parent</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {student.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditStudent(student._id)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                          title="Edit Student"
                        >
                          <FaEdit size={16}/>
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student._id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors"
                          title="Delete Student"
                        >
                          <FaTrashAlt size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
