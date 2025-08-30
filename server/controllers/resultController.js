// controllers/resultController.js - Enhanced Version
const Result = require('../models/Result');
const Student = require('../models/Student');
const GradingScale = require('../models/GradingScale');
const AcademicCalendar = require('../models/AcademicCalendar');
const StudentProgress = require('../models/StudentProgress');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Enter or update marks with enhanced analytics
// @route   POST /api/results
// @access  Private (Teacher)
const enterOrUpdateMarks = asyncHandler(async (req, res) => {
    const { 
        studentId, 
        subjectId, 
        classId, 
        academicYear, 
        termNumber, 
        assessmentType, 
        marks, 
        maxMarks, 
        comment,
        gradingScaleId 
    } = req.body;

    const enteredBy = req.user._id;

    // Enhanced validation
    if (!studentId || !subjectId || !classId || !academicYear || !termNumber || !assessmentType || marks === undefined || maxMarks === undefined) {
        return res.status(400).json({
            success: false, 
            message: 'Missing required fields.',
            required: ['studentId', 'subjectId', 'classId', 'academicYear', 'termNumber', 'assessmentType', 'marks', 'maxMarks']
        });
    }

    // Validate assessment type
    const validAssessments = ['cat1', 'cat2', 'mid_term', 'end_term', 'project', 'assignment'];
    if (!validAssessments.includes(assessmentType)) {
        return res.status(400).json({
            success: false, 
            message: `Invalid assessment type. Valid types: ${validAssessments.join(', ')}` 
        });
    }

    // Validate marks range
    if (marks < 0 || marks > maxMarks) {
        return res.status(400).json({
            success: false, 
            message: 'Marks must be between 0 and maximum marks' 
        });
    }

    // Check if current term allows result entry
    const activeCalendar = await AcademicCalendar.getActiveYear();
    if (activeCalendar) {
        const currentTerm = activeCalendar.terms.find(t => t.termNumber === termNumber);
        if (currentTerm && currentTerm.settings.resultEntryDeadline && 
            new Date() > currentTerm.settings.resultEntryDeadline) {
            return res.status(403).json({
                success: false, 
                message: 'Result entry deadline has passed for this term'
            });
        }
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
            gradingScale: gradingScaleId || null
        });
    }

    // Get appropriate grading scale
    let gradingScale;
    if (gradingScaleId) {
        gradingScale = await GradingScale.findById(gradingScaleId);
    } else {
        // Get default grading scale for this class level
        const student = await Student.findById(studentId).populate('currentClass');
        const academicLevel = student.currentClass.grade <= 8 ? 'primary' : 'secondary';
        gradingScale = await GradingScale.getDefault(academicLevel);
    }

    // Calculate percentage and grade
    const percentage = (marks / maxMarks) * 100;
    let gradeInfo = { grade: 'F', points: 0, remarks: 'Poor' };
    
    if (gradingScale) {
        gradeInfo = gradingScale.getGradeInfo(percentage, subjectId);
        result.gradingScale = gradingScale._id;
    }

    // Enhanced assessment data with analytics
    const assessmentData = {
        marks,
        maxMarks,
        percentage: gradeInfo.percentage,
        grade: gradeInfo.grade,
        points: gradeInfo.points,
        remarks: gradeInfo.remarks,
        teacherComments: comment,
        enteredBy,
        enteredDate: new Date(),
        modifiedBy: enteredBy,
        lastModified: new Date(),
        
        // Analytics data
        analytics: {
            timeSpent: req.body.timeSpent || null, // Optional: time student spent on assessment
            difficulty: req.body.difficulty || 'medium', // Easy, Medium, Hard
            attempts: req.body.attempts || 1,
            submissionStatus: req.body.submissionStatus || 'on_time' // on_time, late, very_late
        }
    };

    result.assessments.set(assessmentType, assessmentData);
    
    // Trigger recalculation (this will be handled by pre-save middleware)
    const updatedResult = await result.save();

    // Update student progress asynchronously
    updateStudentProgress(studentId, academicYear);

    res.status(201).json({
        success: true,
        message: 'Marks entered/updated successfully.',
        data: {
            result: updatedResult,
            gradeInfo: gradeInfo,
            analytics: {
                classAverage: await calculateClassAverage(classId, subjectId, academicYear, termNumber, assessmentType),
                studentRank: await calculateStudentRank(studentId, classId, subjectId, academicYear, termNumber, assessmentType),
                improvementTrend: await calculateImprovementTrend(studentId, subjectId, academicYear, termNumber)
            }
        }
    });
});

