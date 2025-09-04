// server.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const parentRoutes = require('./routes/parentRoutes');
const principalRoutes = require('./routes/principalRoutes');
const path = require('path'); // For serving static files
const uploadRoutes = require('./routes/uploadRoutes');
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const classSubjectRoutes = require('./routes/classSubjectRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const cors = require('cors');
const morgan = require('morgan'); // For logging requests
const studentClassRoutes = require('./routes/studentClassRoutes');
const compression = require('compression'); // Import compression middleware

const PORT = process.env.PORT || 5000;

dotenv.config();
connectDB();

const app = express();

// Enable compression for all responses
app.use(compression());

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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/classes', classRoutes); // Mount class routes
app.use('/api/class-subjects', classSubjectRoutes);
app.use('/api/student-class', studentClassRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));