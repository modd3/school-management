// controllers/reportCardController.js
const ReportCard = require('../models/ReportCard');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const AcademicCalendar = require('../models/AcademicCalendar'); // Import AcademicCalendar
const { calculateOverallGradeFromMeanPoints } = require('../utils/grading'); // Your second utility function

// Helper function to calculate position (can be moved to utils/ranking.js)
const calculatePositions = (reportCards, type = 'class') => {
    // Sort report cards by meanGradePoint in descending order
    // In case of ties, use totalMarks as a tie-breaker, then admissionNumber for consistent ordering
    reportCards.sort((a, b) => {
        if (b.meanGradePoint !== a.meanGradePoint) {
            return b.meanGradePoint - a.meanGradePoint;
        }
        if (b.totalMarks !== a.totalMarks) {
            return b.totalMarks - a.totalMarks;
        }
        return a.student.admissionNumber.localeCompare(b.student.admissionNumber); // Consistent tie-breaker
    });

    let currentRank = 1;
    let prevPoints = -1;
    let tiedCount = 0;

    for (let i = 0; i < reportCards.length; i++) {
        const rc = reportCards[i];
        if (rc.meanGradePoint === prevPoints) {
            tiedCount++;
        } else {
            currentRank += tiedCount;
            tiedCount = 0;
        }
        if (type === 'class') {
            rc.classPosition = currentRank;
        } else { // type === 'stream'
            rc.streamPosition = currentRank;
        }
        prevPoints = rc.meanGradePoint;
    }
    return reportCards;
};