// @desc    Enhanced bulk entry with validation and analytics
// @route   POST /api/results/bulk
// @access  Private (Teacher)
const bulkEnterMarks = asyncHandler(async (req, res) => {
    const { 
        results, 
        subjectId, 
        classId, 
        academicYear, 
        termNumber, 
        assessmentType, 
        maxMarks,
        gradingScaleId 
    } = req.body;

    const enteredBy = req.user._id;

    if (!Array.isArray(results) || results.length === 0) {
        return res.status(400).json({
            success: false, 
            message: 'Results array is required and must not be empty'
        });
    }

    // Validate all required fields
    const requiredFields = ['subjectId', 'classId', 'academicYear', 'termNumber', 'assessmentType', 'maxMarks'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false, 
            message: `Missing required fields: ${missingFields.join(', ')}` 
        });
    }

    // Get grading scale
    const student = await Student.findById(results[0].studentId).populate('currentClass');
    const academicLevel = student.currentClass.grade <= 8 ? 'primary' : 'secondary';
    const gradingScale = gradingScaleId ? 
        await GradingScale.findById(gradingScaleId) : 
        await GradingScale.getDefault(academicLevel);

    const processedResults = [];
    const errors = [];

    // Process each result with validation
    for (let i = 0; i < results.length; i++) {
        const item = results[i];
        const { studentId, marks, comment, status } = item;

        try {
            // Validate individual result
            if (!studentId || marks === undefined) {
                errors.push(`Row ${i + 1}: Missing studentId or marks`);
                continue;
            }

            if (marks < 0 || marks > maxMarks) {
                errors.push(`Row ${i + 1}: Invalid marks range (0-${maxMarks})`);
                continue;
            }

            // Skip if student was absent
            if (status === 'absent') {
                processedResults.push({
                    studentId,
                    status: 'skipped',
                    reason: 'Student marked as absent'
                });
                continue;
            }

            // Calculate grade
            const percentage = (marks / maxMarks) * 100;
            const gradeInfo = gradingScale ? gradingScale.getGradeInfo(percentage, subjectId) : 
                { grade: 'F', points: 0, remarks: 'Poor', percentage };

            const result = await Result.findOneAndUpdate(
                {
                    student: studentId,
                    subject: subjectId,
                    class: classId,
                    academicYear,
                    termNumber
                },
                {
                    $set: {
                        [`assessments.${assessmentType}`]: {
                            marks,
                            maxMarks,
                            percentage: gradeInfo.percentage,
                            grade: gradeInfo.grade,
                            points: gradeInfo.points,
                            remarks: gradeInfo.remarks,
                            teacherComments: comment,
                            enteredBy,
                            enteredDate: new Date(),
                            modifiedBy: enteredBy,
                            lastModified: new Date()
                        },
                        gradingScale: gradingScale?._id
                    },
                    $setOnInsert: {
                        student: studentId,
                        subject: subjectId,
                        class: classId,
                        academicYear,
                        termNumber,
                        enteredBy
                    }
                },
                { 
                    upsert: true, 
                    new: true 
                }
            );

            processedResults.push({
                studentId,
                status: 'success',
                marks,
                grade: gradeInfo.grade,
                percentage: gradeInfo.percentage
            });

        } catch (error) {
            errors.push(`Row ${i + 1}: ${error.message}`);
        }
    }

    // Trigger recalculation for all affected results
    const studentIds = processedResults
        .filter(r => r.status === 'success')
        .map(r => r.studentId);

    if (studentIds.length > 0) {
        const affectedResults = await Result.find({
            student: { $in: studentIds },
            subject: subjectId,
            class: classId,
            academicYear,
            termNumber
        });

        // Trigger pre-save middleware for recalculation
        for (const result of affectedResults) {
            await result.save();
        }

        // Update progress for all students asynchronously
        studentIds.forEach(studentId => updateStudentProgress(studentId, academicYear));
    }

    res.status(201).json({
        success: true,
        message: `Bulk entry completed. ${processedResults.filter(r => r.status === 'success').length} successful, ${errors.length} errors.`,
        data: {
            processed: processedResults,
            errors: errors,
            summary: {
                total: results.length,
                successful: processedResults.filter(r => r.status === 'success').length,
                failed: errors.length,
                skipped: processedResults.filter(r => r.status === 'skipped').length
            }
        }
    });
});

