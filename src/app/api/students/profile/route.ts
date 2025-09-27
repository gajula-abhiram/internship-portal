import { NextRequest } from 'next/server';
import { getDbQueries } from '@/lib/database';
import { 
  withAuth, 
  ApiResponse, 
  validateRequiredFields, 
  validateEmail,
  validateDepartment,
  validateSemester,
  validateSkills,
  sanitizeString,
  sanitizeHtml,
  AuthenticatedRequest 
} from '@/lib/middleware';

/**
 * GET /api/students/profile
 * Get current student's profile
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const queries = getDbQueries();
    const user = req.user!;

    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }

    if (user.role !== 'STUDENT') {
      return ApiResponse.forbidden('Only students can access this endpoint');
    }

    const student = queries.getUserById.get(user.id) as any;

    if (!student) {
      return ApiResponse.notFound('Student not found');
    }

    // Parse JSON fields safely
    let skills = [];
    try {
      skills = student.skills ? JSON.parse(student.skills) : [];
    } catch (e) {
      skills = [];
    }

    // Return student data without sensitive information
    const studentData = {
      id: student.id,
      username: student.username,
      name: student.name,
      email: student.email,
      department: student.department,
      current_semester: student.current_semester,
      skills: skills,
      resume: student.resume,
      created_at: student.created_at,
      updated_at: student.updated_at
    };

    return ApiResponse.success(studentData);

  } catch (error) {
    console.error('Get student profile error:', error);
    return ApiResponse.serverError('Failed to get profile');
  }
}, ['STUDENT']);

/**
 * PUT /api/students/profile
 * Update current student's profile
 */
export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    let { name, email, department, current_semester, skills, resume } = body;
    const user = req.user!;

    if (user.role !== 'STUDENT') {
      return ApiResponse.forbidden('Only students can access this endpoint');
    }

    // Sanitize inputs
    name = sanitizeString(name || '');
    email = sanitizeString(email || '');
    department = sanitizeString(department || '');
    resume = sanitizeHtml(resume || '');

    // Validate required fields
    const validationError = validateRequiredFields({ name, email }, ['name', 'email']);
    if (validationError) {
      return ApiResponse.error(validationError, 400);
    }

    // Validate email format
    if (!validateEmail(email)) {
      return ApiResponse.error('Invalid email format', 400);
    }

    // Validate department if provided
    if (department && !validateDepartment(department)) {
      return ApiResponse.error('Invalid department', 400);
    }

    // Validate semester if provided
    if (current_semester !== undefined && !validateSemester(current_semester)) {
      return ApiResponse.error('Invalid semester. Must be between 1 and 8', 400);
    }

    // Validate skills if provided
    if (skills && !validateSkills(skills)) {
      return ApiResponse.error('Invalid skills format. Must be an array of non-empty strings', 400);
    }

    // Validate resume length
    if (resume && resume.length > 5000) {
      return ApiResponse.error('Resume cannot exceed 5000 characters', 400);
    }

    const queries = getDbQueries();
    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Check if email is already taken by another user
    // Note: This would require a specific query in a real implementation
    // For now, we'll skip this check

    // Update user profile
    const result = queries.updateUser.run(
      name,
      email,
      department || '',
      current_semester || 1,
      skills ? JSON.stringify(skills) : '',
      resume || '',
      user.id
    );

    if (result.changes === 0) {
      return ApiResponse.error('Profile not found or no changes made', 404);
    }

    // Get updated user
    const updatedUser = queries.getUserById.get(user.id) as any;

    if (!updatedUser) {
      return ApiResponse.serverError('Failed to retrieve updated profile');
    }

    // Parse skills safely
    let parsedSkills = [];
    try {
      parsedSkills = updatedUser.skills ? JSON.parse(updatedUser.skills) : [];
    } catch (e) {
      parsedSkills = [];
    }

    const userData = {
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
      department: updatedUser.department,
      current_semester: updatedUser.current_semester,
      skills: parsedSkills,
      resume: updatedUser.resume,
      updated_at: updatedUser.updated_at
    };

    return ApiResponse.success({
      ...userData,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update student profile error:', error);
    
    if (error instanceof SyntaxError) {
      return ApiResponse.error('Invalid JSON format', 400);
    }
    
    return ApiResponse.serverError('Failed to update profile');
  }
}, ['STUDENT']);