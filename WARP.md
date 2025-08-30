# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a full-stack School Management System built with the MERN stack (MongoDB, Express.js, React, Node.js) that handles student records, academic results, user management, and administrative tasks for educational institutions.

## Development Commands

### Backend (Server)
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Development with hot reload
npm run dev

# Production start
npm start

# Run tests
npm test

# Run single test file
npm test -- progress.test.js
```

### Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Full Application Setup
```bash
# Start backend (Terminal 1)
cd server && npm run dev

# Start frontend (Terminal 2) 
cd frontend && npm run dev
```

## Architecture Overview

### High-Level Structure
This is a role-based multi-tenant system with 4 user roles: **Admin**, **Teacher**, **Student**, and **Parent**. Each role has different permissions and access levels managed through a sophisticated permissions system.

### Backend Architecture

#### Core Models & Relationships
- **User Model**: Central authentication with role-based permissions system
  - Links to Student/Teacher/Parent profiles via `profileId` and `roleMapping`
  - Enhanced permissions structure for academic, administrative, and financial operations
  - Built-in security features (account locking, 2FA support, login attempts tracking)

- **Result Model**: Complex academic results tracking
  - Supports three assessment types: CAT1, CAT2, Endterm
  - Automatic grade/points calculation using grading utilities
  - Performance metrics (improvement, consistency, trends)
  - Position ranking and analytics
  - Audit trail for all modifications

- **Academic Hierarchy**: Class → StudentClass → Subject → ClassSubject
  - Students are assigned to classes through StudentClass model
  - Teachers are assigned to subjects within classes via ClassSubject
  - Supports multiple academic years and terms

#### Authentication & Authorization
- JWT-based authentication with enhanced permissions
- Route-level protection using `protect` and `authorize` middleware  
- Granular permission checking via `hasPermission` middleware
- Role-based access control for academic, administrative, and financial operations

#### API Structure
- **Auth Routes** (`/api/auth`): Login, registration (admin-only after first user), password reset
- **Admin Routes** (`/api/admin`): Full CRUD for all entities, bulk operations, analytics
- **Teacher Routes** (`/api/teacher`): Mark entry, result management, class reports
- **Student/Parent Routes**: View results, progress tracking, report cards

### Frontend Architecture

#### React Router Structure
- **Public Routes**: Login, Register (first user only), Password Reset
- **Protected Routes**: Role-based access using `ProtectedRoute` wrapper
- **Nested Admin Routes**: User management, class/subject management, analytics
- **Teacher Dashboard**: Mark entry, result viewing, class reports
- **Student/Parent Views**: Results viewing, progress reports

#### Component Organization
- **Context**: `AuthContext` for global authentication state
- **Components**: Reusable UI components (Spinner, ProtectedRoute, Dashboard links)
- **Pages**: Role-specific page components organized by user type
- **API Layer**: Axios-based API calls (proxied through Vite to backend)

#### State Management
- React Context for authentication
- Local component state for form handling
- Toast notifications for user feedback

### Key Technical Patterns

#### Results & Grading System
The system uses a sophisticated results tracking approach:
- Each Result document contains three assessment objects (cat1, cat2, endterm)
- Automatic calculation of percentages, grades, and points using utility functions
- Performance metrics calculated on save (improvement, consistency trends)
- Class ranking and position calculation via static methods
- Audit trail tracking all modifications

#### Permission System
Three-tier permissions structure:
- **Academic**: Result entry, editing, publishing, subject/class access
- **Administrative**: User management, class management, reporting
- **Financial**: Payment processing, statement generation (future feature)

#### Data Flow
1. **Authentication**: User logs in → JWT token with permissions → Context state
2. **Authorization**: Route access → Role checking → Permission validation
3. **Data Operations**: API calls → Controller logic → Model methods → Database
4. **Results Processing**: Mark entry → Automatic calculations → Performance analysis → Position ranking

## Environment Setup

### Required Environment Variables

**Backend (.env in server/)**:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/school_db
JWT_SECRET=your_strong_secret_key
JWT_COOKIE_EXPIRE=30d
EMAIL_USERNAME=your_email@example.com
EMAIL_PASSWORD=your_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env in frontend/)**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Development Workflow

### Database Dependencies
- MongoDB must be running locally or provide MongoDB Atlas URI
- First user registration automatically gets admin role
- All subsequent registrations require admin authentication

### Testing
- Backend tests use Jest with MongoDB Memory Server
- Test files located in `server/__tests__/`
- Setup file handles database connection and cleanup
- Run specific tests: `npm test -- --testPathPattern=progress`

### Code Organization
- **Controllers**: Business logic for each entity type
- **Models**: Mongoose schemas with sophisticated methods and virtuals  
- **Middleware**: Authentication, permissions, error handling
- **Utils**: Grading calculations, email sending, token generation
- **Routes**: API endpoint definitions with permission checks

### Key Development Considerations
- All result modifications are tracked in audit trail
- Performance metrics are calculated automatically on result save
- Position rankings are calculated via static model methods
- User permissions are checked at both route and component levels
- File uploads are handled via multer for student photos and bulk imports