// @desc    Get comprehensive student report with analytics
// @route   GET /api/results/student/:studentId/report
// @access  Private (Student, Parent, Teacher, Admin)
const getStudentComprehensiveReport = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, termNumber, includeAnalytics = true } = req.query;

    // Authorization check
    if (req.user.role === 'student' && req.user.profileId !== studentId) {
        return res.status(403).json({ message: 'Students can only view their own reports' });
    }

    if (req.user.role === 'parent') {
        if (!req.user.children.includes(studentId)) {
            return res.status(403).json({ message: 'Parents can only view their children\'s reports' });
        }
    }

    const student = await Student.findById(studentId)
        .populate('currentClass', 'name grade stream')
        .lean();

    if (!student) {
        return res.status(404).json({ message: 'Student not found' });
    }

    // Build query
    const query = { student: studentId };
    if (academicYear) query.academicYear = academicYear;
    if (termNumber) query.termNumber = termNumber;

    const results = await Result.find(query)
        .populate('subject', 'name code category group')
        .populate('gradingScale', 'name scale config')
        .sort({ termNumber: -1, 'subject.name': 1 })
        .lean();

    // Group by term and process
    const termReports = {};
    results.forEach(result => {
        if (!termReports[result.termNumber]) {
            termReports[result.termNumber] = {
                termNumber: result.termNumber,
                academicYear: result.academicYear,
                subjects: [],
                summary: {
                    totalMarks: 0,
                    totalPossibleMarks: 0,
                    averagePercentage: 0,
                    totalPoints: 0,
                    overallGrade: '',
                    subjectCount: 0
                }
            };
        }

        const termReport = termReports[result.termNumber];
        
        // Process each assessment type
        Object.keys(result.assessments).forEach(assessmentType => {
            const assessment = result.assessments[assessmentType];
            if (assessment && assessment.marks !== undefined) {
                termReport.subjects.push({
                    subject: result.subject,
                    assessmentType,
                    marks: assessment.marks,
                    maxMarks: assessment.maxMarks,
                    percentage: assessment.percentage,
                    grade: assessment.grade,
                    points: assessment.points,
                    remarks: assessment.remarks,
                    teacherComments: assessment.teacherComments,
                    enteredDate: assessment.enteredDate
                });
            }
        });
    });

    // Calculate summary statistics for each term
    Object.values(termReports).forEach(async termReport => {
        if (termReport.subjects.length > 0) {
            termReport.summary.totalMarks = termReport.subjects.reduce((sum, s) => sum + s.marks, 0);
            termReport.summary.totalPossibleMarks = termReport.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
            termReport.summary.averagePercentage = termReport.summary.totalPossibleMarks > 0 ? 
                (termReport.summary.totalMarks / termReport.summary.totalPossibleMarks) * 100 : 0;
            termReport.summary.totalPoints = termReport.subjects.reduce((sum, s) => sum + (s.points || 0), 0);
            termReport.summary.subjectCount = termReport.subjects.length;

            // Calculate overall grade based on average percentage
            const gradingScale = await GradingScale.getDefault(student.currentClass.grade <= 8 ? 'primary' : 'secondary');
            if (gradingScale) {
                const overallGradeInfo = gradingScale.getGradeInfo(termReport.summary.averagePercentage);
                termReport.summary.overallGrade = overallGradeInfo.grade;
            }
        }
    });

    let analytics = {};
    if (includeAnalytics === 'true') {
        analytics = await generateStudentAnalytics(studentId, academicYear);
    }

    res.status(200).json({
        success: true,
        student: {
            _id: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            admissionNumber: student.admissionNumber,
            currentClass: student.currentClass,
            stream: student.stream
        },
        termReports: Object.values(termReports).sort((a, b) => b.termNumber - a.termNumber),
        analytics
    });
});

