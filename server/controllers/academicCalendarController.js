// controllers/academicCalendarController.js - Enhanced Version
const AcademicCalendar = require('../models/AcademicCalendar');
const asyncHandler = require('express-async-handler');

// @desc    Create a new academic calendar with enhanced validation
// @route   POST /api/academic/calendar
// @access  Private (Admin)
exports.createAcademicCalendar = asyncHandler(async (req, res) => {
    const { academicYear, schoolInfo, terms, yearHolidays, settings, status, notes } = req.body;

    // Enhanced validation
    if (!academicYear || !terms || terms.length === 0) {
        return res.status(400).json({ 
            success: false,
            message: 'Academic year and at least one term are required.',
            required: ['academicYear', 'terms']
        });
    }

    // Validate academic year format
    const yearRegex = /^\d{4}\/\d{4}$/;
    if (!yearRegex.test(academicYear)) {
        return res.status(400).json({ 
            success: false,
            message: 'Academic year must be in format YYYY/YYYY (e.g., 2024/2025)' 
        });
    }

    // Validate terms structure and dates
    const termValidation = validateTerms(terms);
    if (!termValidation.isValid) {
        return res.status(400).json({ 
            success: false,
            message: 'Term validation failed',
            errors: termValidation.errors
        });
    }

    // Check if calendar already exists
    const existingCalendar = await AcademicCalendar.findOne({ academicYear }).lean();
    if (existingCalendar) {
        return res.status(409).json({ 
            success: false,
            message: `Academic calendar for ${academicYear} already exists.` 
        });
    }

    try {
        const academicCalendar = new AcademicCalendar({
            academicYear,
            schoolInfo: schoolInfo || {},
            terms: terms.map(term => ({
                ...term,
                // Initialize exam periods if not provided
                examPeriods: term.examPeriods || [
                    {
                        name: 'CAT 1',
                        startDate: new Date(term.startDate.getTime() + (14 * 24 * 60 * 60 * 1000)), // 2 weeks after term start
                        endDate: new Date(term.startDate.getTime() + (16 * 24 * 60 * 60 * 1000)),
                        maxMarks: 30,
                        isActive: true
                    },
                    {
                        name: 'CAT 2',
                        startDate: new Date(term.startDate.getTime() + (42 * 24 * 60 * 60 * 1000)), // 6 weeks after term start
                        endDate: new Date(term.startDate.getTime() + (44 * 24 * 60 * 60 * 1000)),
                        maxMarks: 30,
                        isActive: true
                    },
                    {
                        name: 'End Term',
                        startDate: new Date(term.endDate.getTime() - (7 * 24 * 60 * 60 * 1000)), // 1 week before term end
                        endDate: new Date(term.endDate.getTime() - (2 * 24 * 60 * 60 * 1000)),
                        maxMarks: 40,
                        isActive: true
                    }
                ]
            })),
            yearHolidays: yearHolidays || [],
            settings: {
                gradingSystem: settings?.gradingSystem || '8-4-4',
                passingGrade: settings?.passingGrade || 'D',
                maxAbsences: settings?.maxAbsences || 30,
                notifications: {
                    resultEntryReminder: settings?.notifications?.resultEntryReminder !== false,
                    parentNotifications: settings?.notifications?.parentNotifications !== false,
                    teacherReminders: settings?.notifications?.teacherReminders !== false
                },
                ...settings
            },
            status: status || 'draft',
            notes,
            createdBy: req.user._id,
            approvalStatus: req.user.role === 'admin' ? 'approved' : 'pending',
            approvedBy: req.user.role === 'admin' ? req.user._id : null,
            approvedAt: req.user.role === 'admin' ? new Date() : null
        });

        const createdCalendar = await academicCalendar.save();
        
        // Populate referenced fields for response
        await createdCalendar.populate('createdBy', 'firstName lastName email');
        
        res.status(201).json({
            success: true,
            message: 'Academic calendar created successfully',
            data: createdCalendar
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating academic calendar',
            error: error.message
        });
    }
});

