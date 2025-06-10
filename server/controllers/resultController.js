// controllers/resultController.js
const Result = require('../models/Result');
const { calculateGradeAndPoints } = require('../utils/grading'); // Import your utility
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Term = require('../models/Term');

// @desc    Enter marks for a student in a subject for a term
// @route   POST /api/teacher/results/enter
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.enterMarks = async (req, res) => {
    const { studentId, subjectId, termId, marksObtained, comment } = req.body;

    // Basic validation
    if (!studentId || !subjectId || !termId || marksObtained === undefined) {
        return res.status(400).json({ message: 'Missing required fields: studentId, subjectId, termId, marksObtained' });
    }

    try {
        // Optional: Verify if the teacher is authorized to enter marks for this subject/class
        // (This logic would involve checking req.user.profileId (Teacher ID) against assigned subjects/classes)
        // For now, assuming auth middleware handles basic teacher role.

        const { grade, points } = calculateGradeAndPoints(marksObtained);

        // Check if a result already exists for this student, subject, and term
        let result = await Result.findOne({ student: studentId, subject: subjectId, term: termId });

        if (result) {
            // Update existing result
            result.marksObtained = marksObtained;
            result.grade = grade;
            result.points = points;
            result.comment = comment || result.comment; // Update comment if provided
            await result.save();
            res.status(200).json({ message: 'Marks updated successfully', result });
        } else {
            // Create new result
            result = await Result.create({
                student: studentId,
                subject: subjectId,
                term: termId,
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

// @desc    Get marks for students in a specific class, subject, and term (for teacher entry view)
// @route   GET /api/teacher/results/for-entry/:classId/:subjectId/:termId
// @access  Private (Teacher, Class Teacher, Subject Teacher)
exports.getMarksForEntry = async (req, res) => {
    const { classId, subjectId, termId } = req.params;

    try {
        // Fetch all students belonging to the specified class
        const studentsInClass = await Student.find({ currentClass: classId })
                                            .select('_id firstName lastName admissionNumber')
                                            .sort('firstName');

        // Fetch existing results for these students in the given subject and term
        const existingResults = await Result.find({
            student: { $in: studentsInClass.map(s => s._id) },
            subject: subjectId,
            term: termId
        }).select('student marksObtained grade points comment');

        // Map existing results to a dictionary for easy lookup
        const resultsMap = {};
        existingResults.forEach(r => {
            resultsMap[r.student.toString()] = r;
        });

        // Combine student info with their existing marks
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
                resultId: result ? result._id : null // Include result ID for updates
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

        // Optional: Further authorization - check if the teacher making the request
        // is assigned to the subject corresponding to this result.
        const subject = await Subject.findById(result.subject);
        if (!subject.assignedTeachers.includes(req.user.profileId)) {  req.user.profileId assumes teacher's _id
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


