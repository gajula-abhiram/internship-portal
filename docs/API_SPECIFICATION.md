# REST API Specification - Internship Portal

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-app.vercel.app/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All responses follow this format:
```json
{
  "success": true|false,
  "data": <response_data>,     // On success
  "error": <error_message>     // On error
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /auth/login
Login user and get JWT token

**Request:**
```json
{
  "username": "amit.sharma",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "amit.sharma",
      "role": "STUDENT",
      "name": "Amit Sharma",
      "email": "amit.sharma@rtu.ac.in",
      "department": "Computer Science"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/register
Register new user

**Request:**
```json
{
  "username": "new.user",
  "password": "password123",
  "role": "STUDENT",
  "name": "New User",
  "email": "new.user@rtu.ac.in",
  "department": "Computer Science",
  "current_semester": 6
}
```

**Response:** Same as login

---

## Student Endpoints

### GET /students/profile
Get current student's profile
**Auth Required:** STUDENT

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "amit.sharma",
    "name": "Amit Sharma",
    "email": "amit.sharma@rtu.ac.in",
    "department": "Computer Science",
    "current_semester": 6,
    "skills": ["Java", "React", "Python"],
    "resume": "base64_encoded_content_or_text"
  }
}
```

### PUT /students/profile
Update current student's profile
**Auth Required:** STUDENT

**Request:**
```json
{
  "name": "Amit Sharma",
  "email": "amit.sharma@rtu.ac.in",
  "department": "Computer Science",
  "current_semester": 7,
  "skills": ["Java", "React", "Python", "Node.js"],
  "resume": "Updated resume content"
}
```

---

## Internship Endpoints

### GET /internships
Get all active internships (filtered by student's department if student)
**Auth Required:** All roles

**Query Parameters:**
- `department` (optional) - Filter by department

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Software Developer Internship",
      "description": "Full-stack development internship...",
      "required_skills": ["Java", "React"],
      "eligible_departments": ["Computer Science", "IT"],
      "stipend_min": 5000,
      "stipend_max": 10000,
      "is_placement": false,
      "posted_by_name": "Dr. Rajesh Gupta",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /internships
Create new internship
**Auth Required:** STAFF

**Request:**
```json
{
  "title": "Software Developer Internship",
  "description": "Full-stack development internship at Jaipur IT Solutions",
  "required_skills": ["Java", "React", "Spring Boot"],
  "eligible_departments": ["Computer Science", "IT"],
  "stipend_min": 5000,
  "stipend_max": 10000,
  "is_placement": false
}
```

### GET /internships/[id]
Get internship by ID
**Auth Required:** All roles

### PUT /internships/[id]
Update internship
**Auth Required:** STAFF (own internships only)

### DELETE /internships/[id]
Delete internship (soft delete)
**Auth Required:** STAFF (own internships only)

---

## Application Endpoints

### GET /applications
Get applications based on user role
**Auth Required:** All roles

**Query Parameters:**
- `status` (optional) - Filter by status

**Response varies by role:**
- **STUDENT**: Own applications
- **MENTOR**: Applications from department students (status: APPLIED)
- **STAFF**: All applications
- **EMPLOYER**: Applications for own internships

### POST /applications
Apply for internship
**Auth Required:** STUDENT

**Request:**
```json
{
  "internship_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "student_id": 1,
    "internship_id": 1,
    "status": "APPLIED",
    "applied_at": "2024-01-15T12:00:00Z",
    "internship_title": "Software Developer Internship"
  }
}
```

### PUT /applications/[id]/approve
Approve application
**Auth Required:** MENTOR (same department only)

### PUT /applications/[id]/reject
Reject application
**Auth Required:** MENTOR (same department only)

---

## Feedback Endpoints

### GET /feedback
Get feedback based on user role
**Auth Required:** STUDENT, STAFF, EMPLOYER

**Query Parameters:**
- `applicationId` (optional) - Filter by application

### POST /feedback
Create feedback for completed internship
**Auth Required:** EMPLOYER

**Request:**
```json
{
  "application_id": 1,
  "rating": 4,
  "comments": "Excellent performance during the internship"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "application_id": 1,
    "supervisor_id": 10,
    "rating": 4,
    "comments": "Excellent performance during the internship",
    "supervisor_name": "Mr. Suresh Agarwal",
    "student_name": "Amit Sharma",
    "internship_title": "Software Developer Internship",
    "created_at": "2024-03-15T14:00:00Z"
  }
}
```

---

## Analytics Endpoints

### GET /analytics/dashboard
Get dashboard analytics
**Auth Required:** STAFF

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "unplaced_students": 25,
      "open_positions": 8,
      "total_applications": 150,
      "average_rating": 4.2,
      "total_feedback": 45
    },
    "status_breakdown": [
      {"status": "APPLIED", "count": 50},
      {"status": "MENTOR_APPROVED", "count": 30},
      {"status": "OFFERED", "count": 25},
      {"status": "COMPLETED", "count": 45}
    ],
    "department_stats": [
      {
        "department": "Computer Science",
        "total_students": 45,
        "total_applications": 120,
        "placed_students": 20
      }
    ],
    "recent_applications": [...],
    "top_internships": [...]
  }
}
```

---

## Application Status Flow
1. `APPLIED` - Student applies
2. `MENTOR_APPROVED` / `MENTOR_REJECTED` - Mentor decision
3. `INTERVIEWED` - After interview (manual status update)
4. `OFFERED` / `NOT_OFFERED` - Final decision
5. `COMPLETED` - After feedback submission

## User Roles & Permissions
- **STUDENT**: View/apply internships, manage profile, view own applications
- **STAFF**: Manage internships, view all applications, access analytics
- **MENTOR**: Approve/reject applications from department students
- **EMPLOYER**: Give feedback for hosted internships

## Error Handling
All endpoints return appropriate HTTP status codes with error messages:
```json
{
  "success": false,
  "error": "Validation error message or system error"
}
```