// @desc    Get all academic calendars with enhanced filtering
// @route   GET /api/academic/calendar
// @access  Private (Admin, Teacher, Student, Parent)
exports.getAllAcademicCalendars = asyncHandler(async (req, res) => {
    const { 
        status, 
        year, 
        limit = 10, 
        page = 1, 
        sort = '-academicYear',
        includeArchived = 'false' 
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (year) query.academicYear = { $regex: year, $options: 'i' };
    if (includeArchived === 'false') query.status = { $ne: 'archived' };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const calendars = await AcademicCalendar.find(query)
        .select('academicYear status terms.termNumber terms.name terms.startDate terms.endDate createdAt')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

    const total = await AcademicCalendar.countDocuments(query);

    res.status(200).json({
        success: true,
        count: calendars.length,
        total,
        pages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        calendars
    });
});

// @desc    Get academic calendar by year with full details
// @route   GET /api/academic/calendar/:academicYear
// @access  Private
exports.getAcademicCalendarByYear = asyncHandler(async (req, res) => {
    const { academicYear } = req.params;
    const { includeStats = 'false' } = req.query;

    const calendar = await AcademicCalendar.findOne({ academicYear })
        .populate('createdBy', 'firstName lastName email')
        .populate('lastModifiedBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .lean();

    if (!calendar) {
        return res.status(404).json({ 
            success: false,
            message: 'Academic calendar not found for the specified year.' 
        });
    }

    // Add computed statistics if requested
    if (includeStats === 'true') {
        calendar.computedStats = {
            totalTerms: calendar.terms.length,
            totalHolidays: calendar.yearHolidays.length + 
                calendar.terms.reduce((sum, term) => sum + (term.holidays?.length || 0), 0),
            totalExamPeriods: calendar.terms.reduce((sum, term) => sum + (term.examPeriods?.length || 0), 0),
            currentTerm: calendar.terms.find(term => {
                const now = new Date();
                return term.startDate <= now && term.endDate >= now;
            })?.termNumber || null,
            upcomingDeadlines: getUpcomingDeadlines(calendar)
        };
    }

    res.status(200).json({
        success: true,
        data: calendar
    });
});

// @desc    Update academic calendar with change tracking
// @route   PUT /api/academic/calendar/:academicYear
// @access  Private (Admin)
exports.updateAcademicCalendar = asyncHandler(async (req, res) => {
    const { academicYear } = req.params;
    const { terms, yearHolidays, settings, status, notes, schoolInfo } = req.body;

    const calendar = await AcademicCalendar.findOne({ academicYear });

    if (!calendar) {
        return res.status(404).json({ 
            success: false,
            message: 'Academic calendar not found.' 
        });
    }

    // Check if user has permission to edit
    if (calendar.status === 'published' && req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Cannot modify published calendar. Admin access required.' 
        });
    }

    // Validate terms if provided
    if (terms) {
        const termValidation = validateTerms(terms);
        if (!termValidation.isValid) {
            return res.status(400).json({ 
                success: false,
                message: 'Term validation failed',
                errors: termValidation.errors
            });
        }
    }

    // Track changes for audit
    const changes = [];
    if (terms && JSON.stringify(terms) !== JSON.stringify(calendar.terms)) {
        changes.push('terms');
    }
    if (yearHolidays && JSON.stringify(yearHolidays) !== JSON.stringify(calendar.yearHolidays)) {
        changes.push('holidays');
    }
    if (settings && JSON.stringify(settings) !== JSON.stringify(calendar.settings)) {
        changes.push('settings');
    }

    // Update fields
    if (terms) calendar.terms = terms;
    if (yearHolidays) calendar.yearHolidays = yearHolidays;
    if (settings) calendar.settings = { ...calendar.settings, ...settings };
    if (status) calendar.status = status;
    if (notes) calendar.notes = notes;
    if (schoolInfo) calendar.schoolInfo = { ...calendar.schoolInfo, ...schoolInfo };
    
    calendar.lastModifiedBy = req.user._id;
    calendar.version = (calendar.version || 1) + 1;

    const updatedCalendar = await calendar.save();

    // Log significant changes
    if (changes.length > 0) {
        console.log(`Academic calendar ${academicYear} updated by ${req.user.email}. Changes: ${changes.join(', ')}`);
    }

    await updatedCalendar.populate('lastModifiedBy', 'firstName lastName email');

    res.status(200).json({
        success: true,
        message: 'Academic calendar updated successfully',
        data: updatedCalendar,
        changes
    });
});

// @desc    Set academic calendar as active (only one can be active)
// @route   PUT /api/academic/calendar/:academicYear/activate
// @access  Private (Admin)
exports.setActiveAcademicCalendar = asyncHandler(async (req, res) => {
    const { academicYear } = req.params;

    // Start transaction to ensure data consistency
    const session = await AcademicCalendar.startSession();
    
    try {
        await session.withTransaction(async () => {
            // First, deactivate all other calendars
            await AcademicCalendar.updateMany(
                { status: 'active' }, 
                { 
                    $set: { 
                        status: 'archived',
                        archivedAt: new Date() 
                    } 
                },
                { session }
            );

            // Then activate the specified calendar
            const calendar = await AcademicCalendar.findOneAndUpdate(
                { academicYear },
                { 
                    $set: { 
                        status: 'active',
                        publishedAt: new Date(),
                        lastModifiedBy: req.user._id
                    } 
                },
                { new: true, session }
            );

            if (!calendar) {
                throw new Error('Academic calendar not found.');
            }

            await calendar.populate('lastModifiedBy', 'firstName lastName');

            res.status(200).json({
                success: true,
                message: `Academic calendar ${academicYear} activated successfully`,
                data: calendar
            });
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to activate academic calendar'
        });
    } finally {
        await session.endSession();
    }
});

