import { NextRequest } from 'next/server';
import { getDbQueries } from '@/lib/database';
import { generateToken, comparePassword } from '@/lib/auth';
import { ApiResponse, validateRequiredFields, validateUsername, checkRateLimit, sanitizeString } from '@/lib/middleware';

/**
 * POST /api/auth/login
 * User login endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { username, password } = body;

    // Basic input sanitization
    username = sanitizeString(username || '');
    password = password || '';

    // Validate required fields
    const validationError = validateRequiredFields(body, ['username', 'password']);
    if (validationError) {
      return ApiResponse.error(validationError, 400);
    }

    // Validate username format
    const usernameError = validateUsername(username);
    if (usernameError) {
      return ApiResponse.error(usernameError, 400);
    }

    // Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`login_${clientIp}`, 10, 15 * 60 * 1000)) {
      return ApiResponse.error('Too many login attempts. Please try again later.', 429);
    }

    const queries = getDbQueries();
    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }
    
    // Find user by username
    const user = queries.getUserByUsername.get(username) as {
      id: number;
      username: string;
      password_hash: string;
      role: string;
      name: string;
      email: string;
      department?: string;
      current_semester?: number;
    } | undefined;
    
    if (!user) {
      // Use a generic error message to prevent username enumeration
      return ApiResponse.error('Invalid credentials', 401);
    }

    // Verify password
    const passwordValid = await comparePassword(password, user.password_hash);
    if (!passwordValid) {
      return ApiResponse.error('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role as 'STUDENT' | 'STAFF' | 'MENTOR' | 'EMPLOYER',
      name: user.name,
      department: user.department,
    });

    // Return user data and token (excluding password)
    const { password_hash, ...userWithoutPassword } = user;
    
    return ApiResponse.success({
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return ApiResponse.error('Invalid JSON format', 400);
    }
    
    return ApiResponse.serverError('Login failed. Please try again.');
  }
}