// @desc    Get class performance analytics
// @route   GET /api/results/class/:classId/analytics
// @access  Private (Teacher, Admin)
const getClassAnalytics = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { academicYear, termNumber, subjectId } = req.query;

    // Authorization check for teachers
    if (req.user.role === 'teacher' && !req.user.canAccessClass(classId)) {
        return res.status(403).json({ message: 'Access denied for this class' });
    }

    const query = { class: classId };
    if (academicYear) query.academicYear = academicYear;
    if (termNumber) query.termNumber = termNumber;
    if (subjectId) query.subject = subjectId;

    const results = await Result.find(query)
        .populate('student', 'firstName lastName admissionNumber')
        .populate('subject', 'name code')
        .lean();

    if (results.length === 0) {
        return res.status(404).json({ message: 'No results found for the specified criteria' });
    }

    // Calculate comprehensive analytics
    const analytics = {
        overview: {
            totalStudents: new Set(results.map(r => r.student._id.toString())).size,
            totalSubjects: new Set(results.map(r => r.subject._id.toString())).size,
            totalAssessments: results.length,
            averageClassPerformance: 0
        },
        subjectPerformance: {},
        studentRankings: [],
        gradeDistribution: {},
        trends: {},
        recommendations: []
    };

    // Group by subject for detailed analysis
    results.forEach(result => {
        const subjectId = result.subject._id.toString();
        const subjectName = result.subject.name;

        if (!analytics.subjectPerformance[subjectId]) {
            analytics.subjectPerformance[subjectId] = {
                subject: result.subject,
                students: [],
                averagePercentage: 0,
                highestScore: 0,
                lowestScore: 100,
                passRate: 0
            };
        }

        const subjectPerf = analytics.subjectPerformance[subjectId];
        
        // Process each assessment
        Object.keys(result.assessments).forEach(assessmentType => {
            const assessment = result.assessments[assessmentType];
            if (assessment && assessment.marks !== undefined) {
                subjectPerf.students.push({
                    student: result.student,
                    marks: assessment.marks,
                    percentage: assessment.percentage,
                    grade: assessment.grade,
                    points: assessment.points
                });

                subjectPerf.highestScore = Math.max(subjectPerf.highestScore, assessment.percentage);
                subjectPerf.lowestScore = Math.min(subjectPerf.lowestScore, assessment.percentage);
            }
        });
    });

    // Calculate averages and pass rates
    Object.values(analytics.subjectPerformance).forEach(subjectPerf => {
        if (subjectPerf.students.length > 0) {
            subjectPerf.averagePercentage = subjectPerf.students.reduce((sum, s) => sum + s.percentage, 0) / subjectPerf.students.length;
            subjectPerf.passRate = (subjectPerf.students.filter(s => s.percentage >= 50).length / subjectPerf.students.length) * 100;
        }
    });

    res.status(200).json({
        success: true,
        analytics
    });
});

// Helper Functions

async function updateStudentProgress(studentId, academicYear) {
    // This would be implemented to update the StudentProgress model
    // Can be made into a background job for better performance
    try {
        // Implementation would go here
        console.log(`Updating progress for student ${studentId} in ${academicYear}`);
    } catch (error) {
        console.error('Error updating student progress:', error);
    }
}

async function calculateClassAverage(classId, subjectId, academicYear, termNumber, assessmentType) {
    const results = await Result.find({
        class: classId,
        subject: subjectId,
        academicYear,
        termNumber
    }).lean();

    if (results.length === 0) return 0;

    let totalPercentage = 0;
    let count = 0;

    results.forEach(result => {
        const assessment = result.assessments[assessmentType];
        if (assessment && assessment.percentage !== undefined) {
            totalPercentage += assessment.percentage;
            count++;
        }
    });

    return count > 0 ? totalPercentage / count : 0;
}

