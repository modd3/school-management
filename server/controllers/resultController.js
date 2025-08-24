const Result = require('../models/Result');
const { calculateGradeAndPoints } = require('../utils/grading');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Term = require('../models/Term');
const asyncHandler = require('express-async-handler');
const {getStudentResultsByExamType} = require('../utils/examResults');
const Class = require('../models/Class')
const StudentClass = require('../models/StudentClass');


// @desc    Enter marks for a student in a subject for a term and exam type
// @route   POST /api/teacher/results/enter
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.enterMarks = async (req, res) => {
    const { studentId, classSubjectId, termId, academicYear, examType, marksObtained, outOf, comment} = req.body;

    if (!studentId || !classSubjectId || !termId || !examType || marksObtained === undefined || outOf === undefined) {
        return res.status(400).json({ message: 'Missing required fields: studentId, classSubjectId, termId, examType, marksObtained, outOf' });
    }

    try {
        const percentage = (marksObtained / outOf) * 100;
        const { grade, points } = calculateGradeAndPoints(percentage);

        // Check if a result already exists for this student, classSubject, term, and exam type
        let result = await Result.findOne({ 
            student: studentId, 
            classSubject: classSubjectId,  // Fixed: use classSubject instead of subject
            term: termId, 
            examType 
        });

        if (result) {
            // Update existing result
            result.marksObtained = marksObtained;
            result.outOf = outOf;
            result.percentage = percentage;     
            result.grade = grade;
            result.points = points;
            result.comment = comment || result.comment;
            await result.save();
            
            res.status(200).json({ message: 'Marks updated successfully', result });
            
            // Update student's results array (if you're maintaining this)
            await Student.findByIdAndUpdate(studentId, {
                $pull: { results: { classSubject: classSubjectId, term: termId, examType } } // Remove duplicate
            });
            await Student.findByIdAndUpdate(studentId, {
                $push: {
                    results: {
                        classSubject: classSubjectId,  // Fixed: use classSubject
                        term: termId,
                        examType,
                        marksObtained,
                        outOf,
                        percentage,
                        grade,
                        points,
                        academicYear,
                    }
                }
            });

        } else {
            // Create new result
            result = await Result.create({
                student: studentId,
                classSubject: classSubjectId,  // Fixed: use classSubject instead of subject
                term: termId,
                examType,
                marksObtained,
                outOf,
                percentage,
                grade,
                points,
                comment,
                academicYear,
                enteredBy: req.user.profileId // assuming req.user.profileId is the teacher's ID
            });
            
            res.status(201).json({ message: 'Marks entered successfully', result });
        }
    } catch (error) {
        console.error('Error entering/updating marks:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


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
    
    // Filter by classSubjectId if provided
    if (req.query.classSubjectId) {
        filter.classSubject = req.query.classSubjectId;
    }
    
    // Filter by termId if provided
    if (req.query.termId) {
        filter.term = req.query.termId;
    }
    
    // Filter by academicYear if provided
    if (req.query.academicYear) {
        filter.academicYear = req.query.academicYear;
    }

    let results = await Result.find(filter)
        .populate({
            path: 'student',
            select: 'firstName lastName admissionNumber'
        })
        .populate({
            path: 'classSubject',
            populate: [
                { path: 'class', select: 'name' },
                { path: 'subject', select: 'name' }
            ]
        })
        .populate('term', 'name')
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

    // Transform results to include flattened class and subject data
    const transformedResults = results.map(result => ({
        _id: result._id,
        student: result.student,
        class: result.classSubject?.class,
        subject: result.classSubject?.subject,
        term: result.term,
        examType: result.examType,
        marksObtained: result.marksObtained,
        outOf: result.outOf,
        percentage: result.percentage,
        grade: result.grade,
        points: result.points,
        comment: result.comment,
        academicYear: result.academicYear,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
    }));

    res.status(200).json({
        success: true,
        count: transformedResults.length,
        results: transformedResults
    });
});

// @desc Get student result for exam type (opener, mid, endterm)
// GET /api/student/report/:termId/:examType
exports.getStudentExamReport = async (req, res) => {
  const { termId, examType } = req.params;
  const studentId = req.user.profileId; // Get student ID from authenticated user

  try {
    // Validate termId format
    if (!termId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: 'Invalid term ID format',
        error: 'Term ID must be a valid MongoDB ObjectId'
      });
    }

    // Get student info with class details
    const student = await Student.findById(studentId)
      .populate({
        path: 'currentClass',
        select: 'name stream'
      })
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get results with proper population
    const results = await Result.find({
      student: studentId,
      term: termId,
      examType
    })
    .populate({
      path: 'classSubject',
      populate: {
        path: 'subject',
        select: 'name code'
      }
    })
    .lean();

    // Transform results for frontend
    const transformedResults = results.map(result => ({
      subject: result.classSubject?.subject || { name: 'N/A' },
      marksObtained: result.marksObtained,
      outOf: result.outOf,
      percentage: result.percentage,
      grade: result.grade,
      points: result.points,
      comment: result.comment || ''
    }));

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
// @route   GET /api/student/final-report/:termId
// @access  Private (Student)

exports.getFinalReportCard = asyncHandler(async (req, res) => {
  const studentId = req.user.profileId;
  const { termId } = req.params;

  try {
    // Validate termId format
    if (!termId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: 'Invalid term ID format',
        error: 'Term ID must be a valid MongoDB ObjectId'
      });
    }

    // Fetch the student with class info
    const student = await Student.findById(studentId)
      .populate({ 
        path: 'currentClass', 
        select: 'name stream' 
      })
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Fetch results with proper population
    const [openerResults, midtermResults, endtermResults] = await Promise.all([
      Result.find({ 
        student: studentId, 
        term: termId, 
        examType: 'Opener' 
      }).populate({
        path: 'classSubject',
        populate: {
          path: 'subject',
          select: 'name'
        }
      }),
      Result.find({ 
        student: studentId, 
        term: termId, 
        examType: 'Midterm' 
      }).populate({
        path: 'classSubject',
        populate: {
          path: 'subject',
          select: 'name'
        }
      }),
      Result.find({ 
        student: studentId, 
        term: termId, 
        examType: 'Endterm' 
      }).populate({
        path: 'classSubject',
        populate: {
          path: 'subject',
          select: 'name'
        }
      })
    ]);

    // Create a map of results by subject ID
    const resultsBySubject = {};

    // Helper function to process results
    const processResults = (results, examType) => {
      results.forEach(result => {
        if (result.classSubject?.subject) {
          const subjectId = result.classSubject.subject._id.toString();
          
          if (!resultsBySubject[subjectId]) {
            resultsBySubject[subjectId] = {
              subject: result.classSubject.subject,
              opener: null,
              midterm: null,
              endterm: null
            };
          }
          
          resultsBySubject[subjectId][examType.toLowerCase()] = result;
        }
      });
    };

    // Process each exam type
    processResults(openerResults, 'opener');
    processResults(midtermResults, 'midterm');
    processResults(endtermResults, 'endterm');

    // Calculate final results
    const finalResults = Object.values(resultsBySubject)
      .filter(subjectData => subjectData.endterm) // Only include subjects with endterm
      .map(({ subject, opener, midterm, endterm }) => {
        // Calculate percentages
        const openerPct = opener ? (opener.marksObtained / opener.outOf) * 100 : 0;
        const midtermPct = midterm ? (midterm.marksObtained / midterm.outOf) * 100 : 0;
        const endtermPct = (endterm.marksObtained / endterm.outOf) * 100;

        // Calculate final percentage
        const avgMid = (openerPct + midtermPct) / 2;
        const finalPercentage = (avgMid * 0.3) + (endtermPct * 0.7);

        const { grade, points } = calculateGradeAndPoints(finalPercentage);

        return {
          subject,
          finalPercentage: finalPercentage.toFixed(1),
          grade,
          points,
          comment: endterm.comment || '',
          breakdown: {
            opener: openerPct.toFixed(1),
            midterm: midtermPct.toFixed(1),
            endterm: endtermPct.toFixed(1)
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

// GET /api/teacher/class-results/:classId/:termId/:examType

// Fixed getClassExamResults function
exports.getClassExamResults = asyncHandler(async (req, res) => {
  const { classId, termId, examType } = req.params;
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
      // For admins, fetch the class normally
      classObj = await Class.findById(classId);
    }

    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const term = await Term.findById(termId);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    const studentClassMappings = await StudentClass.find({ class: classObj._id, academicYear: term.academicYear, status: 'Active' })
      .populate('student', 'firstName lastName admissionNumber')
      .lean();
    const students = studentClassMappings.map(m => m.student);

    const studentIds = students.map(s => s._id);

    const results = await Result.find({
      student: { $in: studentIds },
      term: termId,
      examType
    }).populate({
      path: 'classSubject',
      populate: {
        path: 'subject',
        select: 'name'
      }
    });

    // Group results by student
    const studentResults = new Map();
    students.forEach(student => {
      studentResults.set(student._id.toString(), {
        student,
        results: []
      });
    });

    // Map results to students
    results.forEach(result => {
      const studentEntry = studentResults.get(result.student.toString());
      if (studentEntry) {
        studentEntry.results.push({
          subject: result.classSubject?.subject?._id || result.classSubject?.subject,
          subjectName: result.classSubject?.subject?.name || 'Unknown',
          marksObtained: result.marksObtained,
          outOf: result.outOf,
          percentage: result.percentage,
          grade: result.grade,
          points: result.points
        });
      }
    });

    // Calculate totals and averages
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
        averagePercentage: Number(averagePercentage), // Keep as number for sorting
        grade, 
        points,
        comment
      };
    });

    // Sort by average percentage (descending) - FIXED: using numeric values
    classResults.sort((a, b) => {
      // Primary sort by average percentage (descending)
      const percentageDiff = b.averagePercentage - a.averagePercentage;
      if (Math.abs(percentageDiff) > 0.01) return percentageDiff; // Allow for small floating point differences
      
      // Secondary sort by total marks as tiebreaker (descending)
      return b.totalMarks - a.totalMarks;
    });

    // Assign positions with proper tie handling
    let currentPosition = 1;
    classResults.forEach((result, index) => {
      if (index > 0) {
        const prevResult = classResults[index - 1];
        // Check if current result has same average percentage as previous
        if (Math.abs(result.averagePercentage - prevResult.averagePercentage) > 0.01 ||
            result.totalMarks !== prevResult.totalMarks) {
          currentPosition = index + 1;
        }
      }
      result.position = currentPosition;
    });

    res.status(200).json({
      class: classObj.name,
      term: term.name,
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

// Fixed getClassFinalReports function
exports.getClassFinalReports = asyncHandler(async (req, res) => {
  const { classId, termId } = req.params;
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
      // For admins, fetch the class normally
      classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({ message: 'Class not found' });
      }
    }

    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const term = await Term.findById(termId);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    const studentClassMappings = await StudentClass.find({ class: classObj._id, academicYear: term.academicYear, status: 'Active' })
      .populate('student', 'firstName lastName admissionNumber')
      .lean();
    const students = studentClassMappings.map(m => m.student);

    const studentIds = students.map(s => s._id);

    // Fetch all results for all students
    const results = await Result.find({
      student: { $in: studentIds },
      term: termId
    }).populate({
      path: 'classSubject',
      populate: {
        path: 'subject',
        select: 'name'
      }
    });

    // Organize results by student and exam type
    const studentReports = new Map();
    students.forEach(student => {
      studentReports.set(student._id.toString(), {
        student,
        opener: [],
        midterm: [],
        endterm: [],
        finalResults: []
      });
    });

    // Categorize results
    results.forEach(result => {
      const report = studentReports.get(result.student.toString());
      if (report) {
        const subjectResult = {
          subject: result.classSubject?.subject?._id || result.classSubject?.subject,
          subjectName: result.classSubject?.subject?.name || 'Unknown',
          marksObtained: result.marksObtained,
          outOf: result.outOf,
          percentage: result.percentage
        };

        switch(result.examType) {
          case 'Opener': report.opener.push(subjectResult); break;
          case 'Midterm': report.midterm.push(subjectResult); break;
          case 'Endterm': report.endterm.push(subjectResult); break;
        }
      }
    });

    // Calculate final results
    studentReports.forEach(report => {
      // Create a map for final results by subject ID
      const subjectMap = new Map();
      
      // Process all exam types
      ['opener', 'midterm', 'endterm'].forEach(examType => {
        report[examType].forEach(subjectResult => {
          const subjectId = subjectResult.subject.toString();
          const subjectName = subjectResult.subjectName;
          
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              subject: subjectId,
              subjectName: subjectName,
              opener: 0,
              midterm: 0,
              endterm: 0
            });
          }
          
          const entry = subjectMap.get(subjectId);
          entry[examType] = subjectResult.percentage;
        });
      });

      // Calculate final percentage for each subject
      subjectMap.forEach((subjectData, subjectId) => {
        const avgMid = (subjectData.opener + subjectData.midterm) / 2;
        const finalPercentage = (avgMid * 0.3) + (subjectData.endterm * 0.7);
        const { grade, points } = calculateGradeAndPoints(finalPercentage);
        
        report.finalResults.push({
          subject: subjectId,
          subjectName: subjectData.subjectName,
          finalPercentage: Number(finalPercentage), // Keep as number
          grade,
          points,
          breakdown: {
            opener: subjectData.opener,
            midterm: subjectData.midterm,
            endterm: subjectData.endterm
          }
        });
      });

      // Calculate totals and averages
      const totalPoints = report.finalResults.reduce((sum, r) => sum + r.points, 0);
      const totalMarks = report.finalResults.reduce((sum, r) => sum + r.finalPercentage, 0);
      
      // Total marks (sum of all percentages)
      report.totalMarks = Number(totalMarks);
      
      // Overall grade based on average of total marks
      const averageMarks = report.finalResults.length 
        ? (totalMarks / report.finalResults.length) 
        : 0;
      
      const overallGradeData = calculateGradeAndPoints(averageMarks);
      report.averageMarks = Number(averageMarks);
      report.overallGrade = overallGradeData.grade;
      report.overallPoints = overallGradeData.points;
    });

    // Convert to array and sort by average marks (descending) - FIXED
    const classReports = Array.from(studentReports.values());
    classReports.sort((a, b) => {
      // Primary sort by average marks (descending)
      const marksDiff = b.averageMarks - a.averageMarks;
      if (Math.abs(marksDiff) > 0.01) return marksDiff;
      
      // Secondary sort by total marks if average is equal (descending)
      const totalDiff = b.totalMarks - a.totalMarks;
      if (Math.abs(totalDiff) > 0.01) return totalDiff;
      
      // Tertiary sort by overall points (descending)
      return b.overallPoints - a.overallPoints;
    });

    // Assign positions with proper tie handling
    let currentPosition = 1;
    classReports.forEach((report, index) => {
      if (index > 0) {
        const prevReport = classReports[index - 1];
        // Check if current report has different average marks than previous
        if (Math.abs(report.averageMarks - prevReport.averageMarks) > 0.01 ||
            Math.abs(report.totalMarks - prevReport.totalMarks) > 0.01) {
          currentPosition = index + 1;
        }
      }
      report.position = currentPosition;
    });

    res.status(200).json({
      class: classObj.name,
      term: term.name,
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

// @desc Get student exam position (for exam report pages)
// GET /api/student/exam-position/:classId/:termId/:examType
exports.getStudentExamPosition = async (req, res) => {
  const { classId, termId, examType } = req.params;
  const studentId = req.user.profileId;
  
  try {
    const term = await Term.findById(termId);
    if (!term) return res.status(404).json({ message: 'Term not found' });

    const studentClassMappings = await StudentClass.find({ 
      class: classId, 
      academicYear: term.academicYear, 
      status: 'Active' 
    });
    const studentIds = studentClassMappings.map(m => m.student);

    // Fetch all results for these students for the specific term and exam type
    const results = await Result.find({
      student: { $in: studentIds },
      term: termId,
      examType
    }).populate({
      path: 'classSubject',
      populate: {
        path: 'subject',
        select: 'name'
      }
    });

    // Calculate average percentage for each student (same as class results page)
    const studentAverages = {};
    studentIds.forEach(id => { 
      studentAverages[id.toString()] = { 
        totalMarks: 0, 
        totalPossible: 0, 
        averagePercentage: 0 
      }; 
    });

    results.forEach(result => {
      const studentKey = result.student.toString();
      if (studentAverages[studentKey] !== undefined) {
        studentAverages[studentKey].totalMarks += result.marksObtained;
        studentAverages[studentKey].totalPossible += result.outOf;
      }
    });

    // Calculate average percentages
    Object.keys(studentAverages).forEach(studentKey => {
      const student = studentAverages[studentKey];
      if (student.totalPossible > 0) {
        student.averagePercentage = (student.totalMarks / student.totalPossible) * 100;
      }
    });

    // Build array and sort by average percentage descending (same as class results)
    const sorted = Object.entries(studentAverages)
      .map(([id, data]) => ({
        id,
        averagePercentage: data.averagePercentage,
        totalMarks: data.totalMarks
      }))
      .sort((a, b) => {
        // Primary sort by average percentage (descending)
        const percentageDiff = b.averagePercentage - a.averagePercentage;
        if (Math.abs(percentageDiff) > 0.01) return percentageDiff;
        
        // Secondary sort by total marks as tiebreaker (descending)
        return b.totalMarks - a.totalMarks;
      });

    // Find position for current student
    const positionIndex = sorted.findIndex(s => s.id === studentId.toString());
    const position = positionIndex >= 0 ? positionIndex + 1 : null;
    const outOf = sorted.length;

    res.json({ position, outOf });
  } catch (err) {
    console.error('Error fetching student exam position:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc Get student class position for final reports
// GET /api/student/class-position/:classId/:termId
exports.getStudentClassPosition = async (req, res) => {
  const { classId, termId } = req.params;
  const studentId = req.user.profileId;
  
  try {
    const term = await Term.findById(termId);
    if (!term) return res.status(404).json({ message: 'Term not found' });

    const studentClassMappings = await StudentClass.find({ 
      class: classId, 
      academicYear: term.academicYear, 
      status: 'Active' 
    });
    const studentIds = studentClassMappings.map(m => m.student);

    // Fetch all results for these students for the term
    const results = await Result.find({
      student: { $in: studentIds },
      term: termId
    }).populate({
      path: 'classSubject',
      populate: {
        path: 'subject',
        select: 'name'
      }
    });

    // Calculate final average marks for each student (same as class final reports)
    const studentReports = {};
    studentIds.forEach(id => {
      studentReports[id.toString()] = {
        opener: [],
        midterm: [],
        endterm: [],
        finalResults: [],
        averageMarks: 0
      };
    });

    // Categorize results by exam type
    results.forEach(result => {
      const studentKey = result.student.toString();
      const report = studentReports[studentKey];
      if (report) {
        const subjectResult = {
          subject: result.classSubject?.subject?._id || result.classSubject?.subject,
          subjectName: result.classSubject?.subject?.name || 'Unknown',
          marksObtained: result.marksObtained,
          outOf: result.outOf,
          percentage: result.percentage
        };

        switch(result.examType) {
          case 'Opener': report.opener.push(subjectResult); break;
          case 'Midterm': report.midterm.push(subjectResult); break;
          case 'Endterm': report.endterm.push(subjectResult); break;
        }
      }
    });

    // Calculate final results and average marks for each student
    Object.keys(studentReports).forEach(studentKey => {
      const report = studentReports[studentKey];
      const subjectMap = new Map();
      
      // Process all exam types
      ['opener', 'midterm', 'endterm'].forEach(examType => {
        report[examType].forEach(subjectResult => {
          const subjectId = subjectResult.subject.toString();
          const subjectName = subjectResult.subjectName;
          
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              subject: subjectId,
              subjectName: subjectName,
              opener: 0,
              midterm: 0,
              endterm: 0
            });
          }
          
          const entry = subjectMap.get(subjectId);
          entry[examType] = subjectResult.percentage;
        });
      });

      // Calculate final percentage for each subject
      subjectMap.forEach((subjectData, subjectId) => {
        const avgMid = (subjectData.opener + subjectData.midterm) / 2;
        const finalPercentage = (avgMid * 0.3) + (subjectData.endterm * 0.7);
        
        report.finalResults.push({
          subject: subjectId,
          subjectName: subjectData.subjectName,
          finalPercentage: Number(finalPercentage)
        });
      });

      // Calculate average marks
      const totalMarks = report.finalResults.reduce((sum, r) => sum + r.finalPercentage, 0);
      report.averageMarks = report.finalResults.length 
        ? (totalMarks / report.finalResults.length) 
        : 0;
    });

    // Build array and sort by average marks descending (same as class final reports)
    const sorted = Object.entries(studentReports)
      .map(([id, report]) => ({
        id,
        averageMarks: report.averageMarks,
        totalMarks: report.finalResults.reduce((sum, r) => sum + r.finalPercentage, 0)
      }))
      .sort((a, b) => {
        // Primary sort by average marks (descending)
        const marksDiff = b.averageMarks - a.averageMarks;
        if (Math.abs(marksDiff) > 0.01) return marksDiff;
        
        // Secondary sort by total marks if average is equal (descending)
        const totalDiff = b.totalMarks - a.totalMarks;
        if (Math.abs(totalDiff) > 0.01) return totalDiff;
        
        return 0;
      });

    // Find position for current student
    const positionIndex = sorted.findIndex(s => s.id === studentId.toString());
    const position = positionIndex >= 0 ? positionIndex + 1 : null;
    const outOf = sorted.length;

    res.json({ position, outOf });
  } catch (err) {
    console.error('Error fetching student class position:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};