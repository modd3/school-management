import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaEdit, FaTrashAlt, FaSearch, FaPlusCircle, FaBook, FaChevronDown, FaChevronUp, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getStudents, deleteStudent } from '../../api/students';
//import { getAllParents } from '../../api/parents'; // Keep this if parent info is displayed or used
import { toast } from 'react-toastify'; // Import toast

export default function ManageStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  // const [parentOptions, setParentOptions] = useState([]); // Not directly used in display, can be removed if not needed
  const navigate = useNavigate();

  const toggleRowExpansion = (studentId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(studentId)) {
      newExpandedRows.delete(studentId);
    } else {
      newExpandedRows.add(studentId);
    }
    setExpandedRows(newExpandedRows);
  };

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
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
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
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div key={student._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Main Student Info Row */}
                <div className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Student Photo */}
                      <div className="flex-shrink-0 h-12 w-12">
                        {student.studentPhotoUrl ? (
                          <img className="h-12 w-12 rounded-full object-cover" src={student.studentPhotoUrl} alt="" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaUserGraduate className="text-blue-600" size={20} />
                          </div>
                        )}
                      </div>
                      
                      {/* Student Basic Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {student.firstName} {student.lastName}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.gender === 'Male' ? 'bg-blue-100 text-blue-800' :
                            student.gender === 'Female' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {student.gender || 'Not Specified'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {student.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-6 text-sm text-gray-500">
                          <span className="font-mono">{student.admissionNumber}</span>
                          <span>{student.email}</span>
                          {student.currentClass && (
                            <span className="flex items-center">
                              <FaGraduationCap className="mr-1" />
                              {student.currentClass.name} {student.academicYear && `(${student.academicYear})`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Subject Count & Actions */}
                    <div className="flex items-center space-x-4">
                      {student.totalSubjects > 0 && (
                        <div className="text-center">
                          <div className="flex items-center text-sm text-gray-600">
                            <FaBook className="mr-1" />
                            <span className="font-medium">{student.totalSubjects}</span>
                          </div>
                          <div className="text-xs text-gray-500">subjects</div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => toggleRowExpansion(student._id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="View enrollment details"
                      >
                        {expandedRows.has(student._id) ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      
                      <div className="flex items-center space-x-2">
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
                    </div>
                  </div>
                </div>
                
                {/* Expandable Details Section */}
                {expandedRows.has(student._id) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Parent Contact Info */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Parent Contact</h4>
                        {student.parentContacts && student.parentContacts.length > 0 ? (
                          <div className="bg-white rounded-lg p-4 border">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {student.parentContacts[0].firstName} {student.parentContacts[0].lastName}
                              </div>
                              <div className="text-gray-600 mt-1">
                                {student.parentContacts[0].phoneNumber && (
                                  <div>📞 {student.parentContacts[0].phoneNumber}</div>
                                )}
                                {student.parentContacts[0].email && (
                                  <div>✉️ {student.parentContacts[0].email}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-4 border text-gray-500 text-sm">
                            No parent contact information
                          </div>
                        )}
                      </div>
                      
                      {/* Class Enrollment History */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Class Enrollment</h4>
                        {student.allClassEnrollments && student.allClassEnrollments.length > 0 ? (
                          <div className="space-y-2">
                            {student.allClassEnrollments.slice(0, 3).map((enrollment, index) => (
                              <div key={enrollment._id} className="bg-white rounded-lg p-3 border flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm text-gray-900">
                                    {enrollment.class?.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {enrollment.academicYear} • {enrollment.status}
                                  </div>
                                </div>
                                {index === 0 && enrollment.status === 'Active' && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-4 border text-gray-500 text-sm">
                            No class enrollment found
                          </div>
                        )}
                      </div>
                      
                      {/* Subjects by Term */}
                      {student.subjectsByTerm && Object.keys(student.subjectsByTerm).length > 0 && (
                        <div className="lg:col-span-2">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Enrolled Subjects by Term</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(student.subjectsByTerm).map(([termName, subjects]) => (
                              <div key={termName} className="bg-white rounded-lg p-4 border">
                                <h5 className="font-medium text-sm text-gray-900 mb-2">{termName}</h5>
                                <div className="space-y-1">
                                  {subjects.slice(0, 5).map((subjectInfo) => (
                                    <div key={subjectInfo._id} className="flex items-center justify-between text-xs">
                                      <span className="text-gray-700 truncate">
                                        {subjectInfo.subject?.name || 'Unknown Subject'}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        subjectInfo.subject?.category === 'Core' 
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-purple-100 text-purple-700'
                                      }`}>
                                        {subjectInfo.subject?.category || 'N/A'}
                                      </span>
                                    </div>
                                  ))}
                                  {subjects.length > 5 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      +{subjects.length - 5} more subjects
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Subject Summary */}
                      {(student.coreSubjects?.length > 0 || student.electiveSubjects?.length > 0) && (
                        <div className="lg:col-span-2">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Subject Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {student.coreSubjects?.length > 0 && (
                              <div className="bg-white rounded-lg p-4 border">
                                <h5 className="font-medium text-sm text-blue-900 mb-2">Core Subjects ({student.coreSubjects.length})</h5>
                                <div className="space-y-1">
                                  {student.coreSubjects.slice(0, 5).map((subject) => (
                                    <div key={subject._id} className="text-xs text-gray-700">
                                      {subject.subject?.name}
                                    </div>
                                  ))}
                                  {student.coreSubjects.length > 5 && (
                                    <div className="text-xs text-gray-500">+{student.coreSubjects.length - 5} more</div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {student.electiveSubjects?.length > 0 && (
                              <div className="bg-white rounded-lg p-4 border">
                                <h5 className="font-medium text-sm text-purple-900 mb-2">Elective Subjects ({student.electiveSubjects.length})</h5>
                                <div className="space-y-1">
                                  {student.electiveSubjects.slice(0, 5).map((subject) => (
                                    <div key={subject._id} className="text-xs text-gray-700">
                                      {subject.subject?.name}
                                    </div>
                                  ))}
                                  {student.electiveSubjects.length > 5 && (
                                    <div className="text-xs text-gray-500">+{student.electiveSubjects.length - 5} more</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
