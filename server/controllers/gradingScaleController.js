// controllers/gradingScaleController.js - NEW CONTROLLER
const GradingScale = require('../models/GradingScale');
const Result = require('../models/Result');
const asyncHandler = require('express-async-handler');

// @desc    Create a new grading scale
// @route   POST /api/grading-scales
// @access  Private (Admin)
exports.createGradingScale = asyncHandler(async (req, res) => {
    const { 
        name, 
        description, 
        academicLevel, 
        gradingSystem, 
        scale, 
        config, 
        subjectOverrides 
    } = req.body;

    // Validation
    if (!name || !academicLevel || !gradingSystem || !scale || scale.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields',
            required: ['name', 'academicLevel', 'gradingSystem', 'scale']
        });
    }

    // Validate grading scale structure
    const validation = validateGradingScale(scale);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Invalid grading scale structure',
            errors: validation.errors
        });
    }

    // Check for existing scale with same name
    const existingScale = await GradingScale.findOne({ name }).lean();
    if (existingScale) {
        return res.status(409).json({
            success: false,
            message: 'Grading scale with this name already exists'
        });
    }

    try {
        const gradingScale = new GradingScale({
            name,
            description,
            academicLevel,
            gradingSystem,
            scale: scale.sort((a, b) => b.maxMarks - a.maxMarks), // Ensure descending order
            config: {
                passingGrade: config?.passingGrade || 'D',
                passingPercentage: config?.passingPercentage || 50,
                maxPoints: config?.maxPoints || 12,
                usePoints: config?.usePoints !== false,
                roundToNearest: config?.roundToNearest || 1,
                ...config
            },
            subjectOverrides: subjectOverrides || [],
            createdBy: req.user._id
        });

        const savedScale = await gradingScale.save();
        await savedScale.populate('createdBy', 'firstName lastName email');

        res.status(201).json({
            success: true,
            message: 'Grading scale created successfully',
            data: savedScale
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating grading scale',
            error: error.message
        });
    }
});

// @desc    Get all grading scales with filtering
// @route   GET /api/grading-scales
// @access  Private
exports.getAllGradingScales = asyncHandler(async (req, res) => {
    const { 
        academicLevel, 
        gradingSystem, 
        isActive, 
        isDefault,
        limit = 20, 
        page = 1,
        sort = 'name'
    } = req.query;

    // Build query
    const query = {};
    if (academicLevel) query.academicLevel = academicLevel;
    if (gradingSystem) query.gradingSystem = gradingSystem;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isDefault !== undefined) query.isDefault = isDefault === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const gradingScales = await GradingScale.find(query)
        .populate('createdBy', 'firstName lastName')
        .populate('lastModifiedBy', 'firstName lastName')
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

    const total = await GradingScale.countDocuments(query);

    res.status(200).json({
        success: true,
        count: gradingScales.length,
        total,
        pages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        data: gradingScales
    });
});

// @desc    Get grading scale by ID
// @route   GET /api/grading-scales/:id
// @access  Private
exports.getGradingScaleById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { includeUsage = 'false' } = req.query;

    const gradingScale = await GradingScale.findById(id)
        .populate('createdBy', 'firstName lastName email')
        .populate('lastModifiedBy', 'firstName lastName')
        .populate('subjectOverrides.subject', 'name code')
        .lean();

    if (!gradingScale) {
        return res.status(404).json({
            success: false,
            message: 'Grading scale not found'
        });
    }

    // Include usage statistics if requested
    if (includeUsage === 'true') {
        const usageStats = await getGradingScaleUsage(id);
        gradingScale.usageStatistics = usageStats;
    }

    res.status(200).json({
        success: true,
        data: gradingScale
    });
});

