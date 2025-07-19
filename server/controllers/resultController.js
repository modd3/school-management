const Result = require('../models/Result');
const { calculateGradeAndPoints } = require('../utils/grading');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Term = require('../models/Term');
const asyncHandler = require('express-async-handler');
const {getStudentResultsByExamType} = require('../utils/examResults');


// @desc    Enter marks for a student in a subject for a term and exam type
// @route   POST /api/teacher/results/enter
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.enterMarks = async (req, res) => {
    const { studentId, classSubjectId, termId, examType, marksObtained, outOf, comment } = req.body;

    if (!studentId || !classSubjectId || !termId || !examType || marksObtained === undefined || outOf === undefined) {
        return res.status(400).json({ message: 'Missing required fields: studentId, subjectId, termId, examType, marksObtained, outOf' });
    }

    try {
        const percentage = (marksObtained / outOf) * 100;
        const { grade, points } = calculateGradeAndPoints(percentage)

        // Check if a result already exists for this student, subject, term, and exam type
        let result = await Result.findOne({ student: studentId, subject: classSubjectId, term: termId, examType });

        if (result) {
            result.marksObtained = marksObtained;
            result.outOf = outOf;
            result.percentage = percentage;     
            result.grade = grade;
            result.points = points;
            result.comment = comment || result.comment;
            await result.save();
            res.status(200).json({ message: 'Marks updated successfully', result });
            await Student.findByIdAndUpdate(studentId, {
                $pull: { results: { subject: classSubjectId, term: termId, examType } } // Remove duplicate
                });
                await Student.findByIdAndUpdate(studentId, {
                $push: {
                    results: {
                    subject: classSubjectId,
                    term: termId,
                    examType,
                    marksObtained,
                    outOf,
                    percentage,
                    grade,
                    points
                    }
                }
                });

        } else {
            result = await Result.create({
                student: studentId,
                subject: classSubjectId,
                term: termId,
                examType,
                marksObtained,
                outOf,
                percentage,
                grade,
                points,
                comment,
                enteredBy: req.user.profileId // assuming req.user.profileId is the teacher's ID
            });
            res.status(201).json({ message: 'Marks entered successfully', result });
        }
    } catch (error) {
        console.error('Error entering/updating marks:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get marks for students in a specific class, subject, term, and exam type
// @route   GET /api/teacher/results/for-entry/:classId/:subjectId/:termId/:examType
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.getMarksForEntry = async (req, res) => {
    const { classId, subjectId, termId, examType } = req.params;

    try {
        const studentsInClass = await Student.find({ currentClass: classId })
            .select('_id firstName lastName admissionNumber')
            .sort('firstName');

        const existingResults = await Result.find({
            student: { $in: studentsInClass.map(s => s._id) },
            subject: subjectId,
            term: termId,
            examType
        }).select('student marksObtained grade points comment');

        const resultsMap = {};
        existingResults.forEach(r => {
            resultsMap[r.student.toString()] = r;
        });

        const studentsWithMarks = studentsInClass.map(student => {
            const result = resultsMap[student._id.toString()];
            return {
                _id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                admissionNumber: student.admissionNumber,
                marksObtained: result ? result.marksObtained : null,
                grade: result ? result.grade : null,
                points: result ? result.points : null,
                comment: result ? result.comment : null,
                resultId: result ? result._id : null
            };
        });

        res.status(200).json(studentsWithMarks);

    } catch (error) {
        console.error('Error fetching marks for entry:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add/Update teacher comment on a specific subject result
// @route   PUT /api/teacher/results/comment/:resultId
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.addSubjectComment = async (req, res) => {
    const { resultId } = req.params;
    const { comment } = req.body;

    if (!comment) {
        return res.status(400).json({ message: 'Comment is required' });
    }

    try {
        const result = await Result.findById(resultId);

        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }

        const subject = await Subject.findById(result.subject);
        if (!subject.assignedTeachers.includes(req.user.profileId)) {
            return res.status(403).json({ message: 'Unauthorized to comment on this result' });
        }

        result.comment = comment;
        await result.save();

        res.status(200).json({ message: 'Subject comment updated successfully', result });
    } catch (error) {
        console.error('Error updating subject comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Get all results for a student in a specific term
// @route   GET /api/teacher/results/student/:studentId/term/:termId
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.getStudentResultsForTerm = async (req, res) => {
    const { studentId, termId } = req.params;

    try {
        const results = await Result.find({ student: studentId, term: termId })
            .populate('subject', 'name')
            .populate('term', 'name')
            .sort('subject.name');

        if (!results.length) {
            return res.status(404).json({ message: 'No results found for this student in the specified term' });
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching student results for term:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Get all results for a class in a specific term
// @route   GET /api/teacher/results/class/:classId/term/:termId
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.getClassResultsForTerm = async (req, res) => {
    const { classId, termId } = req.params;

    try {
        const studentsInClass = await Student.find({ currentClass: classId })
            .select('_id firstName lastName admissionNumber')
            .sort('firstName');

        if (!studentsInClass.length) {
            return res.status(404).json({ message: 'No students found in this class' });
        }

        const results = await Result.find({ student: { $in: studentsInClass.map(s => s._id) }, term: termId })
            .populate('student', 'firstName lastName admissionNumber')
            .populate('subject', 'name')
            .sort('student.firstName');

        if (!results.length) {
            return res.status(404).json({ message: 'No results found for this class in the specified term' });
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching class results for term:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @desc    Publish term results for a class
// @route   POST /api/teacher/results/publish/:classId/:termId
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.publishTermResults = async (req, res) => {
    const { classId, termId } = req.params;

    try {
        const term = await Term.findById(termId);
        if (!term) {
            return res.status(404).json({ message: 'Term not found' });
        }
        if (term.isPublished) {
            return res.status(400).json({ message: 'Results for this term are already published' });
        }
        term.isPublished = true;
        await term.save();
        res.status(200).json({ message: 'Term results published successfully', term });
    }
    catch (error) {
        console.error('Error publishing term results:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


// @desc    Get all results entered by the logged-in teacher
// @route   GET /api/teacher/results/entered-by-me
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.getResultsByTeacher = asyncHandler(async (req, res) => {
    const teacherId = req.user?.profileId;

    if (!teacherId) {
        return res.status(400).json({ success: false, message: 'Teacher profile not found.' });
    }

    const results = await Result.find({ enteredBy: teacherId })
        .populate('student', 'firstName lastName admissionNumber')
        .populate('subject', 'name code')
        .populate('term', 'name year');

    res.status(200).json({
        success: true,
        count: results.length,
        results
    });
});

// @desc get student result for exam type (opener, mid, endterm)

// GET /api/teacher/student-report/:studentId/:termId/:examType
exports.getStudentExamReport = async (req, res) => {
  const { studentId, termId, examType } = req.params;
  try {
    const student = await Student.findById(studentId)
      .populate({
        path: 'currentClass',
        select: 'name stream'
      })
      .lean();

    if (!student) return res.status(404).json({ message: 'Student not found' });

    const results = await getStudentResultsByExamType(studentId, termId, examType);

    const report = {
      student: {
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        class: student.currentClass?.name || 'N/A',
        stream: student.currentClass?.stream || 'N/A',
      },
      examType,
      subjects: results.map(r => ({
        subject: r.subject.name,
        marks: `${r.marksObtained}/${r.outOf}`,
        percentage: ((r.marksObtained / r.outOf) * 100).toFixed(1),
        grade: r.grade,
        points: r.points,
        comment: r.comment || ''
      })),
    };

    res.status(200).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating student report', error: err.message });
  }
};

// GET /api/teacher/broadsheet/:classId/:termId/:examType
exports.getClassBroadsheetByExamType = async (req, res) => {
  const { classId, termId, examType } = req.params;

  try {
    const classObj = await Class.findById(classId).populate('students');
    if (!classObj) return res.status(404).json({ message: 'Class not found' });

    const subjects = await Subject.find().lean();

    const broadsheet = [];

    for (const student of classObj.students) {
      const studentResults = await Result.find({
        student: student._id,
        term: termId,
        examType
      }).populate('subject', 'name');

      const subjectScores = {};
      let total = 0;

      studentResults.forEach(r => {
        const percentage = (r.marksObtained / r.outOf) * 100;
        subjectScores[r.subject.name] = percentage.toFixed(1);
        total += percentage;
      });

      broadsheet.push({
        student: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        ...subjectScores,
        total: total.toFixed(1),
        average: (total / subjects.length).toFixed(1),
      });
    }

    res.status(200).json({ subjects: subjects.map(s => s.name), broadsheet });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating broadsheet', error: err.message });
  }
};



exports.getFinalReportCard = async (req, res) => {
  const studentId = req.params.studentId;
  const { termId } = req.params;

  try {
    // Fetch the student with class info
    const student = await Student.findById(studentId)
      .populate({ path: 'currentClass', select: 'name stream' })
      .lean();

    // Fetch results
    const [openerResults, midtermResults, endtermResults] = await Promise.all([
      Result.find({ student: studentId, term: termId, examType: 'Opener' }).populate('subject', 'name'),
      Result.find({ student: studentId, term: termId, examType: 'Midterm' }).populate('subject', 'name'),
      Result.find({ student: studentId, term: termId, examType: 'Endterm' }).populate('subject', 'name')
    ]);

    console.log('🟦 Opener Subjects:', openerResults.map(r => r.subject?.name || r.subject));
    console.log('🟨 Midterm Subjects:', midtermResults.map(r => r.subject?.name || r.subject));
    console.log('🟥 Endterm Subjects:', endtermResults.map(r => r.subject?.name || r.subject));

    const indexBySubject = (results) => {
      const map = {};
      for (const result of results) {
        const subjectId =
          result.subject?._id?.toString() || result.subject?.toString(); // Supports populated or raw ObjectId
        if (subjectId) {
          map[subjectId] = result;
        } else {
          console.warn('⚠️ Skipping result with missing subject:', result);
        }
      }
      return map;
    };

    const openerMap = indexBySubject(openerResults);
    const midtermMap = indexBySubject(midtermResults);
    const endtermMap = indexBySubject(endtermResults);

    const allSubjectIds = new Set([
      ...Object.keys(openerMap),
      ...Object.keys(midtermMap),
      ...Object.keys(endtermMap),
    ]);

    const finalResults = [];

    for (const subjectId of allSubjectIds) {
      const opener = openerMap[subjectId];
      const midterm = midtermMap[subjectId];
      const endterm = endtermMap[subjectId];

      if (!endterm) {
        console.log(`❌ Skipping subject ${subjectId} (no Endterm marks)`);
        continue; // Endterm is required
      }

      const openerPct = opener ? (opener.marksObtained / opener.outOf) * 100 : 0;
      const midtermPct = midterm ? (midterm.marksObtained / midterm.outOf) * 100 : 0;
      const endtermPct = (endterm.marksObtained / endterm.outOf) * 100;

      const avgMid = (openerPct + midtermPct) / 2;
      const finalPercentage = (avgMid * 0.3) + (endtermPct * 0.7);

      const { grade, points, comment } = calculateGradeAndPoints(Math.round(finalPercentage));

      finalResults.push({
        subject: endterm.subject, // already populated
        finalPercentage: finalPercentage.toFixed(1),
        grade,
        points,
        comment,
        breakdown: {
          opener: openerPct.toFixed(1),
          midterm: midtermPct.toFixed(1),
          endterm: endtermPct.toFixed(1)
        }
      });
    }

    res.json({
      student: {
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        class: student.currentClass?.name || 'N/A',
        stream: student.currentClass?.stream || 'N/A'
      },
      termId,
      finalResults
    });

  } catch (err) {
    console.error('🔥 Error generating final report:', err);
    res.status(500).json({ message: 'Failed to generate final report' });
  }
};
