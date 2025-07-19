const Term = require('../models/Term');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create a new Term
// @route   POST /api/admin/terms
// @access  Private (Admin)
exports.createTerm = asyncHandler(async (req, res) => {
    const { name, startDate, endDate, academicYear, isCurrent } = req.body;

    // Basic validation
    if (!name || !startDate || !endDate || !academicYear) {
        return res.status(400).json({ message: 'Term name, start date, end date, and academic year are required.' });
    }

    // Convert dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid start or end date format.' });
    }
    if (start >= end) {
        return res.status(400).json({ message: 'Start date must be before end date.' });
    }

    // Check for overlapping terms within the same academic year
    const overlappingTerm = await Term.findOne({
        academicYear,
        $or: [
            { startDate: { $lte: end }, endDate: { $gte: start } } // Existing term overlaps with new term
        ],
        isActive: true // Consider only active terms for overlap
    });

    if (overlappingTerm) {
        return res.status(400).json({
            message: `Term dates overlap with existing term "${overlappingTerm.name}" (${overlappingTerm.startDate.toDateString()} - ${overlappingTerm.endDate.toDateString()}) in the same academic year.`
        });
    }

    // If 'isCurrent' is true, set all other terms to false for that academic year
    if (isCurrent) {
        await Term.updateMany({ academicYear }, { isCurrent: false });
    }

    const term = await Term.create({
        name,
        startDate: start,
        endDate: end,
        academicYear,
        isCurrent: isCurrent || false // Default to false if not provided
    });

    res.status(201).json({ success: true, message: 'Term created successfully', term });
});

// @desc    Get all Terms
// @route   GET /terms
// @access  Public
exports.getAllTerms = asyncHandler(async (req, res) => {
    // You might want to add filtering by academicYear or sorting here
    const terms = await Term.find({}).sort({ academicYear: 1, startDate: 1 });
    res.status(200).json({ success: true, count: terms.length, terms });
});

// @desc    Get a single Term by ID
// @route   GET /api/admin/terms/:id
// @access  Private (Admin)
exports.getTermById = asyncHandler(async (req, res) => {
    const term = await Term.findById(req.params.id);
    if (!term) {
        return res.status(404).json({ message: 'Term not found.' });
    }
    res.status(200).json({ success: true, term });
});

// @desc    Update Term details
// @route   PUT /api/admin/terms/:id
// @access  Private (Admin)
exports.updateTerm = asyncHandler(async (req, res) => {
    const { name, startDate, endDate, academicYear, isCurrent, isActive } = req.body;
    const termId = req.params.id;

    const term = await Term.findById(termId);
    if (!term) {
        return res.status(404).json({ message: 'Term not found.' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (academicYear) updateData.academicYear = academicYear;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    // Handle date updates
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    const updatedStartDate = updateData.startDate || term.startDate;
    const updatedEndDate = updateData.endDate || term.endDate;
    const updatedAcademicYear = updateData.academicYear || term.academicYear;

    // Validate updated dates
    if (updatedStartDate >= updatedEndDate) {
        return res.status(400).json({ message: 'Start date must be before end date.' });
    }

    // Check for overlaps with other terms after update (excluding self)
    const overlappingTerm = await Term.findOne({
        _id: { $ne: termId }, // Exclude the current term from the search
        academicYear: updatedAcademicYear,
        $or: [
            { startDate: { $lte: updatedEndDate }, endDate: { $gte: updatedStartDate } }
        ],
        isActive: true // Consider only active terms for overlap
    });

    if (overlappingTerm) {
        return res.status(400).json({
            message: `Updated term dates overlap with existing term "${overlappingTerm.name}" (${overlappingTerm.startDate.toDateString()} - ${overlappingTerm.endDate.toDateString()}) in the same academic year.`
        });
    }

    // Handle 'isCurrent' status: if setting this term to current, unset others
    if (typeof isCurrent === 'boolean') {
        if (isCurrent) {
            await Term.updateMany({ academicYear: updatedAcademicYear, _id: { $ne: termId } }, { isCurrent: false });
        }
        updateData.isCurrent = isCurrent;
    }

    Object.assign(term, updateData); // Apply all updates
    await term.save();

    res.status(200).json({ success: true, message: 'Term updated successfully', term });
});

// @desc    Delete (Deactivate) a Term
// @route   DELETE /api/admin/terms/:id
// @access  Private (Admin)
// This implements a soft delete by setting isActive to false.
exports.deleteTerm = asyncHandler(async (req, res) => {
    const term = await Term.findById(req.params.id);

    if (!term) {
        return res.status(404).json({ message: 'Term not found.' });
    }

    // Soft delete the Term
    term.isActive = false; // Assuming isActive field on Term model
    await term.save();

    // If the deleted term was marked as current, you might want to consider
    // automatically setting another term in the same academic year as current,
    // or handle this manually by an admin.

    res.status(200).json({ success: true, message: 'Term deactivated successfully.' });
});