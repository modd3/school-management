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
const termRoutes = require('./routes/termRoutes');
const classRoutes = require('./routes/classRoutes');
const classSubjectRoutes = require('./routes/classSubjectRoutes'); 
const cors = require('cors');
const morgan = require('morgan'); // For logging requests
const studentClassRoutes = require('./routes/studentClassRoutes');
const PORT = process.env.PORT || 5000;

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
app.use('/api/classes', classRoutes); // Mount class routes
app.use('/api/class-subjects', classSubjectRoutes); 
app.use('/api/student-class', studentClassRoutes);

// Error handling middleware - must be after all routes
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }
  
  // Mongoose CastError
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404 - Not found
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
