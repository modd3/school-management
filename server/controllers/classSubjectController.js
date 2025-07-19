// server/controllers/classSubjectController.js

const ClassSubject = require('../models/ClassSubject');
const StudentClass = require('../models/StudentClass');

// @desc    Assign a subject to a teacher in a class
// @route   POST /api/admin/class-subjects
// @access  Admin
exports.assignSubjectToTeacher = async (req, res) => {
  try {
    const { classId, subjectId, teacherId, academicYear, term } = req.body;

    const exists = await ClassSubject.findOne({
      class: classId,
      subject: subjectId,
      teacher: teacherId,
      academicYear,
      term,
    });

    if (exists) {
      return res.status(400).json({ message: 'Assignment already exists.' });
    }

    const assignment = await ClassSubject.create({
      class: classId,
      subject: subjectId,
      teacher: teacherId,
      academicYear,
      term,
    });

    res.status(201).json({ success: true, classSubject: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update a class-subject assignment
// @route   PUT /api/admin/class-subjects/:id
// @access  Admin
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { classId, subjectId, teacherId, academicYear, term } = req.body;

    const current = await ClassSubject.findById(id);
    if (!current) return res.status(404).json({ message: 'Assignment not found.' });

    const duplicate = await ClassSubject.findOne({
      _id: { $ne: id },
      class: classId,
      subject: subjectId,
      teacher: teacherId,
      academicYear,
      term,
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Duplicate assignment exists.' });
    }

    current.class = classId || current.class;
    current.subject = subjectId || current.subject;
    current.teacher = teacherId || current.teacher;
    current.academicYear = academicYear || current.academicYear;
    current.term = term || current.term;

    await current.save();

    res.status(200).json({ success: true, classSubject: current });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a class-subject assignment
// @route   DELETE /api/admin/class-subjects/:id
// @access  Admin
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ClassSubject.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Assignment not found.' });

    res.status(200).json({ success: true, message: 'Assignment deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all assignments for a teacher
// @route   GET /api/admin/class-subjects/teacher/:teacherId
// @access  Admin/Teacher
exports.getSubjectsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYear, term } = req.query;

    const filter = {
      teacher: teacherId,
      ...(academicYear && { academicYear }),
      ...(term && { term }),
    };

    const results = await ClassSubject.find(filter)
      .populate('class')
      .populate('subject');

    res.status(200).json({ success: true, count: results.length, classSubjects: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all assignments for a class
// @route   GET /api/admin/class-subjects/class/:classId
// @access  Admin/Teacher
exports.getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { academicYear, term } = req.query;

    const filter = {
      class: classId,
      ...(academicYear && { academicYear }),
      ...(term && { term }),
    };

    const results = await ClassSubject.find(filter)
      .populate('subject')
      .populate('teacher');

    res.status(200).json({ success: true, count: results.length, classSubjects: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Enroll a student in a subject
// @route   POST /api/admin/class-subjects/enroll
// @access  Admin/Teacher
exports.enrollStudentInSubject = async (req, res) => {
  try {
    let { studentId, classSubjectId, academicYear } = req.body;

    if (!academicYear) {
      const now = new Date();
      academicYear = now.getFullYear().toString();
    }

    const mapping = await StudentClass.findOne({
      student: studentId,
      academicYear,
      status: 'Active',
    });

    if (!mapping) {
      return res.status(404).json({ message: 'Student not enrolled in this class for the academic year.' });
    }

    if (mapping.subjects.includes(classSubjectId)) {
      return res.status(400).json({ message: 'Student already enrolled in this subject.' });
    }

    mapping.subjects.push(classSubjectId);
    await mapping.save();

    res.status(200).json({ success: true, message: 'Student enrolled.', studentClass: mapping });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all students enrolled in a subject
// @route   GET /api/admin/class-subjects/:classSubjectId/students?academicYear=2025
// @access  Admin/Teacher
exports.getStudentsInSubject = async (req, res) => {
  try {
    const { classSubjectId } = req.params;
    const { academicYear } = req.query;

    const mappings = await StudentClass.find({
      academicYear,
      status: 'Active',
      subjects: classSubjectId,
    }).populate('student');

    const students = mappings.map(m => m.student);

    res.status(200).json({ success: true, count: students.length, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