async function calculateStudentRank(studentId, classId, subjectId, academicYear, termNumber, assessmentType) {
    const results = await Result.find({
        class: classId,
        subject: subjectId,
        academicYear,
        termNumber
    }).lean();

    const studentPercentages = [];
    let studentPercentage = 0;

    results.forEach(result => {
        const assessment = result.assessments[assessmentType];
        if (assessment && assessment.percentage !== undefined) {
            studentPercentages.push({
                studentId: result.student.toString(),
                percentage: assessment.percentage
            });
            
            if (result.student.toString() === studentId) {
                studentPercentage = assessment.percentage;
            }
        }
    });

    studentPercentages.sort((a, b) => b.percentage - a.percentage);
    const rank = studentPercentages.findIndex(s => s.studentId === studentId) + 1;

    return {
        rank,
        totalStudents: studentPercentages.length,
        percentage: studentPercentage
    };
}

async function calculateImprovementTrend(studentId, subjectId, academicYear, termNumber) {
    const previousResults = await Result.find({
        student: studentId,
        subject: subjectId,
        academicYear,
        termNumber: { $lt: termNumber }
    })
    .sort({ termNumber: -1 })
    .limit(2)
    .lean();

    if (previousResults.length === 0) return null;

    // Implementation would calculate improvement trends
    return {
        trend: 'improving', // or 'declining', 'stable'
        percentage_change: 0
    };
}

async function generateStudentAnalytics(studentId, academicYear) {
    // Implementation would generate comprehensive analytics
    return {
        performanceTrends: {},
        subjectStrengths: [],
        areasForImprovement: [],
        recommendations: []
    };
}


// @desc    Get results for a specific exam type for a whole class
// @route   GET /api/teacher/class-results/:classId/:academicYear/:termNumber/:examType
// @access  Private (Teacher, Admin)
const getClassExamResults = asyncHandler(async (req, res) => {
    const { classId, academicYear, termNumber, examType } = req.params;

    const results = await Result.find({ 
        class: classId, 
        academicYear, 
        termNumber, 
        [`assessments.${examType}`]: { $exists: true }
    })
    .populate('student', 'firstName lastName admissionNumber')
    .populate('subject', 'name code')
    .lean();

    if (!results || results.length === 0) {
        return res.status(404).json({ message: 'No results found for this exam.' });
    }

    // Format the results to only show the relevant exam type
    const formattedResults = results.map(result => {
        return {
            student: result.student,
            subject: result.subject,
            assessment: result.assessments[examType]
        };
    });

    res.status(200).json({ success: true, count: formattedResults.length, results: formattedResults });
});

// @desc    Get final term results for a whole class
// @route   GET /api/teacher/class-final-reports/:classId/:academicYear/:termNumber
// @access  Private (Teacher, Admin)
const getClassFinalReports = asyncHandler(async (req, res) => {
    const { classId, academicYear, termNumber } = req.params;

    const results = await Result.find({ 
        class: classId, 
        academicYear, 
        termNumber,
        status: 'published'
    })
    .populate('student', 'firstName lastName admissionNumber')
    .populate('subject', 'name code')
    .sort({ 'student.lastName': 1, 'subject.name': 1 })
    .lean();

    if (!results || results.length === 0) {
        return res.status(404).json({ message: 'No final reports found for this class and term.' });
    }

    res.status(200).json({ success: true, count: results.length, results });
});


// @desc    Get results entered by a specific teacher
// @route   GET /api/teacher/results/entered-by-me
// @access  Private (Teacher)
const getResultsByTeacher = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;
    
    const results = await Result.find({ enteredBy: teacherId })
        .populate('student', 'firstName lastName admissionNumber')
        .populate('subject', 'name code')
        .populate('class', 'name')
        .sort({ createdAt: -1 })
        .lean();
    
    if (!results || results.length === 0) {
        return res.status(404).json({ message: 'No results found entered by you.' });
    }
    
    res.status(200).json({ 
        success: true, 
        count: results.length, 
        results 
    });
});

module.exports = {
    enterOrUpdateMarks,
    bulkEnterMarks,
    getStudentComprehensiveReport,
    getClassAnalytics,
    getClassExamResults, // Exporting the new function
    getClassFinalReports, // Exporting the new function
    getResultsByTeacher // Add the missing function
};
