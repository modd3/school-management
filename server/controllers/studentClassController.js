const StudentClass = require('../models/StudentClass');
const Class = require('../models/Class');
// const Term = require('../models/Term'); // Removed

exports.getStudentClassInfo = async (req, res) => {
  const { studentId, academicYear, termNumber } = req.query;
  if (!studentId || !academicYear || !termNumber) {
    return res.status(400).json({ error: 'studentId, academicYear, and termNumber are required' });
  }

  try {
    // Find StudentClass relation for this student and term
    const studentClass = await StudentClass.findOne({ student: studentId, academicYear, termNumber })
      .populate('class');
      // .populate('term'); // Removed

    if (!studentClass) {
      return res.json({});
    }

    res.json({
      class: studentClass.class ? {
        _id: studentClass.class._id,
        name: studentClass.class.name,
        stream: studentClass.class.stream ? [studentClass.class.stream] : []
      } : null,
      academicYear: studentClass.academicYear // Directly use academicYear from StudentClass
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getStudentClassByYear = async (req, res) => {
  try {
    const { studentId, academicYear } = req.query;
    if (!studentId || !academicYear) {
      return res.status(400).json({ message: 'studentId and academicYear required' });
    }
    const studentClass = await StudentClass.findOne({
      student: studentId,
      academicYear,
      status: 'Active'
    }).populate('class', 'name stream');
    res.json({ studentClass });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};