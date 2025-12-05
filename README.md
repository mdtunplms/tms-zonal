# Teacher Management System

A comprehensive MERN stack application for managing teachers and schools with role-based authentication.

## Features

- **School Management**: Add, view, edit, and delete schools with filtering by type
- **Teacher Management**: Complete teacher CRUD with photo upload and work history tracking
- **Role-Based Access Control**:
  - Admin: Full system access
  - Principal: Manage teachers in their school
  - Teacher: View own profile only
- **Dashboard**: Statistics and insights based on user role
- **Work History Tracking**: Record teacher transfers between schools
- **Advanced Filtering**: Search and filter teachers by school, years of service
- **Responsive UI**: Built with Tailwind CSS

## Tech Stack

**Frontend:**
- React 18
- React Router DOM
- Axios
- Tailwind CSS
- React Icons
- date-fns

**Backend:**
- Node.js
- Express
- MySQL
- JWT Authentication
- Cloudinary (Image Upload)
- bcryptjs

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8 or higher)
- Cloudinary account (for image uploads)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=teacher_management
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Create database and run SQL schema:
```sql
CREATE DATABASE teacher_management;
```
Then run the SQL from CREATE TABLE districts.sql

5. Insert initial data (roles, districts, zones, subjects, schools)

6. Start server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

The application will open at http://localhost:3000

## Default Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Principal**: username: `principal_royal`, password: `principal123`

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

### Schools
- GET /api/schools
- GET /api/schools/:id
- POST /api/schools
- PUT /api/schools/:id
- DELETE /api/schools/:id
- GET /api/schools/meta/zones

### Teachers
- GET /api/teachers
- GET /api/teachers/:id
- POST /api/teachers
- PUT /api/teachers/:id
- DELETE /api/teachers/:id
- GET /api/teachers/meta/subjects

### Dashboard
- GET /api/dashboard/stats

## Database Schema

See CREATE TABLE districts.sql for complete schema including:
- districts
- zones
- schools
- subjects
- teachers
- transfer_history
- roles
- users
