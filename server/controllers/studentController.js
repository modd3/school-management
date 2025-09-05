const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Parent = require('../models/Parent');
const StudentClass = require('../models/StudentClass');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const assignCoreSubjects = require('../utils/assignCoreSubjects');
const { assignElectiveSubjects, getAvailableElectives } = require('../utils/assignElectiveSubjects');
const getAvailableCoreSubjects = require('../utils/getAvailableCoreSubjects');

// @desc    Add a new student
// @route   POST /api/admin/students
// @access  Private (Admin)
exports.createStudent = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    profileData: {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      studentPhotoUrl,
      parentContactIds = [],
      classId,
      academicYear,
      electiveClassSubjectIds = [],
    },
  } = req.body;

  // 1. Create the student profile
  const student = await Student.create({
    firstName,
    lastName,
    gender,
    dateOfBirth,
    studentPhotoUrl,
    parentContactIds,
  });

  // 2. Create the linked user account
  const user = await User.create({
    email,
    password,
    role: 'student',
    roleMapping: 'Student',
    profileId: student._id,
  });

  console.log(`🎓 Creating student: ${firstName} ${lastName} for class ${classId}, year ${academicYear}`);

  // 3. Create StudentClass mapping with correct field names
  const studentClass = await StudentClass.create({
    student: student._id,  // Fix: use 'student' not 'studentId'
    class: classId,        // Fix: use 'class' not 'classId' 
    academicYear,
    status: 'Active',      // Fix: use 'Active' not 'active'
    subjects: [],          // Will fill below
    enrollmentDate: new Date(),
    promotionStatus: 'Current'
  });

  console.log(`📋 StudentClass record created with ID: ${studentClass._id}`);

  // 4. Assign ALL Core Subjects across all terms (utils)
  const coreResult = await assignCoreSubjects(student._id, classId, academicYear);
  console.log(`📚 Core subjects result:`, coreResult);

  // 5. Assign Electives based on selection or default
  let electiveResult = { electivesAssigned: 0, electiveIds: [] };
  
  if (electiveClassSubjectIds?.length > 0) {
    console.log(`   Frontend provided ${electiveClassSubjectIds.length} elective selections`);
    console.log(`   Frontend IDs:`, electiveClassSubjectIds);
    
    // If frontend provided subject IDs instead of ClassSubject IDs, expand them
    console.log(`   📋 Getting available electives for expansion...`);
    const availableElectives = await getAvailableElectives(classId, academicYear);
    console.log(`   📋 Available electives result:`, {
      success: availableElectives.success,
      totalElectives: availableElectives.totalElectives,
      allElectivesCount: availableElectives.allElectives?.length
    });
    
    const expandedClassSubjectIds = [];
    
    electiveClassSubjectIds.forEach(selectedId => {
      console.log(`   🔍 Processing selected ID: ${selectedId}`);
      // Check if it's a subject ID that needs expansion
      const elective = availableElectives.allElectives.find(e => e.subjectId === selectedId);
      if (elective) {
        // Expand subject ID to all its ClassSubject IDs (across all terms)
        console.log(`   ✅ Expanding subject ${elective.subject.name} to ${elective.classSubjectIds.length} ClassSubjects`);
        console.log(`      ClassSubject IDs:`, elective.classSubjectIds);
        expandedClassSubjectIds.push(...elective.classSubjectIds);
      } else {
        // Already a ClassSubject ID, use as-is
        console.log(`   ⚠️  ID ${selectedId} not found in available electives - treating as ClassSubject ID`);
        expandedClassSubjectIds.push(selectedId);
      }
    });
    
    console.log(`   📦 Expanded to ${expandedClassSubjectIds.length} ClassSubject assignments:`, expandedClassSubjectIds);
    electiveResult = await assignElectiveSubjects(student._id, classId, academicYear, expandedClassSubjectIds);
  } else {
    // Default: auto-select one from each elective group
    electiveResult = await assignElectiveSubjects(student._id, classId, academicYear);
  }
  
  console.log(`🎨 Elective subjects result:`, electiveResult);

  res.status(201).json({
    success: true,
    user,
    student,
    studentClass,
    message: 'Student created and assigned to class and subjects.',
  });
});

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
exports.getAllStudents = asyncHandler(async (req, res) => {
    const students = await Student.find({})
        .populate('userId', '-password')
        .populate('parentContacts')
        .lean();

    // Get class enrollment and subject information for each student
    const studentsWithClassesAndSubjects = await Promise.all(
        students.map(async (student) => {
            // Get current class enrollment with subjects
            const currentClassEnrollment = await StudentClass.findOne({
                student: student._id,
                status: 'Active'
            })
            .populate('class', 'name classCode stream')
            .populate({
                path: 'subjects',
                populate: [
                    {
                        path: 'subject',
                        select: 'name code category'
                    },
                    {
                        path: 'class',
                        select: 'name'
                    },
                    {
                        path: 'teacher',
                        select: 'firstName lastName'
                    },
                    {
                        path: 'term',
                        select: 'name academicYear'
                    }
                ]
            })
            .lean();

            // Get all class enrollments (including historical ones)
            const allClassEnrollments = await StudentClass.find({
                student: student._id
            })
            .populate('class', 'name classCode stream')
            .sort({ createdAt: -1 })
            .lean();

            // Process subjects to organize by terms and categories
            let subjectsByTerm = {};
            let coreSubjects = [];
            let electiveSubjects = [];
            let totalSubjects = 0;

            if (currentClassEnrollment && currentClassEnrollment.subjects) {
                totalSubjects = currentClassEnrollment.subjects.length;
                
                currentClassEnrollment.subjects.forEach(classSubject => {
                    if (classSubject.subject && classSubject.term) {
                        const termName = classSubject.term.name;
                        
                        if (!subjectsByTerm[termName]) {
                            subjectsByTerm[termName] = [];
                        }
                        
                        const subjectInfo = {
                            _id: classSubject._id,
                            subject: classSubject.subject,
                            teacher: classSubject.teacher,
                            term: classSubject.term,
                            class: classSubject.class
                        };
                        
                        subjectsByTerm[termName].push(subjectInfo);
                        
                        // Categorize subjects
                        if (classSubject.subject.category === 'Core') {
                            const existingCore = coreSubjects.find(s => s.subject._id.toString() === classSubject.subject._id.toString());
                            if (!existingCore) {
                                coreSubjects.push(subjectInfo);
                            }
                        } else {
                            const existingElective = electiveSubjects.find(s => s.subject._id.toString() === classSubject.subject._id.toString());
                            if (!existingElective) {
                                electiveSubjects.push(subjectInfo);
                            }
                        }
                    }
                });
            }

            return {
                ...student,
                currentClass: currentClassEnrollment?.class || null,
                currentClassEnrollment: currentClassEnrollment,
                allClassEnrollments: allClassEnrollments,
                totalSubjects: totalSubjects,
                subjectsByTerm: subjectsByTerm,
                coreSubjects: coreSubjects,
                electiveSubjects: electiveSubjects,
                academicYear: currentClassEnrollment?.academicYear || null
            };
        })
    );

    res.status(200).json({ 
        success: true, 
        count: studentsWithClassesAndSubjects.length, 
        students: studentsWithClassesAndSubjects 
    });
});

