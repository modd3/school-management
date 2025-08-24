const Result = require('../models/Result');
const ClassSubject = require('../models/ClassSubject');
const GradingScale = require('../models/GradingScale');
const StudentClass = require('../models/StudentClass');
const { calculateResultMetrics, calculateOverallGrade, calculateGradeAndPoints } = require('../utils/grading');
const asyncHandler = require('express-async-handler');

// ... (other functions remain the same)

exports.getClassTermResults = asyncHandler(async (req, res) => {
    const { classId, academicYear, term } = req.params;

    const studentClasses = await StudentClass.find({ class: classId, academicYear, status: 'Active' }).populate('student', 'firstName lastName admissionNumber').lean();
    const studentIds = studentClasses.map(sc => sc.student._id);

    const allResults = await Result.find({ student: { $in: studentIds }, academicYear, term })
        .populate({ path: 'classSubject', populate: { path: 'subject', select: 'name' } })
        .lean();

    const resultsByStudent = studentClasses.map(sc => {
        const studentResults = allResults.filter(r => r.student.equals(sc.student._id));
        return {
            student: sc.student,
            results: studentResults
        };
    });

    res.status(200).json(resultsByStudent);
});


// ... (enterMarks, getResultsByTeacher, getStudentTermReport, getFinalReportCard functions remain the same)

exports.enterMarks = asyncHandler(async (req, res) => {
    const { studentId, classSubjectId, academicYear, term, assessments, teacherComments } = req.body;

    if (!studentId || !classSubjectId || !academicYear || !term || !assessments) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    const classSubject = await ClassSubject.findById(classSubjectId).populate('gradingScale');
    if (!classSubject) {
        return res.status(404).json({ message: 'ClassSubject not found.' });
    }
    if (!classSubject.gradingScale) {
        return res.status(400).json({ message: 'No grading scale is associated with this subject.' });
    }

    const { totalMarks, percentage, grade, points } = calculateResultMetrics(assessments, classSubject.gradingScale);

    let result = await Result.findOne({ 
        student: studentId, 
        classSubject: classSubjectId, 
        academicYear: academicYear,
        term: term
    });

    if (result) {
        result.assessments = assessments;
        result.totalMarks = totalMarks;
        result.percentage = percentage;
        result.grade = grade;
        result.points = points;
        result.teacherComments = teacherComments || result.teacherComments;
        result.modifiedBy = req.user._id;
    } else {
        result = new Result({
            student: studentId,
            classSubject: classSubjectId,
            academicYear: academicYear,
            term: term,
            assessments: assessments,
            totalMarks: totalMarks,
            percentage: percentage,
            grade: grade,
            points: points,
            teacherComments: teacherComments,
            enteredBy: req.user._id,
            modifiedBy: req.user._id,
            subject: classSubject.subject,
            class: classSubject.class
        });
    }

    const savedResult = await result.save();
    res.status(result.isNew ? 201 : 200).json({
        message: `Marks ${result.isNew ? 'entered' : 'updated'} successfully`,
        result: savedResult
    });
});

exports.getResultsByTeacher = asyncHandler(async (req, res) => {
    const teacherId = req.user?.profileId;

    if (!teacherId) {
        return res.status(400).json({ success: false, message: 'Teacher profile not found.' });
    }

    const filter = { enteredBy: teacherId };
    if (req.query.classSubjectId) filter.classSubject = req.query.classSubjectId;
    if (req.query.term) filter.term = req.query.term;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;

    const results = await Result.find(filter)
        .populate({ path: 'student', select: 'firstName lastName admissionNumber' })
        .populate({
            path: 'classSubject',
            populate: [
                { path: 'class', select: 'name' },
                { path: 'subject', select: 'name' }
            ]
        })
        .sort({ createdAt: -1 });

    const transformedResults = results.map(result => ({
        _id: result._id,
        student: result.student,
        class: result.classSubject?.class,
        subject: result.classSubject?.subject,
        term: result.term,
        academicYear: result.academicYear,
        assessments: result.assessments,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        grade: result.grade,
        points: result.points,
        teacherComments: result.teacherComments,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
    }));

    res.status(200).json({
        success: true,
        count: transformedResults.length,
        results: transformedResults
    });
});

