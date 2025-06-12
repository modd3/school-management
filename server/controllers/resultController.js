const Result = require('../models/Result');
const { calculateGradeAndPoints } = require('../utils/grading');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Term = require('../models/Term');

// @desc    Enter marks for a student in a subject for a term and exam type
// @route   POST /api/teacher/results/enter
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.enterMarks = async (req, res) => {
    const { studentId, subjectId, termId, examType, marksObtained, comment } = req.body;

    if (!studentId || !subjectId || !termId || !examType || marksObtained === undefined) {
        return res.status(400).json({ message: 'Missing required fields: studentId, subjectId, termId, examType, marksObtained' });
    }

    try {
        const { grade, points } = calculateGradeAndPoints(marksObtained);

        // Check if a result already exists for this student, subject, term, and exam type
        let result = await Result.findOne({ student: studentId, subject: subjectId, term: termId, examType });

        if (result) {
            result.marksObtained = marksObtained;
            result.grade = grade;
            result.points = points;
            result.comment = comment || result.comment;
            await result.save();
            res.status(200).json({ message: 'Marks updated successfully', result });
        } else {
            result = await Result.create({
                student: studentId,
                subject: subjectId,
                term: termId,
                examType,
                marksObtained,
                grade,
                points,
                comment
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
// @desc    Get all published results for a class in a specific term
// @route   GET /api/teacher/results/published/class/:classId/term/:termId
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.getPublishedResultsForClass = async (req, res) => {
    const { classId, termId } = req.params;

    try {
        const term = await Term.findById(termId);
        if (!term || !term.isPublished) {
            return res.status(404).json({ message: 'Term not found or results not published' });
        }

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
            return res.status(404).json({ message: 'No published results found for this class in the specified term' });
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching published results for class:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}