// @desc    Update grading scale
// @route   PUT /api/grading-scales/:id
// @access  Private (Admin)
exports.updateGradingScale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        description, 
        scale, 
        config, 
        subjectOverrides,
        isActive,
        isDefault
    } = req.body;

    const gradingScale = await GradingScale.findById(id);

    if (!gradingScale) {
        return res.status(404).json({
            success: false,
            message: 'Grading scale not found'
        });
    }

    // Check if scale is being used before making major changes
    if (scale && JSON.stringify(scale) !== JSON.stringify(gradingScale.scale)) {
        const isInUse = await checkGradingScaleInUse(id);
        if (isInUse && !req.body.forceUpdate) {
            return res.status(400).json({
                success: false,
                message: 'Grading scale is currently in use. Set forceUpdate=true to override.',
                inUse: true
            });
        }
    }

    // Validate new scale if provided
    if (scale) {
        const validation = validateGradingScale(scale);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid grading scale structure',
                errors: validation.errors
            });
        }
        gradingScale.scale = scale.sort((a, b) => b.maxMarks - a.maxMarks);
    }

    // Update fields
    if (name && name !== gradingScale.name) {
        const existingScale = await GradingScale.findOne({ name, _id: { $ne: id } }).lean();
        if (existingScale) {
            return res.status(409).json({
                success: false,
                message: 'Grading scale with this name already exists'
            });
        }
        gradingScale.name = name;
    }

    if (description !== undefined) gradingScale.description = description;
    if (config) gradingScale.config = { ...gradingScale.config, ...config };
    if (subjectOverrides) gradingScale.subjectOverrides = subjectOverrides;
    if (isActive !== undefined) gradingScale.isActive = isActive;
    if (isDefault !== undefined) gradingScale.isDefault = isDefault;

    gradingScale.lastModifiedBy = req.user._id;
    gradingScale.version += 0.1;

    const updatedScale = await gradingScale.save();
    await updatedScale.populate('lastModifiedBy', 'firstName lastName');

    res.status(200).json({
        success: true,
        message: 'Grading scale updated successfully',
        data: updatedScale
    });
});

// @desc    Delete grading scale
// @route   DELETE /api/grading-scales/:id
// @access  Private (Admin)
exports.deleteGradingScale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { force = 'false' } = req.query;

    const gradingScale = await GradingScale.findById(id);

    if (!gradingScale) {
        return res.status(404).json({
            success: false,
            message: 'Grading scale not found'
        });
    }

    // Check if it's the default scale
    if (gradingScale.isDefault) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete default grading scale. Set another scale as default first.'
        });
    }

    // Check if scale is in use
    if (force !== 'true') {
        const isInUse = await checkGradingScaleInUse(id);
        if (isInUse) {
            return res.status(400).json({
                success: false,
                message: 'Grading scale is currently in use. Use force=true to delete anyway.'
            });
        }
    }

    await GradingScale.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: 'Grading scale deleted successfully'
    });
});

// @desc    Set grading scale as default for academic level
// @route   PUT /api/grading-scales/:id/set-default
// @access  Private (Admin)
exports.setDefaultGradingScale = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const gradingScale = await GradingScale.findById(id);

    if (!gradingScale) {
        return res.status(404).json({
            success: false,
            message: 'Grading scale not found'
        });
    }

    // Start transaction to ensure only one default per academic level
    const session = await GradingScale.startSession();
    
    try {
        await session.withTransaction(async () => {
            // Remove default flag from other scales of same academic level
            await GradingScale.updateMany(
                { 
                    academicLevel: gradingScale.academicLevel, 
                    _id: { $ne: id },
                    isDefault: true 
                },
                { $set: { isDefault: false } },
                { session }
            );

            // Set this scale as default
            gradingScale.isDefault = true;
            gradingScale.lastModifiedBy = req.user._id;
            await gradingScale.save({ session });
        });

        res.status(200).json({
            success: true,
            message: `${gradingScale.name} set as default for ${gradingScale.academicLevel} level`,
            data: gradingScale
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error setting default grading scale',
            error: error.message
        });
    } finally {
        await session.endSession();
    }
});

