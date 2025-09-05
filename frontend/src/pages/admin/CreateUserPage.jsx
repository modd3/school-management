// frontend/src/pages/admin/CreateUserPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth';
import { getClasses } from '../../api/classes';
import { getAllParents } from '../../api/parents';
import { getClassSubjectsByClass, getAvailableElectives, getAvailableCoreSubjects } from '../../api/classSubjects'; // Import both old and new API functions
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
    selectedElectives: {}, // { groupName: [classSubjectId1, classSubjectId2, ...] }
  });

  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]); // Keep for backward compatibility
  const [availableElectives, setAvailableElectives] = useState({}); // New state for deduplicated electives
  const [availableCoreSubjects, setAvailableCoreSubjects] = useState([]); // New state for deduplicated core subjects
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

  useEffect(() => {
    const loadSubjects = async () => {
      if (!formData.classId || !formData.academicYear || formData.academicYear === 'undefined') {
        setClassSubjects([]);
        setAvailableElectives({});
        setAvailableCoreSubjects([]);
        setFormData(prev => ({ ...prev, selectedElectives: {} }));
        return;
      }
      
      setLoading(true);
      try {
        console.log('Loading deduplicated subjects for class:', formData.classId, 'academic year:', formData.academicYear);
        
        // Load both electives and core subjects using new APIs
        const [electivesRes, coreRes] = await Promise.all([
          getAvailableElectives(formData.classId, formData.academicYear),
          getAvailableCoreSubjects(formData.classId, formData.academicYear)
        ]);
        
        console.log('API Response for getAvailableElectives:', electivesRes);
        console.log('API Response for getAvailableCoreSubjects:', coreRes);
        
        // Set the new deduplicated data
        setAvailableElectives(electivesRes.electivesByGroup || {});
        setAvailableCoreSubjects(coreRes.allCoreSubjects || []);
        
        // Keep old API call for backward compatibility in enrollment logic
        const oldRes = await getClassSubjectsByClass(formData.classId, formData.academicYear);
        setClassSubjects(oldRes.classSubjects || []);
        
        // Reset electives when class changes
        setFormData(prev => ({ ...prev, selectedElectives: {} }));
      } catch (err) {
        console.error('Error loading subjects:', err);
        toast.error('Failed to load subjects');
        setClassSubjects([]);
        setAvailableElectives({});
        setAvailableCoreSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, [formData.classId, formData.academicYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleElectiveChange = (group, subjectId, isChecked) => {
    setFormData(prev => {
      const currentSelections = prev.selectedElectives[group] || [];
      let newSelections;
      
      if (isChecked) {
        // Add to selections if not already present
        newSelections = currentSelections.includes(subjectId) 
          ? currentSelections 
          : [...currentSelections, subjectId];
      } else {
        // Remove from selections
        newSelections = currentSelections.filter(id => id !== subjectId);
      }
      
      return {
        ...prev,
        selectedElectives: {
          ...prev.selectedElectives,
          [group]: newSelections,
        },
      };
    });
  };

  // Use deduplicated data if available, otherwise fall back to old logic
  const electivesByGroup = Object.keys(availableElectives).length > 0 
    ? availableElectives 
    : (() => {
        const fallback = {};
        classSubjects
          .filter(cs => {
            return cs.subject && 
                   cs.subject.category && 
                   cs.subject.category.toLowerCase() === 'elective' && 
                   cs.subject.isActive !== false;
          })
          .forEach(cs => {
            const group = cs.subject.group || 'General Electives';
            if (!fallback[group]) fallback[group] = [];
            fallback[group].push(cs);
          });
        return fallback;
      })();

  // Get core subjects for display using deduplicated data if available
  const coreSubjects = availableCoreSubjects.length > 0
    ? availableCoreSubjects.map(cs => cs.name)
    : classSubjects
        .filter(cs => cs.subject && 
                      cs.subject.category && 
                      cs.subject.category.toLowerCase() === 'core' && 
                      cs.subject.isActive !== false)
        .map(cs => cs.subject.name);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      role, firstName, lastName, email, password,
      teacherType, staffId, phoneNumber, classId,
      academicYear, parentId, dateOfBirth, gender,
      studentPhotoUrl, selectedElectives
    } = formData;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    const profileData = { firstName, lastName };

    if (role === 'teacher') {
      Object.assign(profileData, { staffId, teacherType, phoneNumber });
    }

    // Student-specific logic
    if (role === 'student') {
      if (!classId || !academicYear) {
        toast.error('Please select a class and academic year for the student');
        return;
      }

      // Pass selected electives to backend for proper enrollment
      const electiveClassSubjectIds = Object.values(selectedElectives)
        .flat() // Flatten arrays from multiple groups
        .filter(Boolean);
      
      Object.assign(profileData, {
        dateOfBirth,
        gender,
        studentPhotoUrl,
        parentContactIds: parentId ? [parentId] : [],
        classId,
        academicYear,
        electiveClassSubjectIds, // Backend will handle both core and elective assignment
      });
    }

    if (role === 'parent') {
      Object.assign(profileData, { phoneNumber });
    }

    setLoading(true);
    try {
      const userRes = await registerUser({ email, password, role, profileData });
      
      // Show appropriate success message based on role
      if (role === 'student' && userRes.subjectAssignment) {
        // Student creation with subject assignment details
        const { coreSubjects, electives, totalUniqueSubjects, totalEnrollments } = userRes.subjectAssignment;
        
        toast.success(`✅ Student created successfully!`);
        toast.success(`📚 ${coreSubjects.details}`);
        toast.success(`🎨 ${electives.details}`);
        toast.success(`🎓 Total: ${totalUniqueSubjects} subjects, ${totalEnrollments} term enrollments`);
      } else {
        // Non-student user creation
        toast.success('✅ User created successfully!');
      }

      setTimeout(() => navigate('/admin/users'), 2000); // Slightly longer delay for multiple toasts
    } catch (err) {
      console.error('Error creating user:', err);
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
            <input 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleChange} 
              placeholder="First Name *" 
              required 
              className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
            />
            <input 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleChange} 
              placeholder="Last Name *" 
              required 
              className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
            />
          </div>

          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder="Email *" 
            required 
            className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
          />
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            placeholder="Password *" 
            required 
            className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
          />

          <select 
            name="role" 
            value={formData.role} 
            onChange={handleChange} 
            className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>

          {/* Teacher-specific fields */}
          {formData.role === 'teacher' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold text-blue-800">Teacher Information</h3>
              <input 
                name="staffId" 
                value={formData.staffId} 
                onChange={handleChange} 
                placeholder="Staff ID" 
                className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
              />
              <select 
                name="teacherType" 
                value={formData.teacherType} 
                onChange={handleChange} 
                className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none"
              >
                {TEACHER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input 
                name="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={handleChange} 
                placeholder="Phone Number" 
                className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
              />
            </div>
          )}

          {/* Student-specific fields */}
          {formData.role === 'student' && (
            <div className="space-y-4 p-4 bg-green-50 rounded">
              <h3 className="font-semibold text-green-800">Student Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="date" 
                  name="dateOfBirth" 
                  value={formData.dateOfBirth} 
                  onChange={handleChange} 
                  className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
                />
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange} 
                  className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <select 
                name="parentId" 
                value={formData.parentId} 
                onChange={handleChange} 
                className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Parent (Optional)</option>
                {parents.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.firstName} {p.lastName} ({p.phoneNumber})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select 
                  name="classId" 
                  value={formData.classId} 
                  onChange={handleChange} 
                  required
                  className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Class *</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.classCode})
                    </option>
                  ))}
                </select>

                <input 
                  name="academicYear" 
                  value={formData.academicYear} 
                  onChange={handleChange} 
                  placeholder="Academic Year *" 
                  required
                  type="number"
                  min="2020"
                  max="2030"
                  className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
                />
              </div>

              <input 
                name="studentPhotoUrl" 
                value={formData.studentPhotoUrl} 
                onChange={handleChange} 
                placeholder="Photo URL (Optional)" 
                className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
              />



              {/* Core Subjects Display */}
              {coreSubjects.length > 0 && (
                <div className="pt-2 border-t">
                  <h4 className="font-semibold text-gray-800 mb-2">Core Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {coreSubjects.map((subject, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Elective Subjects Selection */}
              {Object.keys(electivesByGroup).length > 0 && (
                <div className="pt-2 border-t">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Select Elective Subjects 
                    <span className="text-sm text-gray-600 ml-2">(Choose one or more from each group)</span>
                  </h4>
                  
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading subjects...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(electivesByGroup).map(([group, subjects]) => (
                        <div key={group} className="bg-white p-3 rounded border">
                          <label className="block font-medium text-gray-700 mb-2">
                            {group} Group
                            <span className="text-sm text-gray-500 ml-2">({subjects.length} subjects available)</span>
                          </label>
                          <div className="space-y-2">
                            {subjects.map((cs) => {
                              // Handle both old and new data formats
                              const isNewFormat = cs.subjectId && cs.name; // New deduplicated format
                              const key = isNewFormat ? cs.subjectId : cs._id;
                              const subjectId = isNewFormat ? cs.subjectId : cs._id;
                              const name = isNewFormat ? cs.name : cs.subject?.name;
                              const code = isNewFormat ? cs.code : cs.subject?.code;
                              const currentSelections = formData.selectedElectives[group] || [];
                              const isSelected = currentSelections.includes(subjectId);
                              
                              return (
                                <label key={key} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleElectiveChange(group, subjectId, e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {name}
                                    {code && ` (${code})`}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Show message if no electives available */}
              {formData.classId && formData.academicYear && Object.keys(electivesByGroup).length === 0 && !loading && (
                <div className="pt-2 border-t">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-yellow-800 text-sm">
                      <strong>No elective subjects available</strong> for this class and academic year.
                    </p>
                    <p className="text-yellow-600 text-xs mt-1">
                      Core subjects will be automatically assigned to the student.
                    </p>
                  </div>
                </div>
              )}

              {/* Show selected electives summary */}
              {Object.values(formData.selectedElectives).some(arr => Array.isArray(arr) && arr.length > 0) && (
                <div className="pt-2 border-t">
                  <h4 className="font-semibold text-gray-800 mb-2">Selected Electives</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(formData.selectedElectives).map(([group, subjectIds]) => {
                      if (!Array.isArray(subjectIds) || subjectIds.length === 0) return null;
                      
                      return subjectIds.map(subjectId => {
                        // Find subject name from either new or old data format
                        let subjectName = 'Unknown Subject';
                        
                        // Check new deduplicated format first
                        if (availableElectives[group]) {
                          const electiveSubject = availableElectives[group].find(e => e.subjectId === subjectId);
                          if (electiveSubject) {
                            subjectName = electiveSubject.name;
                          }
                        }
                        
                        // Fallback to old format if not found in new format
                        if (subjectName === 'Unknown Subject') {
                          const subject = classSubjects.find(cs => cs._id === subjectId);
                          if (subject?.subject?.name) {
                            subjectName = subject.subject.name;
                          }
                        }
                        
                        return (
                          <span key={`${group}-${subjectId}`} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                            {subjectName} ({group})
                          </span>
                        );
                      });
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parent-specific fields */}
          {formData.role === 'parent' && (
            <div className="space-y-4 p-4 bg-purple-50 rounded">
              <h3 className="font-semibold text-purple-800">Parent Information</h3>
              <input 
                name="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={handleChange} 
                placeholder="Phone Number" 
                className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
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
