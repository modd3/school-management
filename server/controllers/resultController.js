const Result = require('../models/Result');
const Student = require('../models/Student');
const asyncHandler = require('express-async-handler');
const Class = require('../models/Class');
const StudentClass = require('../models/StudentClass');
const AcademicCalendar = require('../models/AcademicCalendar');

// @desc    Enter or update marks for a single student's assessment
// @route   POST /api/results
// @access  Private (Teacher)
exports.enterOrUpdateMarks = asyncHandler(async (req, res) => {
    const { studentId, subjectId, classId, academicYear, termNumber, assessmentType, marks, maxMarks, comment } = req.body;
    const enteredBy = req.user._id;

    if (!studentId || !subjectId || !classId || !academicYear || !termNumber || !assessmentType || marks === undefined || maxMarks === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    if (!['cat1', 'cat2', 'endterm'].includes(assessmentType)) {
        return res.status(400).json({ success: false, message: 'Invalid assessment type.' });
    }

    let result = await Result.findOne({
        student: studentId,
        subject: subjectId,
        class: classId,
        academicYear,
        termNumber,
    });

    if (!result) {
        result = new Result({
            student: studentId,
            subject: subjectId,
            class: classId,
            academicYear,
            termNumber,
            enteredBy,
            assessments: {},
        });
    }

    // Prepare assessment data
    const assessmentData = {
        marks,
        maxMarks,
        enteredBy,
        modifiedBy: enteredBy,
        lastModified: Date.now(),
    };
    if (comment) {
        assessmentData.teacherComments = comment;
    }

    result.assessments[assessmentType] = assessmentData;

    // The pre-save middleware in the Result model will handle all calculations
    const updatedResult = await result.save();

    res.status(201).json({
        success: true,
        message: 'Marks entered/updated successfully.',
        data: updatedResult,
    });
});


// @desc    Bulk enter or update marks for multiple students
// @route   POST /api/results/bulk
// @access  Private (Teacher)
exports.bulkEnterMarks = asyncHandler(async (req, res) => {
    const { results, subjectId, classId, academicYear, termNumber, assessmentType, maxMarks } = req.body;
    const enteredBy = req.user._id;

    if (!Array.isArray(results) || results.length === 0 || !subjectId || !classId || !academicYear || !termNumber || !assessmentType || maxMarks === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields for bulk entry.' });
    }

    const bulkOps = results.map(item => {
        const { studentId, marks, comment } = item;

        if (studentId === undefined || marks === undefined) {
            return null;
        }

        const filter = { student: studentId, subject: subjectId, class: classId, academicYear, termNumber };
        const update = {
            $set: {
                [`assessments.${assessmentType}`]: {
                    marks,
                    maxMarks,
                    teacherComments: comment,
                    enteredBy,
                    modifiedBy: enteredBy,
                    lastModified: Date.now(),
                }
            },
            $setOnInsert: { // Only set these fields when creating a new document
                student: studentId,
                subject: subjectId,
                class: classId,
                academicYear,
                termNumber,
                enteredBy,
            }
        };

        return {
            updateOne: {
                filter,
                update,
                upsert: true,
            },
        };
    }).filter(op => op !== null);

    if (bulkOps.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid result data provided.' });
    }

    await Result.bulkWrite(bulkOps);

    // After bulk writing, we need to trigger the pre-save hooks for calculation.
    // This is a limitation of bulkWrite. A workaround is to find and save each document.
    const studentIds = results.map(r => r.studentId);
    const updatedDocs = await Result.find({
        student: { $in: studentIds },
        subject: subjectId,
        class: classId,
        academicYear,
        termNumber,
    });

    for (const doc of updatedDocs) {
        await doc.save();
    }


    res.status(201).json({
        success: true,
        message: 'Bulk marks entry completed successfully.',
    });
});


// @desc    Get all results entered by the logged-in teacher with filtering
// @route   GET /api/teacher/results/entered-by-me
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.getResultsByTeacher = asyncHandler(async (req, res) => {
    const teacherId = req.user?.profileId;

    if (!teacherId) {
        return res.status(400).json({ success: false, message: 'Teacher profile not found.' });
    }

    // Build query filters from request parameters
    const filter = { enteredBy: teacherId };
    
    if (req.query.subjectId) {
        filter.subject = req.query.subjectId;
    }
    
    if (req.query.classId) {
        filter.class = req.query.classId;
    }

    if (req.query.termNumber) {
        filter.termNumber = req.query.termNumber;
    }
    
    if (req.query.academicYear) {
        filter.academicYear = req.query.academicYear;
    }

    let results = await Result.find(filter)
        .populate('student', 'firstName lastName admissionNumber')
        .populate('subject', 'name')
        .populate('class', 'name')
        .sort({ createdAt: -1 }); // Sort by most recent first

    // Client-side search filtering if search query is provided
    if (req.query.search) {
        const searchTerm = req.query.search.toLowerCase().trim();
        results = results.filter(result => {
            const fullName = `${result.student?.firstName || ''} ${result.student?.lastName || ''}`.toLowerCase();
            const admissionNumber = result.student?.admissionNumber?.toLowerCase() || '';
            return fullName.includes(searchTerm) || admissionNumber.includes(searchTerm);
        });
    }

    res.status(200).json({
        success: true,
        count: results.length,
        results: results
    });
});

// @desc Get student result for exam type (cat1, cat2, endterm)
// GET /api/student/report/:academicYear/:termNumber/:examType
exports.getStudentExamReport = async (req, res) => {
  const { academicYear, termNumber, examType } = req.params;
  const studentId = req.user.profileId; // Get student ID from authenticated user

  try {
    const student = await Student.findById(studentId)
      .populate({ path: 'currentClass', select: 'name stream' })
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const results = await Result.find({
      student: studentId,
      academicYear,
      termNumber,
    })
    .populate('subject', 'name code')
    .lean();

    const transformedResults = results.map(result => {
        const assessment = result.assessments[examType];
        if (!assessment) return null;

        return {
            subject: result.subject || { name: 'N/A' },
            marksObtained: assessment.marks,
            outOf: assessment.maxMarks,
            percentage: assessment.percentage,
            grade: assessment.grade,
            points: assessment.points,
            comment: assessment.teacherComments || ''
        }
    }).filter(r => r !== null);

    const report = {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNumber: student.admissionNumber,
        class: student.currentClass?.name || 'N/A',
        stream: student.currentClass?.stream || 'N/A',
      },
      examType,
      results: transformedResults
    };

    res.status(200).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: 'Error generating student report', 
      error: err.message 
    });
  }
};