// @desc    Calculate grade and points for given percentage
// @route   POST /api/grading-scales/:id/calculate
// @access  Private
exports.calculateGrade = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { percentage, subjectId } = req.body;

    if (percentage === undefined || percentage < 0 || percentage > 100) {
        return res.status(400).json({
            success: false,
            message: 'Valid percentage (0-100) is required'
        });
    }

    const gradingScale = await GradingScale.findById(id).lean();

    if (!gradingScale) {
        return res.status(404).json({
            success: false,
            message: 'Grading scale not found'
        });
    }

    // Create temporary instance to use methods
    const tempScale = new GradingScale(gradingScale);
    const gradeInfo = tempScale.getGradeInfo(percentage, subjectId);

    res.status(200).json({
        success: true,
        data: {
            inputPercentage: percentage,
            ...gradeInfo,
            gradingScale: {
                id: gradingScale._id,
                name: gradingScale.name
            }
        }
    });
});

// @desc    Get grade distribution for a set of percentages
// @route   POST /api/grading-scales/:id/distribution
// @access  Private
exports.getGradeDistribution = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { percentages } = req.body;

    if (!Array.isArray(percentages) || percentages.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Array of percentages is required'
        });
    }

    // Validate percentages
    const invalidPercentages = percentages.filter(p => p < 0 || p > 100);
    if (invalidPercentages.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'All percentages must be between 0 and 100',
            invalid: invalidPercentages
        });
    }

    const gradingScale = await GradingScale.findById(id).lean();

    if (!gradingScale) {
        return res.status(404).json({
            success: false,
            message: 'Grading scale not found'
        });
    }

    // Create temporary instance to use methods
    const tempScale = new GradingScale(gradingScale);
    const distribution = tempScale.getGradeDistribution(percentages);

    // Calculate additional statistics
    const stats = {
        total: percentages.length,
        average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        highest: Math.max(...percentages),
        lowest: Math.min(...percentages),
        passingCount: percentages.filter(p => p >= gradingScale.config.passingPercentage).length,
        passingRate: (percentages.filter(p => p >= gradingScale.config.passingPercentage).length / percentages.length) * 100
    };

    res.status(200).json({
        success: true,
        data: {
            distribution,
            statistics: stats,
            gradingScale: {
                id: gradingScale._id,
                name: gradingScale.name,
                passingPercentage: gradingScale.config.passingPercentage
            }
        }
    });
});

// @desc    Initialize standard grading scales
// @route   POST /api/grading-scales/initialize
// @access  Private (Admin)
exports.initializeStandardScales = asyncHandler(async (req, res) => {
    const { overwrite = false } = req.body;

    const createdScales = [];
    const errors = [];

    try {
        // Check if scales already exist
        const existing844 = await GradingScale.findOne({ name: 'Kenyan 8-4-4 System' }).lean();
        const existingCBC = await GradingScale.findOne({ name: 'CBC System' }).lean();

        // Create 8-4-4 scale if it doesn't exist or overwrite is true
        if (!existing844 || overwrite) {
            if (existing844 && overwrite) {
                await GradingScale.findByIdAndDelete(existing844._id);
            }
            
            try {
                const scale844 = await GradingScale.createKenyan844Scale(req.user._id);
                createdScales.push(scale844);
            } catch (error) {
                errors.push(`Error creating 8-4-4 scale: ${error.message}`);
            }
        }

        // Create CBC scale if it doesn't exist or overwrite is true
        if (!existingCBC || overwrite) {
            if (existingCBC && overwrite) {
                await GradingScale.findByIdAndDelete(existingCBC._id);
            }
            
            try {
                const scaleCBC = await GradingScale.createCBCScale(req.user._id);
                createdScales.push(scaleCBC);
            } catch (error) {
                errors.push(`Error creating CBC scale: ${error.message}`);
            }
        }

        res.status(201).json({
            success: true,
            message: `Initialized ${createdScales.length} grading scales`,
            data: createdScales,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error initializing grading scales',
            error: error.message
        });
    }
});

