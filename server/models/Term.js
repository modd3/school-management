const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Term 1", "Term 2"
    academicYear: { type: String, required: true }, // e.g., "2024/2025"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false }, // To easily identify the active term
    isActive: { type: Boolean, default: true } // For soft delete functionality
}, { timestamps: true });

// Virtual property to check if term is currently active based on dates
termSchema.virtual('isCurrentByDate').get(function() {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
});

// Static method to get current term
termSchema.statics.getCurrentTerm = async function() {
    // First try to find a term explicitly marked as current
    let currentTerm = await this.findOne({ 
        isCurrent: true,
        isActive: true 
    }).sort({ createdAt: -1 });
    
    if (!currentTerm) {
        // If no term is marked as current, find the term that contains today's date
        const today = new Date();
        currentTerm = await this.findOne({
            startDate: { $lte: today },
            endDate: { $gte: today },
            isActive: true
        }).sort({ startDate: -1 });
    }
    
    if (!currentTerm) {
        // If still no current term, get the most recent active term
        currentTerm = await this.findOne({ isActive: true }).sort({ endDate: -1 });
    }
    
    return currentTerm;
};

// Method to set this term as current (and unset others)
termSchema.methods.setAsCurrent = async function() {
    // Remove current flag from all other terms in the same academic year
    await this.constructor.updateMany(
        { 
            academicYear: this.academicYear,
            _id: { $ne: this._id }
        }, 
        { isCurrent: false }
    );
    
    // Set this term as current
    this.isCurrent = true;
    await this.save();
};

module.exports = mongoose.model('Term', termSchema);
