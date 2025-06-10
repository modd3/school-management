// server.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Your DB connection file
const authRoutes = require('./routes/authRoutes'); // Assuming you have this
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const parentRoutes = require('./routes/parentRoutes');
const principalRoutes = require('./routes/principalRoutes'); // New principal routes

dotenv.config();
connectDB();

const app = express();
app.use(express.json()); // Body parser

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/principal', principalRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