// @desc    Get final report card for a student
// @route   GET /api/student/final-report/:academicYear/:termNumber
// @access  Private (Student)

exports.getFinalReportCard = asyncHandler(async (req, res) => {
  const studentId = req.user.profileId;
  const { academicYear, termNumber } = req.params;

  try {
    const student = await Student.findById(studentId)
      .populate({ path: 'currentClass', select: 'name stream' })
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const results = await Result.find({ 
        student: studentId, 
        academicYear, 
        termNumber 
    }).populate('subject', 'name');

    const finalResults = results.map(result => {
        return {
          subject: result.subject,
          finalPercentage: result.overallPercentage.toFixed(1),
          grade: result.overallGrade,
          points: result.overallPoints,
          comment: result.teacherComments || '',
          breakdown: {
            cat1: result.assessments.cat1?.percentage.toFixed(1) || 0,
            cat2: result.assessments.cat2?.percentage.toFixed(1) || 0,
            endterm: result.assessments.endterm?.percentage.toFixed(1) || 0,
          }
        };
      });

    res.status(200).json({
      student: {
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        class: student.currentClass?.name || 'N/A',
        stream: student.currentClass?.stream || 'N/A'
      },
      finalResults
    });

  } catch (err) {
    console.error('Error generating final report:', err);
    res.status(500).json({ 
      message: 'Error generating final report', 
      error: err.message 
    });
  }
});