// @desc    Get current active academic calendar with enhanced data
// @route   GET /api/academic/calendar/active
// @access  Public
exports.getActiveAcademicCalendar = asyncHandler(async (req, res) => {
    const activeCalendar = await AcademicCalendar.findOne({ status: 'active' })
        .populate('createdBy', 'firstName lastName')
        .lean();

    if (!activeCalendar) {
        return res.status(404).json({ 
            success: false,
            message: 'No active academic calendar found.' 
        });
    }

    // Add current context
    const now = new Date();
    const currentTerm = activeCalendar.terms.find(term => 
        new Date(term.startDate) <= now && new Date(term.endDate) >= now
    );
    
    const nextTerm = activeCalendar.terms
        .filter(term => new Date(term.startDate) > now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

    const currentExamPeriod = currentTerm?.examPeriods?.find(exam => 
        exam.isActive && 
        new Date(exam.startDate) <= now && 
        new Date(exam.endDate) >= now
    );

    res.status(200).json({
        success: true,
        data: {
            ...activeCalendar,
            context: {
                currentTerm: currentTerm || null,
                nextTerm: nextTerm || null,
                currentExamPeriod: currentExamPeriod || null,
                upcomingDeadlines: getUpcomingDeadlines(activeCalendar, 14), // Next 14 days
                isHoliday: isCurrentlyHoliday(activeCalendar),
                schoolDaysRemaining: calculateRemainingSchoolDays(activeCalendar)
            }
        }
    });
});

// @desc    Get calendar events for specific date range
// @route   GET /api/academic/calendar/events
// @access  Private
exports.getCalendarEvents = asyncHandler(async (req, res) => {
    const { startDate, endDate, type, academicYear } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ 
            success: false,
            message: 'Start date and end date are required' 
        });
    }

    const query = academicYear ? { academicYear } : { status: 'active' };
    const calendar = await AcademicCalendar.findOne(query).lean();

    if (!calendar) {
        return res.status(404).json({ 
            success: false,
            message: 'No calendar found for the specified criteria' 
        });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const events = [];

    // Extract holidays
    if (!type || type === 'holiday') {
        // Year-wide holidays
        calendar.yearHolidays?.forEach(holiday => {
            if (dateRangeOverlaps(holiday.startDate, holiday.endDate, start, end)) {
                events.push({
                    type: 'holiday',
                    title: holiday.name,
                    startDate: holiday.startDate,
                    endDate: holiday.endDate,
                    description: holiday.description,
                    category: holiday.type
                });
            }
        });

        // Term holidays
        calendar.terms?.forEach(term => {
            term.holidays?.forEach(holiday => {
                if (dateRangeOverlaps(holiday.startDate, holiday.endDate, start, end)) {
                    events.push({
                        type: 'holiday',
                        title: holiday.name,
                        startDate: holiday.startDate,
                        endDate: holiday.endDate,
                        description: holiday.description,
                        category: holiday.type,
                        term: term.name
                    });
                }
            });
        });
    }

    // Extract exam periods
    if (!type || type === 'exam') {
        calendar.terms?.forEach(term => {
            term.examPeriods?.forEach(exam => {
                if (exam.isActive && dateRangeOverlaps(exam.startDate, exam.endDate, start, end)) {
                    events.push({
                        type: 'exam',
                        title: exam.name,
                        startDate: exam.startDate,
                        endDate: exam.endDate,
                        instructions: exam.instructions,
                        maxMarks: exam.maxMarks,
                        term: term.name
                    });
                }
            });
        });
    }

    // Extract term dates
    if (!type || type === 'term') {
        calendar.terms?.forEach(term => {
            // Term start
            if (term.startDate >= start && term.startDate <= end) {
                events.push({
                    type: 'term_start',
                    title: `${term.name} Begins`,
                    startDate: term.startDate,
                    endDate: term.startDate,
                    term: term.name
                });
            }
            
            // Term end
            if (term.endDate >= start && term.endDate <= end) {
                events.push({
                    type: 'term_end',
                    title: `${term.name} Ends`,
                    startDate: term.endDate,
                    endDate: term.endDate,
                    term: term.name
                });
            }
        });
    }

    // Sort events by date
    events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    res.status(200).json({
        success: true,
        count: events.length,
        dateRange: { startDate: start, endDate: end },
        events
    });
});