exports.getStudentTermReport = asyncHandler(async (req, res) => {
    // This controller is now flexible.
    // If a teacher requests it with a studentId in params, use that.
    // If a student requests it, use their own ID from the authenticated user profile.
    const studentId = req.params.studentId || req.user.profileId;
    const { academicYear, term } = req.params;

    if (!studentId) {
        return res.status(400).json({ message: 'Student ID could not be determined.' });
    }

    const results = await Result.find({ student: studentId, academicYear, term })
        .populate({
            path: 'classSubject',
            populate: { path: 'subject', select: 'name' }
        })
        .lean();

    if (!results || results.length === 0) {
        return res.status(404).json({ message: 'No results found for this term.' });
    }

    const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
    const totalMarks = results.reduce((sum, r) => sum + r.totalMarks, 0);
    const meanPoints = totalPoints / results.length;
    const meanGrade = calculateOverallGrade(meanPoints);

    const report = {
        results: results.map(r => ({
            subject: r.classSubject.subject.name,
            grade: r.grade,
            points: r.points,
            totalMarks: r.totalMarks,
            percentage: r.percentage,
            teacherComments: r.teacherComments
        })),
        summary: {
            totalMarks: totalMarks,
            meanPoints: meanPoints.toFixed(2),
            meanGrade: meanGrade
        }
    };

    res.status(200).json(report);
});

exports.getFinalReportCard = asyncHandler(async (req, res) => {
    const studentId = req.user.profileId;
    const { academicYear, term } = req.params;

    const results = await Result.find({ student: studentId, academicYear, term })
        .populate({ 
            path: 'classSubject', 
            populate: { path: 'subject', select: 'name' }
        })
        .lean();

    if (!results || results.length === 0) {
        return res.status(404).json({ message: 'No results found for this term to generate a final report.' });
    }

    const finalResults = results.map(result => {
        const { cat1, cat2, endterm } = result.assessments;

        const cat1Pct = (cat1?.marks && cat1?.maxMarks) ? (cat1.marks / cat1.maxMarks) * 100 : 0;
        const cat2Pct = (cat2?.marks && cat2?.maxMarks) ? (cat2.marks / cat2.maxMarks) * 100 : 0;
        const endtermPct = (endterm?.marks && endterm?.maxMarks) ? (endterm.marks / endterm.maxMarks) * 100 : 0;

        const finalPercentage = ((cat1Pct + cat2Pct) / 2) * 0.3 + endtermPct * 0.7;

        const { grade, points } = calculateGradeAndPoints(finalPercentage);

        return {
            subject: result.classSubject.subject.name,
            finalPercentage: finalPercentage.toFixed(2),
            grade,
            points,
            teacherComments: result.teacherComments,
            breakdown: {
                cat1: cat1Pct.toFixed(2),
                cat2: cat2Pct.toFixed(2),
                endterm: endtermPct.toFixed(2)
            }
        };
    });

    const totalPoints = finalResults.reduce((sum, r) => sum + r.points, 0);
    const meanPoints = totalPoints / finalResults.length;
    const meanGrade = calculateOverallGrade(meanPoints);

    res.status(200).json({
        results: finalResults,
        summary: {
            meanPoints: meanPoints.toFixed(2),
            meanGrade
        }
    });
});

exports.getClassFinalReports = asyncHandler(async (req, res) => {
    const { classId, academicYear, term } = req.params;

    const studentClasses = await StudentClass.find({ class: classId, academicYear, status: 'Active' }).populate('student').lean();
    const studentIds = studentClasses.map(sc => sc.student._id);

    const allResults = await Result.find({ student: { $in: studentIds }, academicYear, term }).populate({
        path: 'classSubject',
        populate: { path: 'subject', select: 'name' }
    }).lean();

    const reports = studentClasses.map(sc => {
        const studentResults = allResults.filter(r => r.student.equals(sc.student._id));
        
        const finalResults = studentResults.map(result => {
            const { cat1, cat2, endterm } = result.assessments;
            const cat1Pct = (cat1?.marks && cat1?.maxMarks) ? (cat1.marks / cat1.maxMarks) * 100 : 0;
            const cat2Pct = (cat2?.marks && cat2?.maxMarks) ? (cat2.marks / cat2.maxMarks) * 100 : 0;
            const endtermPct = (endterm?.marks && endterm?.maxMarks) ? (endterm.marks / endterm.maxMarks) * 100 : 0;
            const finalPercentage = ((cat1Pct + cat2Pct) / 2) * 0.3 + endtermPct * 0.7;
            const { grade, points } = calculateGradeAndPoints(finalPercentage);
            return { subject: result.classSubject.subject.name, finalPercentage, grade, points };
        });

        const totalPoints = finalResults.reduce((sum, r) => sum + r.points, 0);
        const meanPoints = finalResults.length > 0 ? totalPoints / finalResults.length : 0;
        const meanGrade = calculateOverallGrade(meanPoints);

        return {
            student: sc.student,
            results: finalResults,
            summary: { totalPoints, meanPoints, meanGrade }
        };
    });

    reports.sort((a, b) => b.summary.meanPoints - a.summary.meanPoints);

    reports.forEach((report, index) => {
        report.position = index + 1;
    });

    res.status(200).json(reports);
});
