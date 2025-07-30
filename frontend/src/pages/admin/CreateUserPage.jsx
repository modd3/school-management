// frontend/src/pages/admin/CreateUserPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/auth';
import { getClasses } from '../../api/classes';
import { getAllParents } from '../../api/parents';
import { getClassSubjectsByClass, enrollStudentInSubject } from '../../api/classSubjects'; // Import enrollStudentInSubject
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
    selectedElectives: {}, // { groupName: classSubjectId }
  });

  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
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
        setFormData(prev => ({ ...prev, selectedElectives: {} }));
        return;
      }
      
      setLoading(true);
      try {
        console.log('Loading subjects for class:', formData.classId, 'academic year:', formData.academicYear);
        const res = await getClassSubjectsByClass(formData.classId, formData.academicYear);
        console.log('API Response for getClassSubjectsByClass:', res);
        setClassSubjects(res.classSubjects || []);
        // Reset electives when class changes
        setFormData(prev => ({ ...prev, selectedElectives: {} }));
      } catch (err) {
        console.error('Error loading class subjects:', err);
        toast.error('Failed to load class subjects');
        setClassSubjects([]);
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

  const handleElectiveChange = (group, value) => {
    setFormData(prev => ({
      ...prev,
      selectedElectives: {
        ...prev.selectedElectives,
        [group]: value,
      },
    }));
  };

  // Group elective subjects by their group
  const electivesByGroup = {};
  classSubjects
    .filter(cs => {
      return cs.subject && 
             cs.subject.category && 
             cs.subject.category.toLowerCase() === 'elective' && 
             cs.subject.isActive !== false;
    })
    .forEach(cs => {
      const group = cs.subject.group || 'General Electives';
      if (!electivesByGroup[group]) electivesByGroup[group] = [];
      electivesByGroup[group].push(cs);
    });

  // Get core subjects for display (optional)
  const coreSubjects = classSubjects
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

    // Student-specific logic for enrollment
    let studentEnrollmentClassSubjectIds = [];
    if (role === 'student') {
      if (!classId || !academicYear) {
        toast.error('Please select a class and academic year for the student');
        return;
      }

      // Collect selected elective class subject IDs
      const electiveClassSubjectIds = Object.values(selectedElectives).filter(Boolean);
      studentEnrollmentClassSubjectIds = [...electiveClassSubjectIds];

      // Automatically add core subjects to enrollment list
      const coreClassSubjectIds = classSubjects
        .filter(cs => cs.subject && cs.subject.category && cs.subject.category.toLowerCase() === 'core')
        .map(cs => cs._id);
      
      studentEnrollmentClassSubjectIds = [...new Set([...studentEnrollmentClassSubjectIds, ...coreClassSubjectIds])];


      Object.assign(profileData, {
        dateOfBirth,
        gender,
        studentPhotoUrl,
        parentContactIds: parentId ? [parentId] : [],
        classId,
        academicYear,
        // We are no longer directly saving electiveClassSubjectIds to the student profile
        // as enrollment will be handled by the separate API call.
        // The backend `registerUser` might still expect `classId` and `academicYear` for initial student profile setup.
      });
    }

    if (role === 'parent') {
      Object.assign(profileData, { phoneNumber });
    }

    setLoading(true);
    try {
      const userRes = await registerUser({ email, password, role, profileData });
      toast.success('✅ User created successfully!');

      // If the created user is a student, proceed with subject enrollment
      if (role === 'student' && userRes.user && userRes.user.profileId) {
        const studentId = userRes.user.profileId; // Assuming profileId is the student's ID

        // Enroll student in all collected class subjects
        for (const classSubjectId of studentEnrollmentClassSubjectIds) {
          try {
            console.log(`Attempting to enroll student ${studentId} in class subject ${classSubjectId} for academic year ${academicYear}`);
            await enrollStudentInSubject({
              studentId,
              classSubjectId,
              academicYear,
            });
            toast.success(`Enrolled in subject: ${classSubjects.find(cs => cs._id === classSubjectId)?.subject?.name}`);
          } catch (enrollErr) {
            console.error(`Failed to enroll student ${studentId} in class subject ${classSubjectId}:`, enrollErr);
            toast.error(`Failed to enroll in a subject: ${classSubjects.find(cs => cs._id === classSubjectId)?.subject?.name || 'Unknown'}.`);
          }
        }
      }

      setTimeout(() => navigate('/admin/users'), 1500);
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
                    <span className="text-sm text-gray-600 ml-2">(Choose one from each group)</span>
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
                          <select
                            value={formData.selectedElectives[group] || ''}
                            onChange={(e) => handleElectiveChange(group, e.target.value)}
                            className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">-- Select One Subject --</option>
                            {subjects.map((cs) => (
                              <option key={cs._id} value={cs._id}>
                                {cs.subject.name}
                                {cs.subject.code && ` (${cs.subject.code})`}
                              </option>
                            ))}
                          </select>
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
              {Object.keys(formData.selectedElectives).length > 0 && (
                <div className="pt-2 border-t">
                  <h4 className="font-semibold text-gray-800 mb-2">Selected Electives</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(formData.selectedElectives).map(([group, subjectId]) => {
                      if (!subjectId) return null;
                      const subject = classSubjects.find(cs => cs._id === subjectId);
                      return (
                        <span key={group} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                          {subject?.subject.name} ({group})
                        </span>
                      );
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
