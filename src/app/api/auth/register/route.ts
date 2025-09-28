import { NextRequest } from 'next/server';
import { getDbQueries } from '@/lib/database';
import { hashPassword, generateToken } from '@/lib/auth';
import { 
  ApiResponse, 
  validateRequiredFields, 
  validateEmail, 
  validatePassword, 
  validateUsername,
  validateRole,
  validateDepartment,
  validateSemester,
  checkRateLimit,
  sanitizeString
} from '@/lib/middleware';

/**
 * POST /api/auth/register
 * User registration endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { username, password, role, name, email, department, current_semester } = body;

    // Basic input sanitization
    username = sanitizeString(username || '');
    name = sanitizeString(name || '');
    email = sanitizeString(email || '');
    role = sanitizeString(role || '').toUpperCase();
    department = sanitizeString(department || '');

    // Validate required fields
    const validationError = validateRequiredFields(body, ['username', 'password', 'role', 'name', 'email']);
    if (validationError) {
      return ApiResponse.error(validationError, 400);
    }

    // Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`register_${clientIp}`, 5, 60 * 60 * 1000)) {
      return ApiResponse.error('Too many registration attempts. Please try again later.', 429);
    }

    // Validate username format
    const usernameError = validateUsername(username);
    if (usernameError) {
      return ApiResponse.error(usernameError, 400);
    }

    // Validate email format
    if (!validateEmail(email)) {
      return ApiResponse.error('Invalid email format', 400);
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return ApiResponse.error(passwordError, 400);
    }

    // Validate role
    if (!validateRole(role)) {
      return ApiResponse.error('Invalid role. Must be STUDENT, STAFF, MENTOR, or EMPLOYER', 400);
    }

    // Validate department for students and mentors
    if ((role === 'STUDENT' || role === 'MENTOR') && department) {
      if (!validateDepartment(department)) {
        return ApiResponse.error('Invalid department', 400);
      }
    }

    // Validate semester for students
    if (role === 'STUDENT' && current_semester !== undefined) {
      if (!validateSemester(current_semester)) {
        return ApiResponse.error('Invalid semester. Must be between 1 and 8', 400);
      }
    }

    // Validate email domain for institutional accounts
    // Allow common university domains and educational institutions
    const emailDomain = email.toLowerCase().split('@')[1];
    const isUniversityEmail = 
      emailDomain.includes('.edu') || 
      emailDomain.includes('.ac.') || 
      emailDomain.includes('university') ||
      emailDomain.includes('college') ||
      emailDomain.includes('.edu.') ||
      ['rtu.ac.in', 'jec.ac.in', 'iit.ac.in', 'nit.ac.in', 'iiit.ac.in'].some(domain => emailDomain.endsWith(domain));
    
    if (!isUniversityEmail) {
      return ApiResponse.error('Please use your institutional/university email address (.edu, .ac.in, university domain)', 400);
    }

    const queries = getDbQueries();
    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Check if username already exists
    const existingUser = queries.getUserByUsername.get(username);
    if (existingUser) {
      return ApiResponse.error('Username already exists', 409);
    }

    // Check if email already exists
    // Note: This would need a separate query in the database layer
    // For now, we'll use a basic implementation

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = queries.createUser.run(
      username,
      passwordHash,
      role,
      name,
      email,
      department || undefined,
      current_semester || undefined,
      undefined, // skills - empty initially
      undefined  // resume - empty initially
    );

    // Get created user
    const userId = Number(result.lastInsertRowid);
    const newUser = queries.getUserById.get(userId) as {
      id: number;
      username: string;
      password_hash: string;
      role: string;
      name: string;
      email: string;
      department?: string;
      current_semester?: number;
    };
    
    if (!newUser) {
      return ApiResponse.serverError('Failed to create user');
    }

    const { password_hash, ...userWithoutPassword } = newUser;

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role as 'STUDENT' | 'STAFF' | 'MENTOR' | 'EMPLOYER',
      name: newUser.name,
      department: newUser.department,
    });

    return ApiResponse.success({
      user: userWithoutPassword,
      token,
      message: 'Registration successful'
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return ApiResponse.error('Invalid JSON format', 400);
    }
    
    if (error instanceof Error && error.message && error.message.includes('UNIQUE constraint failed')) {
      return ApiResponse.error('Username or email already exists', 409);
    }
    
    return ApiResponse.serverError('Registration failed. Please try again.');
  }
}