// GET /api/teacher/class-results/:classId/:academicYear/:termNumber/:examType
exports.getClassExamResults = asyncHandler(async (req, res) => {
  const { classId, academicYear, termNumber, examType } = req.params;
  let classObj;

  try {
    if (req.user.role === 'teacher') {
      classObj = await Class.findOne({ classTeacher: req.user._id });

      if (!classObj) {
        return res.status(403).json({
          message: 'You are not assigned as class teacher to any class'
        });
      }

      if (classObj._id.toString() !== classId) {
        return res.status(403).json({
          message: 'You can only view results for your assigned class'
        });
      }
    } else {
      classObj = await Class.findById(classId);
    }

    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const studentClassMappings = await StudentClass.find({ class: classObj._id, academicYear: academicYear, status: 'Active' })
      .populate('student', 'firstName lastName admissionNumber')
      .lean();
    const students = studentClassMappings.map(m => m.student);

    const studentIds = students.map(s => s._id);

    const results = await Result.find({
      student: { $in: studentIds },
      academicYear,
      termNumber,
    }).populate('subject', 'name');

    const studentResults = new Map();
    students.forEach(student => {
      studentResults.set(student._id.toString(), {
        student,
        results: []
      });
    });

    results.forEach(result => {
      const studentEntry = studentResults.get(result.student.toString());
      if (studentEntry) {
        const assessment = result.assessments[examType];
        if(assessment){
            studentEntry.results.push({
              subject: result.subject._id,
              subjectName: result.subject.name,
              marksObtained: assessment.marks,
              outOf: assessment.maxMarks,
              percentage: assessment.percentage,
              grade: assessment.grade,
              points: assessment.points
            });
        }
      }
    });

    const classResults = Array.from(studentResults.values()).map(entry => {
      const totalMarks = entry.results.reduce((sum, r) => sum + r.marksObtained, 0);
      const totalPossible = entry.results.reduce((sum, r) => sum + r.outOf, 0);
      const averagePercentage = totalPossible > 0 
        ? (totalMarks / totalPossible * 100) 
        : 0;
      const {grade, points, comment} = calculateGradeAndPoints(averagePercentage);
      
      return {
        ...entry,
        totalMarks,
        averagePercentage: Number(averagePercentage), 
        grade, 
        points,
        comment
      };
    });

    classResults.sort((a, b) => b.averagePercentage - a.averagePercentage);

    let currentPosition = 1;
    classResults.forEach((result, index) => {
      if (index > 0) {
        const prevResult = classResults[index - 1];
        if (Math.abs(result.averagePercentage - prevResult.averagePercentage) > 0.01 ||
            result.totalMarks !== prevResult.totalMarks) {
          currentPosition = index + 1;
        }
      }
      result.position = currentPosition;
    });

    res.status(200).json({
      class: classObj.name,
      academicYear,
      termNumber,
      examType,
      results: classResults
    });

  } catch (err) {
    console.error('Error fetching class results:', err);
    res.status(500).json({ 
      message: 'Error fetching class results',
      error: err.message 
    });
  }
});

exports.getClassFinalReports = asyncHandler(async (req, res) => {
  const { classId, academicYear, termNumber } = req.params;
  let classObj;

  try {
    if (req.user.role === 'teacher') {
      classObj = await Class.findOne({ classTeacher: req.user._id })

      if (!classObj) {
        return res.status(403).json({
          message: 'You are not assigned as class teacher to any class'
        });
      }

      if (classObj._id.toString() !== classId) {
        return res.status(403).json({
          message: 'You can only view results for your assigned class'
        });
      }
    } else {
      classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({ message: 'Class not found' });
      }
    }

    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const studentClassMappings = await StudentClass.find({ class: classObj._id, academicYear: academicYear, status: 'Active' })
      .populate('student', 'firstName lastName admissionNumber')
      .lean();
    const students = studentClassMappings.map(m => m.student);

    const studentIds = students.map(s => s._id);

    const results = await Result.find({
      student: { $in: studentIds },
      academicYear,
      termNumber
    }).populate('subject', 'name');

    const studentReports = new Map();
    students.forEach(student => {
      studentReports.set(student._id.toString(), {
        student,
        finalResults: []
      });
    });

    results.forEach(result => {
      const report = studentReports.get(result.student.toString());
      if (report) {
        report.finalResults.push({
          subject: result.subject._id,
          subjectName: result.subject.name,
          finalPercentage: result.overallPercentage,
          grade: result.overallGrade,
          points: result.overallPoints,
          breakdown: {
            cat1: result.assessments.cat1?.percentage || 0,
            cat2: result.assessments.cat2?.percentage || 0,
            endterm: result.assessments.endterm?.percentage || 0
          }
        });
      }
    });

    studentReports.forEach(report => {
      const totalPoints = report.finalResults.reduce((sum, r) => sum + r.points, 0);
      const totalMarks = report.finalResults.reduce((sum, r) => sum + r.finalPercentage, 0);
      
      report.totalMarks = Number(totalMarks);
      
      const averageMarks = report.finalResults.length 
        ? (totalMarks / report.finalResults.length) 
        : 0;
      
      const overallGradeData = calculateGradeAndPoints(averageMarks);
      report.averageMarks = Number(averageMarks);
      report.overallGrade = overallGradeData.grade;
      report.overallPoints = overallGradeData.points;
    });

    const classReports = Array.from(studentReports.values());
    classReports.sort((a, b) => b.averageMarks - a.averageMarks);

    let currentPosition = 1;
    classReports.forEach((report, index) => {
      if (index > 0) {
        const prevReport = classReports[index - 1];
        if (Math.abs(report.averageMarks - prevReport.averageMarks) > 0.01 ||
            Math.abs(report.totalMarks - prevReport.totalMarks) > 0.01) {
          currentPosition = index + 1;
        }
      }
      report.position = currentPosition;
    });

    res.status(200).json({
      class: classObj.name,
      academicYear,
      termNumber,
      reports: classReports
    });

  } catch (err) {
    console.error('Error fetching class final reports:', err);
    res.status(500).json({ 
      message: 'Error fetching class final reports',
      error: err.message 
    });
  }
});
