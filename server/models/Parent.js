const parentSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true }, // Primary contact for login
    email: { type: String }, // Optional secondary contact
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }], // Array of children linked to this parent
    // User ID reference for authentication
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }
}, { timestamps: true });