// @desc    Generate/Publish Report Cards for a specific term
// @route   POST /api/admin/reports/publish-term-results/:academicYear/:termNumber
// @access  Private (Admin)
exports.publishTermResults = async (req, res) => {
    const { academicYear, termNumber } = req.params;

    try {
        // Get the specific term details from AcademicCalendar
        const academicCalendar = await AcademicCalendar.findOne({ academicYear });
        if (!academicCalendar) {
            return res.status(404).json({ message: `Academic calendar not found for ${academicYear}` });
        }
        const term = academicCalendar.terms.find(t => t.termNumber === parseInt(termNumber));
        if (!term) {
            return res.status(404).json({ message: `Term ${termNumber} not found in academic year ${academicYear}` });
        }

        // Get all students
        const students = await Student.find({ isActive: true }).populate('currentClass');

        const reportCardsToSave = [];

        for (const student of students) {
            // Get all results for this student in the current term
            const studentResults = await Result.find({ student: student._id, academicYear, termNumber })
                                            .populate('subject')
                                            .select('overallPercentage overallGrade overallPoints teacherComments'); // Use new Result fields

            if (studentResults.length === 0) {
                // Skip students with no results for this term
                console.warn(`No results found for student ${student.firstName} ${student.lastName} in ${academicYear} Term ${termNumber}`);
                continue;
            }

            // Calculate aggregates
            let totalPoints = 0;
            let totalPercentage = 0;
            let numberOfSubjects = studentResults.length;

            studentResults.forEach(res => {
                totalPoints += res.overallPoints;
                totalPercentage += res.overallPercentage;
            });

            const meanGradePoint = totalPoints / numberOfSubjects;
            const averageMarks = totalPercentage / numberOfSubjects;
            const overallGrade = calculateOverallGradeFromMeanPoints(meanGradePoint); // Implement this in utils/grading.js

            // Prepare results array for ReportCard
            const formattedResults = studentResults.map(res => ({
                subject: res.subject._id,
                marksObtained: res.overallPercentage, // Store overall percentage as marks for report card
                grade: res.overallGrade,
                points: res.overallPoints,
                comment: res.teacherComments
            }));

            // Check if report card already exists
            let reportCard = await ReportCard.findOne({ student: student._id, academicYear, termNumber });

            if (reportCard) {
                // Update existing
                reportCard.results = formattedResults;
                reportCard.totalPoints = totalPoints;
                reportCard.meanGradePoint = meanGradePoint;
                reportCard.overallGrade = overallGrade;
                reportCard.averageMarks = averageMarks;
                reportCard.isPublished = true;
                reportCard.publishedAt = new Date();
                // classTeacherComment, principalComment, closingDate, openingDate will be updated separately or manually by Admin
            } else {
                // Create new
                reportCard = new ReportCard({
                    student: student._id,
                    academicYear,
                    termNumber,
                    results: formattedResults,
                    totalPoints,
                    meanGradePoint,
                    overallGrade,
                    averageMarks,
                    isPublished: true,
                    publishedAt: new Date()
                });
            }
            reportCardsToSave.push(reportCard);
        }

        // Save/update all report cards
        await Promise.all(reportCardsToSave.map(rc => rc.save()));

        // --- Calculate Positions (Class and Stream) ---
        // This is done after all report cards are saved for the term
        // because positions depend on all students' performance in the class/stream.

        // Group report cards by class for class positions
        const reportCardsByClass = {};
        reportCardsToSave.forEach(rc => {
            const classId = rc.student.currentClass.toString(); // Assuming student is populated with currentClass
            if (!reportCardsByClass[classId]) {
                reportCardsByClass[classId] = [];
            }
            reportCardsByClass[classId].push(rc);
        });

        const updatedReportCards = [];
        for (const classId in reportCardsByClass) {
            let classReportCards = reportCardsByClass[classId];
            classReportCards = calculatePositions(classReportCards, 'class'); // Assign class positions

            // Group by stream for stream positions within the class
            const reportCardsByStream = {};
            classReportCards.forEach(rc => {
                const stream = rc.student.stream || 'NoStream'; // Handle students without a stream
                if (!reportCardsByStream[stream]) {
                    reportCardsByStream[stream] = [];
                }
                reportCardsByStream[stream].push(rc);
            });

            for (const stream in reportCardsByStream) {
                let streamReportCards = reportCardsByStream[stream];
                streamReportCards = calculatePositions(streamReportCards, 'stream'); // Assign stream positions
                updatedReportCards.push(...streamReportCards);
            }
        }

        // Save positions back to DB
        await Promise.all(updatedReportCards.map(rc => rc.save()));

        res.status(200).json({ message: `Report cards for ${academicYear} Term ${termNumber} published and positions calculated successfully.` });

    } catch (error) {
        console.error('Error publishing term results:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get a specific student's report card for a term
// @route   GET /api/parent/reportcard/:studentId/:academicYear/:termNumber
// @access  Private (Parent, Teacher, Admin)
exports.getStudentReportCard = async (req, res) => {
    const { studentId, academicYear, termNumber } = req.params;
    const userId = req.user.profileId; // Assuming profileId contains parent/teacher/admin ID

    try {
        // Authorization check:
        // Parents can only view their own children's report cards.
        // Teachers can view their class/subject students' report cards (more complex check).
        // Admins can view any.
        const userRole = req.user.role;

        if (userRole === 'parent') {
            const parent = await Parent.findById(userId); // userId should be parent's profileId
            if (!parent || !parent.children.includes(studentId)) {
                return res.status(403).json({ message: 'Unauthorized to view this report card.' });
            }
        }
        // Add similar logic for teachers if needed, or allow teachers to see all.

        const reportCard = await ReportCard.findOne({ student: studentId, academicYear, termNumber })
            .populate({
                path: 'student',
                select: 'firstName lastName admissionNumber studentPhotoUrl currentClass stream',
                populate: { path: 'currentClass', select: 'name' }
            })
            .populate({
                path: 'results.subject',
                select: 'name'
            })
            .lean(); // Use lean() for faster retrieval if not modifying document

        if (!reportCard) {
            return res.status(404).json({ message: 'Report card not found for this student and term.' });
        }
        if (!reportCard.isPublished && userRole !== 'admin') { // Only admins can see unpublished reports
             return res.status(403).json({ message: 'Report card not yet published.' });
        }

        // Get term details from AcademicCalendar
        const academicCalendar = await AcademicCalendar.findOne({ academicYear });
        const term = academicCalendar ? academicCalendar.terms.find(t => t.termNumber === parseInt(termNumber)) : null;

        // Format the report card data to match the provided image
        const formattedReportCard = {
            schoolName: "Blue Sky Mixed Secondary School", // Static for now, could be from a SchoolSettings model
            schoolContact: {
                poBox: "P.O BOX 537 - 01100 KAJIADO, KENYA",
                tel: "+2547 07922901",
                email: "bluesksecschool@gmail.com"
            },
            student: {
                name: `${reportCard.student.firstName} ${reportCard.student.lastName} ${reportCard.student.otherNames || ''}`,
                admNo: reportCard.student.admissionNumber,
                photoUrl: reportCard.student.studentPhotoUrl,
                year: academicYear,
                term: term ? term.name : `Term ${termNumber}`,
                class: reportCard.student.currentClass ? reportCard.student.currentClass.name : 'N/A',
                stream: reportCard.student.stream || 'N/A'
            },
            subjects: reportCard.results.map(r => ({
                name: r.subject.name,
                endterm: r.marksObtained,
                grade: r.grade,
                remarks: r.comment
            })),
            totalPoints: reportCard.totalPoints,
            overallGrade: reportCard.overallGrade,
            averageClassPosition: reportCard.classPosition,
            // You might need to derive "Out of" by counting students in class for that term
            classTeacherRemarks: reportCard.classTeacherComment || '',
            principalRemarks: reportCard.principalComment || '',
            closingDate: term && term.endDate ? term.endDate.toLocaleDateString('en-GB') : '',
            openingDate: term && term.startDate ? term.startDate.toLocaleDateString('en-GB') : ''
        };


        res.status(200).json(formattedReportCard);

    } catch (error) {
        console.error('Error fetching student report card:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add/Update Class Teacher Comment for a Report Card
// @route   PUT /api/teacher/reportcard/class-comment/:reportCardId
// @access  Private (Class Teacher, Admin)
exports.updateClassTeacherComment = async (req, res) => {
    const { reportCardId } = req.params;
    const { comment } = req.body;
    const teacherId = req.user.profileId; // Assuming teacher's _id

    if (!comment) {
        return res.status(400).json({ message: 'Comment is required' });
    }

    try {
        const reportCard = await ReportCard.findById(reportCardId).populate('student');

        if (!reportCard) {
            return res.status(404).json({ message: 'Report card not found' });
        }

        // Verify if the teacher is the class teacher for this student's class
        const studentClass = await Class.findById(reportCard.student.currentClass);
        if (!studentClass || studentClass.classTeacher.toString() !== teacherId.toString()) {
            return res.status(403).json({ message: 'Unauthorized: You are not the class teacher for this student.' });
        }

        reportCard.classTeacherComment = comment;
        await reportCard.save();

        res.status(200).json({ message: 'Class teacher comment updated successfully', reportCard });
    } catch (error) {
        console.error('Error updating class teacher comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add/Update Principal Comment for a Report Card
// @route   PUT /api/principal/reportcard/principal-comment/:reportCardId
// @access  Private (Principal, Admin)
exports.updatePrincipalComment = async (req, res) => {
    const { reportCardId } = req.params;
    const { comment } = req.body;
    const userRole = req.user.role;

    if (!comment) {
        return res.status(400).json({ message: 'Comment is required' });
    }

    try {
        const reportCard = await ReportCard.findById(reportCardId);

        if (!reportCard) {
            return res.status(404).json({ message: 'Report card not found' });
        }

        // Verify if the user has principal or admin role
        if (userRole !== 'principal' && userRole !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: Only Principals or Admins can add principal comments.' });
        }

        reportCard.principalComment = comment;
        await reportCard.save();

        res.status(200).json({ message: 'Principal comment updated successfully', reportCard });
    } catch (error) {
        console.error('Error updating principal comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};