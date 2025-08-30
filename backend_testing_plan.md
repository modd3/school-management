# Backend Testing & Fixing Plan

## 🚨 **Critical Issues to Fix First**

### 1. **Environment Setup**
```bash
# Create .env file in server directory
cd server
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/school_management_db
JWT_SECRET=your_super_secure_jwt_secret_key_change_in_production_123456789
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30d
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
CORS_ORIGIN=http://localhost:5173
EOF
```

### 2. **Model Fixes Required**

#### Fix StudentProgress Model Reference Issue
```javascript
// In StudentProgress.js, line 70 - change from:
term: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Term', // ❌ Wrong - 'Term' model doesn't exist
    required: true
}

// To:
termId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
},
termNumber: {
    type: Number,
    required: true,
    min: 1, max: 3
},
academicYear: {
    type: String,
    required: true,
    match: /^\d{4}\/\d{4}$/
}
```

#### Fix Result Model Aggregation Queries
```javascript
// In Result.js, line 473 - fix ObjectId import:
const mongoose = require('mongoose');
// Change all instances of:
mongoose.Types.ObjectId(id)
// To:
new mongoose.Types.ObjectId(id)
```

### 3. **Missing Utility Functions**
```javascript
// Create server/utils/grading.js if missing
const calculateGradeAndPoints = (percentage) => {
    if (percentage >= 80) return { grade: 'A', points: 12 };
    if (percentage >= 75) return { grade: 'A-', points: 11 };
    if (percentage >= 70) return { grade: 'B+', points: 10 };
    if (percentage >= 65) return { grade: 'B', points: 9 };
    if (percentage >= 60) return { grade: 'B-', points: 8 };
    if (percentage >= 55) return { grade: 'C+', points: 7 };
    if (percentage >= 50) return { grade: 'C', points: 6 };
    if (percentage >= 45) return { grade: 'C-', points: 5 };
    if (percentage >= 40) return { grade: 'D+', points: 4 };
    if (percentage >= 35) return { grade: 'D', points: 3 };
    if (percentage >= 30) return { grade: 'D-', points: 2 };
    return { grade: 'E', points: 1 };
};

module.exports = { calculateGradeAndPoints };
```

## 🧪 **Comprehensive Testing Plan**

### Phase 1: Environment & Database Setup
```bash
# 1. Start MongoDB
sudo systemctl start mongod
# or
mongod --dbpath /path/to/your/db

# 2. Install dependencies
cd server && npm install

# 3. Test database connection
node -e "require('./config/db')()"
```

### Phase 2: Model Testing
```bash
# Test individual models
npm test -- --testPathPattern=models

# Create sample test data
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

connectDB().then(async () => {
    // Test user creation with proper permissions
    const testAdmin = new User({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@test.com',
        password: 'testpassword123',
        role: 'admin'
    });
    await testAdmin.save();
    console.log('Test admin created:', testAdmin.email);
    process.exit();
});
"
```

### Phase 3: API Endpoint Testing
```bash
# Start the server
npm run dev

# Test authentication endpoints
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Admin", 
    "email": "admin@school.com",
    "password": "admin123",
    "role": "admin"
  }'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "admin123"
  }'
```

### Phase 4: Full Integration Testing
```javascript
// Create server/__tests__/integration.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('School Management API Integration Tests', () => {
    let adminToken;
    let testStudent;
    
    beforeAll(async () => {
        // Setup test database connection
    });
    
    describe('Authentication Flow', () => {
        test('Should register first admin user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@test.com',
                    password: 'adminpass123',
                    role: 'admin'
                });
            expect(response.status).toBe(201);
        });
        
        test('Should login admin and get token', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'adminpass123'
                });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            adminToken = response.body.token;
        });
    });
    
    describe('Student Management', () => {
        test('Should create a student', async () => {
            const response = await request(app)
                .post('/api/admin/students')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    dateOfBirth: '2005-01-15',
                    gender: 'Male'
                });
            expect(response.status).toBe(201);
            testStudent = response.body.student;
        });
    });
    
    describe('Class & Subject Management', () => {
        test('Should create a class', async () => {
            // Test class creation
        });
        
        test('Should create subjects', async () => {
            // Test subject creation
        });
    });
    
    describe('Result Entry System', () => {
        test('Should enter student results', async () => {
            // Test result entry
        });
        
        test('Should calculate grades correctly', async () => {
            // Test grade calculations
        });
    });
});
```

## 🛠️ **Fixing Implementation**

### Step 1: Create Environment File
```bash
cd server
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/school_management_db
JWT_SECRET=school_management_super_secure_secret_key_2024
JWT_EXPIRE=30d
EMAIL_USERNAME=admin@school.com
EMAIL_PASSWORD=your_email_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
CORS_ORIGIN=http://localhost:5173
EOF
```

### Step 2: Fix Missing Utility Function
```bash
# Create grading utility if missing
mkdir -p server/utils
cat > server/utils/grading.js << 'EOF'
const calculateGradeAndPoints = (percentage) => {
    if (percentage >= 80) return { grade: 'A', points: 12 };
    if (percentage >= 75) return { grade: 'A-', points: 11 };
    if (percentage >= 70) return { grade: 'B+', points: 10 };
    if (percentage >= 65) return { grade: 'B', points: 9 };
    if (percentage >= 60) return { grade: 'B-', points: 8 };
    if (percentage >= 55) return { grade: 'C+', points: 7 };
    if (percentage >= 50) return { grade: 'C', points: 6 };
    if (percentage >= 45) return { grade: 'C-', points: 5 };
    if (percentage >= 40) return { grade: 'D+', points: 4 };
    if (percentage >= 35) return { grade: 'D', points: 3 };
    if (percentage >= 30) return { grade: 'D-', points: 2 };
    return { grade: 'E', points: 1 };
};

module.exports = { calculateGradeAndPoints };
EOF
```

### Step 3: Test Database Connection
```bash
cd server
node -e "
require('dotenv').config();
const connectDB = require('./config/db');
connectDB().then(() => {
    console.log('✅ Database connected successfully');
    process.exit(0);
}).catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
});
"
```

### Step 4: Run Basic API Tests
```bash
# Install test dependencies if missing
npm install --save-dev supertest

# Run existing tests
npm test

# Start server and test manually
npm run dev
```

## 📋 **Test Checklist**

- [ ] Environment variables configured
- [ ] MongoDB connection working
- [ ] Models can be imported without errors
- [ ] Authentication endpoints working
- [ ] Admin can register (first user)
- [ ] Admin can login and get JWT token
- [ ] Protected routes require authentication
- [ ] Role-based permissions working
- [ ] Student CRUD operations
- [ ] Class and Subject management
- [ ] Result entry system
- [ ] Grade calculations
- [ ] Academic calendar system
- [ ] Progress tracking

## 🚀 **Quick Start Testing Commands**

```bash
# 1. Setup environment
cd server && cp .env.test .env

# 2. Start MongoDB (if not running)
sudo systemctl start mongod

# 3. Install dependencies
npm install

# 4. Run tests
npm test

# 5. Start development server
npm run dev

# 6. Test API endpoints (in another terminal)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Admin","lastName":"User","email":"admin@test.com","password":"admin123","role":"admin"}'
```

This plan addresses all major issues and provides a systematic approach to testing the backend thoroughly.