// @desc    Get single student by ID
// @route   GET /api/admin/students/:id
// @access  Private (Admin)
exports.getStudentById = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id)
        .populate('parentContacts', 'firstName lastName phoneNumber email')
        .populate('userId', 'email role isActive');

    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const studentClass = await StudentClass.findOne({
        student: student._id,
        status: 'Active'
    }).populate('class');

    res.status(200).json({ success: true, student, currentClass: studentClass });
});

// @desc    Update student profile
// @route   PUT /api/admin/students/:id
// @access  Private (Admin)
exports.updateStudent = asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const {
        parentContactIds, email, password, isActive,
        ...updateData
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    if (parentContactIds) {
        const newIds = parentContactIds.map(String);
        const oldIds = (student.parentContacts || []).map(p => p.toString());

        const toRemove = oldIds.filter(id => !newIds.includes(id));
        const toAdd = newIds.filter(id => !oldIds.includes(id));

        if (toRemove.length)
            await Parent.updateMany({ _id: { $in: toRemove } }, { $pull: { children: student._id } });

        if (toAdd.length) {
            for (const parentId of toAdd) {
                const parent = await Parent.findById(parentId);
                if (!parent) return res.status(404).json({ message: `Parent ${parentId} not found.` });
            }
            await Parent.updateMany({ _id: { $in: toAdd } }, { $addToSet: { children: student._id } });
        }

        student.parentContacts = newIds;
    }

    if (student.userId) {
        const user = await User.findById(student.userId);
        if (user) {
            if (email && email !== user.email) user.email = email;
            if (password) user.password = password;
            if (typeof isActive === 'boolean') user.isActive = isActive;
            await user.save({ validateBeforeSave: false });
        }
    } else if (email && password) {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already taken.' });

        const newUser = await User.create({
            email,
            password,
            role: 'student',
            roleMapping: 'Student',
            profileId: student._id
        });
        student.userId = newUser._id;
    }

    Object.assign(student, updateData);
    if (typeof isActive === 'boolean') student.isActive = isActive;

    await student.save();
    res.status(200).json({ success: true, message: 'Student profile updated', student });
});