// @desc    Clone grading scale
// @route   POST /api/grading-scales/:id/clone
// @access  Private (Admin)
exports.cloneGradingScale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, academicLevel, gradingSystem } = req.body;

    const originalScale = await GradingScale.findById(id).lean();

    if (!originalScale) {
        return res.status(404).json({
            success: false,
            message: 'Grading scale not found'
        });
    }

    // Check if new name already exists
    const existingScale = await GradingScale.findOne({ name: name || `${originalScale.name} (Copy)` }).lean();
    if (existingScale) {
        return res.status(409).json({
            success: false,
            message: 'Grading scale with this name already exists'
        });
    }

    const clonedScale = new GradingScale({
        name: name || `${originalScale.name} (Copy)`,
        description: `Cloned from ${originalScale.name}`,
        academicLevel: academicLevel || originalScale.academicLevel,
        gradingSystem: gradingSystem || originalScale.gradingSystem,
        scale: originalScale.scale,
        config: originalScale.config,
        subjectOverrides: originalScale.subjectOverrides,
        isDefault: false, // Cloned scales are never default
        isActive: true,
        createdBy: req.user._id,
        version: 1.0
    });

    const savedScale = await clonedScale.save();
    await savedScale.populate('createdBy', 'firstName lastName');

    res.status(201).json({
        success: true,
        message: 'Grading scale cloned successfully',
        data: savedScale
    });
});

// Helper Functions

function validateGradingScale(scale) {
    const errors = [];
    
    if (!Array.isArray(scale) || scale.length === 0) {
        return { isValid: false, errors: ['Scale must be a non-empty array'] };
    }

    // Validate each grade range
    scale.forEach((range, index) => {
        if (!range.grade || !range.minMarks === undefined || !range.maxMarks === undefined || !range.points === undefined) {
            errors.push(`Grade range ${index + 1}: Missing required fields (grade, minMarks, maxMarks, points)`);
        }

        if (range.minMarks < 0 || range.maxMarks < 0 || range.minMarks > 100 || range.maxMarks > 100) {
            errors.push(`Grade range ${index + 1}: Marks must be between 0 and 100`);
        }

        if (range.minMarks > range.maxMarks) {
            errors.push(`Grade range ${index + 1}: Minimum marks cannot be greater than maximum marks`);
        }

        if (range.points < 0) {
            errors.push(`Grade range ${index + 1}: Points cannot be negative`);
        }
    });

    // Check for overlapping ranges
    const sortedScale = [...scale].sort((a, b) => b.maxMarks - a.maxMarks);
    for (let i = 0; i < sortedScale.length - 1; i++) {
        const current = sortedScale[i];
        const next = sortedScale[i + 1];
        
        if (current.minMarks <= next.maxMarks) {
            errors.push(`Overlapping grade ranges: ${current.grade} (${current.minMarks}-${current.maxMarks}) and ${next.grade} (${next.minMarks}-${next.maxMarks})`);
        }
    }

    // Check for gaps in coverage
    const fullCoverageRanges = sortedScale.filter(range => range.minMarks === 0 || range.maxMarks === 100);
    if (sortedScale[0].maxMarks !== 100) {
        errors.push('Grade scale must cover up to 100%');
    }
    if (sortedScale[sortedScale.length - 1].minMarks !== 0) {
        errors.push('Grade scale must cover down to 0%');
    }

    return { isValid: errors.length === 0, errors };
}

async function getGradingScaleUsage(scaleId) {
    try {
        // Count results using this grading scale
        const resultCount = await Result.countDocuments({ gradingScale: scaleId });
        
        // Get unique classes using this scale
        const classesUsing = await Result.distinct('class', { gradingScale: scaleId });
        
        // Get unique subjects using this scale
        const subjectsUsing = await Result.distinct('subject', { gradingScale: scaleId });

        return {
            totalResults: resultCount,
            classesUsing: classesUsing.length,
            subjectsUsing: subjectsUsing.length,
            lastUsed: resultCount > 0 ? await Result.findOne({ gradingScale: scaleId }).sort({ createdAt: -1 }).select('createdAt').lean() : null
        };
    } catch (error) {
        console.error('Error calculating grading scale usage:', error);
        return {
            totalResults: 0,
            classesUsing: 0,
            subjectsUsing: 0,
            lastUsed: null
        };
    }
}

async function checkGradingScaleInUse(scaleId) {
    try {
        const count = await Result.countDocuments({ gradingScale: scaleId });
        return count > 0;
    } catch (error) {
        console.error('Error checking grading scale usage:', error);
        return false;
    }
}