const StudentClass = require('../models/StudentClass');
const Class = require('../models/Class');
const Term = require('../models/Term');

exports.getStudentClassInfo = async (req, res) => {
  const { studentId, termId } = req.query;
  if (!studentId || !termId) {
    return res.status(400).json({ error: 'studentId and termId are required' });
  }

  try {
    // Find StudentClass relation for this student and term
    const studentClass = await StudentClass.findOne({ student: studentId, term: termId })
      .populate('class')
      .populate('term');

    if (!studentClass) {
      return res.json({});
    }

    res.json({
      class: studentClass.class ? {
        _id: studentClass.class._id,
        name: studentClass.class.name,
        stream: studentClass.class.stream ? [studentClass.class.stream] : []
      } : null,
      academicYear: studentClass.term ? studentClass.term.academicYear : null
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