// @desc    Delete academic calendar (with safety checks)
// @route   DELETE /api/academic/calendar/:academicYear
// @access  Private (Admin)
exports.deleteAcademicCalendar = asyncHandler(async (req, res) => {
    const { academicYear } = req.params;
    const { force = 'false' } = req.query;

    const calendar = await AcademicCalendar.findOne({ academicYear });

    if (!calendar) {
        return res.status(404).json({ 
            success: false,
            message: 'Academic calendar not found.' 
        });
    }

    // Safety checks
    if (calendar.status === 'active') {
        return res.status(400).json({ 
            success: false,
            message: 'Cannot delete active calendar. Please deactivate first.' 
        });
    }

    // Check if calendar is being used (has associated results, attendance, etc.)
    if (force !== 'true') {
        // Here you would check for associated data
        // const hasResults = await Result.countDocuments({ academicYear });
        // if (hasResults > 0) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Calendar has associated data. Use force=true to delete anyway.',
        //         associatedData: { results: hasResults }
        //     });
        // }
    }

    await AcademicCalendar.findByIdAndDelete(calendar._id);

    res.status(200).json({ 
        success: true,
        message: `Academic calendar ${academicYear} deleted successfully.` 
    });
});

// Helper Functions

function validateTerms(terms) {
    const errors = [];
    
    if (!Array.isArray(terms) || terms.length === 0) {
        return { isValid: false, errors: ['Terms must be a non-empty array'] };
    }

    terms.forEach((term, index) => {
        if (!term.name || !term.startDate || !term.endDate || !term.termNumber) {
            errors.push(`Term ${index + 1}: Missing required fields (name, startDate, endDate, termNumber)`);
        }

        if (new Date(term.startDate) >= new Date(term.endDate)) {
            errors.push(`Term ${index + 1}: Start date must be before end date`);
        }

        if (term.termNumber < 1 || term.termNumber > 3) {
            errors.push(`Term ${index + 1}: Term number must be between 1 and 3`);
        }
    });

    // Check for overlapping terms
    for (let i = 0; i < terms.length - 1; i++) {
        for (let j = i + 1; j < terms.length; j++) {
            if (dateRangeOverlaps(
                new Date(terms[i].startDate), 
                new Date(terms[i].endDate),
                new Date(terms[j].startDate), 
                new Date(terms[j].endDate)
            )) {
                errors.push(`Terms ${terms[i].name} and ${terms[j].name} have overlapping dates`);
            }
        }
    }

    return { isValid: errors.length === 0, errors };
}

function dateRangeOverlaps(start1, end1, start2, end2) {
    return start1 <= end2 && start2 <= end1;
}

function getUpcomingDeadlines(calendar, days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    const deadlines = [];
    
    calendar.terms?.forEach(term => {
        // Check term deadlines
        const termDeadlines = [
            { type: 'Result Entry', date: term.settings?.resultEntryDeadline },
            { type: 'Report Card', date: term.settings?.reportCardDeadline },
            { type: 'Parent Meeting', date: term.settings?.parentMeetingDate }
        ].filter(d => d.date);

        termDeadlines.forEach(deadline => {
            const deadlineDate = new Date(deadline.date);
            if (deadlineDate >= now && deadlineDate <= futureDate) {
                deadlines.push({
                    type: deadline.type,
                    date: deadlineDate,
                    term: term.name,
                    daysUntil: Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
                });
            }
        });
        
        // Check exam deadlines
        term.examPeriods?.forEach(exam => {
            const startDate = new Date(exam.startDate);
            if (startDate >= now && startDate <= futureDate) {
                deadlines.push({
                    type: 'Exam Start',
                    date: startDate,
                    name: exam.name,
                    term: term.name,
                    daysUntil: Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))
                });
            }
        });
    });
    
    return deadlines.sort((a, b) => a.date - b.date);
}

function isCurrentlyHoliday(calendar) {
    const now = new Date();
    
    // Check year-wide holidays
    const yearHoliday = calendar.yearHolidays?.find(holiday => 
        new Date(holiday.startDate) <= now && new Date(holiday.endDate) >= now
    );
    
    if (yearHoliday) return { isHoliday: true, holiday: yearHoliday };
    
    // Check term holidays
    for (let term of calendar.terms || []) {
        const termHoliday = term.holidays?.find(holiday => 
            new Date(holiday.startDate) <= now && new Date(holiday.endDate) >= now
        );
        if (termHoliday) return { isHoliday: true, holiday: termHoliday, term: term.name };
    }
    
    return { isHoliday: false };
}

function calculateRemainingSchoolDays(calendar) {
    const now = new Date();
    const currentTerm = calendar.terms?.find(term => 
        new Date(term.startDate) <= now && new Date(term.endDate) >= now
    );
    
    if (!currentTerm) return 0;
    
    // This would implement the actual calculation
    // For now, return a placeholder
    return Math.max(0, Math.ceil((new Date(currentTerm.endDate) - now) / (1000 * 60 * 60 * 24)));
}