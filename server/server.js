// server.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Your DB connection file
const authRoutes = require('./routes/authRoutes'); // Assuming you have this
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const parentRoutes = require('./routes/parentRoutes');
const principalRoutes = require('./routes/principalRoutes'); // New principal routes
const path = require('path'); // For serving static files
const uploadRoutes = require('./routes/uploadRoutes'); // Import the upload routes
const studentRoutes = require('./routes/studentRoutes'); 
const termRoutes = require('./routes/termRoutes'); // Import term routes
const cors = require('cors');
const morgan = require('morgan'); // For logging requests

dotenv.config();
connectDB();

const app = express();

// Allow requests from your frontend origin
app.use(cors({
  origin: process.env.CORS_ORIGIN, // or '*' for all origins (not recommended for production)
  credentials: true // if you use cookies or HTTP auth
}));

app.use(express.json()); // Body parser

// Serve static files from the 'uploads' directory
// This makes files in 'uploads/' accessible via '/uploads/filename.jpg'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(morgan('combined')); // Logging middleware for development

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/student', studentRoutes); 
app.use('/api/terms', termRoutes); // Mount term routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