// @desc    Delete a student
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin)
exports.deleteStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    await StudentClass.deleteMany({ student: student._id });

    if (student.parentContacts?.length) {
        await Parent.updateMany(
            { _id: { $in: student.parentContacts } },
            { $pull: { children: student._id } }
        );
    }

    if (student.userId) {
        await User.findByIdAndDelete(student.userId);
    }

    await Student.findByIdAndDelete(student._id);

    res.status(200).json({ success: true, message: 'Student and associated data deleted.' });
});

// @desc    Reassign student to another class
// @route   PUT /api/admin/students/:id/assign-class
// @access  Private (Admin)
exports.assignStudentToClass = asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const { classId, academicYear, rollNumber } = req.body;

    if (!classId || !academicYear || !rollNumber) {
        return res.status(400).json({ message: 'classId, academicYear, and rollNumber are required.' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const existingClass = await Class.findById(classId);
    if (!existingClass) return res.status(404).json({ message: 'Class not found.' });

    // Deactivate existing mapping
    await StudentClass.updateMany(
        { student: studentId, status: 'Active' },
        { status: 'Transferred' }
    );

    // Create new mapping
    const newMapping = await StudentClass.create({
        student: studentId,
        class: classId,
        academicYear,
        rollNumber,
        status: 'Active',
        promotionStatus: 'Promoted'
    });

    res.status(200).json({ success: true, message: 'Student reassigned.', studentClass: newMapping });
});

// @desc    Get available electives for a class
// @route   GET /api/admin/students/available-electives/:classId/:academicYear
// @access  Private (Admin)
exports.getAvailableElectives = asyncHandler(async (req, res) => {
    const { classId, academicYear } = req.params;
    
    if (!classId || !academicYear) {
        return res.status(400).json({ 
            success: false, 
            message: 'Class ID and academic year are required' 
        });
    }
    
    try {
        const availableElectives = await getAvailableElectives(classId, academicYear);
        
        if (!availableElectives.success) {
            return res.status(400).json({
                success: false,
                message: availableElectives.message
            });
        }
        
        // Organize electives by groups for easier frontend handling (deduplicated)
        const electivesByGroup = {};
        availableElectives.allElectives.forEach(elective => {
            const group = elective.group;
            if (!electivesByGroup[group]) {
                electivesByGroup[group] = [];
            }
            electivesByGroup[group].push({
                subjectId: elective.subjectId, // Use subject ID for frontend
                classSubjectIds: elective.classSubjectIds, // All ClassSubject IDs for this subject
                name: elective.subject.name,
                code: elective.subject.code,
                group: elective.group,
                termCount: elective.termCount,
                terms: elective.terms.map(t => t.name).join(', ')
            });
        });
        
        res.status(200).json({
            success: true,
            totalElectives: availableElectives.totalElectives,
            electivesByGroup,
            allElectives: availableElectives.allElectives.map(e => ({
                subjectId: e.subjectId,
                classSubjectIds: e.classSubjectIds,
                name: e.subject.name,
                code: e.subject.code,
                group: e.group,
                termCount: e.termCount,
                terms: e.terms.map(t => t.name).join(', ')
            }))
        });
        
    } catch (error) {
        console.error('Error fetching available electives:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available electives: ' + error.message
        });
    }
});

// @desc    Get available core subjects for a class
// @route   GET /api/admin/students/available-core/:classId/:academicYear
// @access  Private (Admin)
exports.getAvailableCoreSubjects = asyncHandler(async (req, res) => {
    const { classId, academicYear } = req.params;
    
    if (!classId || !academicYear) {
        return res.status(400).json({ 
            success: false, 
            message: 'Class ID and academic year are required' 
        });
    }
    
    try {
        const availableCoreSubjects = await getAvailableCoreSubjects(classId, academicYear);
        
        if (!availableCoreSubjects.success) {
            return res.status(400).json({
                success: false,
                message: availableCoreSubjects.message
            });
        }
        
        res.status(200).json({
            success: true,
            totalCoreSubjects: availableCoreSubjects.totalCoreSubjects,
            allCoreSubjects: availableCoreSubjects.allCoreSubjects.map(c => ({
                subjectId: c.subjectId,
                classSubjectIds: c.classSubjectIds,
                name: c.subject.name,
                code: c.subject.code,
                category: c.subject.category,
                termCount: c.termCount,
                terms: c.terms.map(t => t.name).join(', ')
            }))
        });
        
    } catch (error) {
        console.error('Error fetching available core subjects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available core subjects: ' + error.message
        });
    }
});
