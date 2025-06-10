const classSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Form 1", "Form 2"
    streams: [{ type: String }], // e.g., ['A', 'B', 'C'] or ['East', 'West']
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' } // Link to the class teacher
}, { timestamps: true });
