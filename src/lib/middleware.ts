import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, UserPayload } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: UserPayload;
}

/**
 * Authentication middleware for API routes
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse> | NextResponse,
  requiredRoles?: string[]
) {
  return async (req: AuthenticatedRequest, context?: any): Promise<NextResponse> => {
    try {
      // Extract token from Authorization header
      const token = extractTokenFromHeader(req.headers.get('authorization') || '');
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        );
      }

      // Verify token
      const user = verifyToken(token);
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Check role permissions
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Attach user to request
      req.user = user;

      // Call the handler
      return handler(req, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Public route handler (no authentication required)
 */
export function withoutAuth(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return handler;
}

/**
 * Response helpers
 */
export const ApiResponse = {
  success: (data: any, status = 200) => {
    return NextResponse.json({ success: true, data }, { status });
  },

  error: (message: string, status = 400) => {
    return NextResponse.json({ success: false, error: message }, { status });
  },

  unauthorized: (message = 'Unauthorized') => {
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  },

  forbidden: (message = 'Forbidden') => {
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  },

  notFound: (message = 'Not found') => {
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  },

  serverError: (message = 'Internal server error') => {
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  },
};

/**
 * Validation helpers
 */
export function validateRequiredFields(data: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      return `${field} is required`;
    }
  }
  return null;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/(?=.*\d)/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
  }
  return null;
}

export function validateUsername(username: string): string | null {
  if (username.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  if (username.length > 30) {
    return 'Username must be less than 30 characters';
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, dots, hyphens, and underscores';
  }
  return null;
}

export function validateRole(role: string): boolean {
  return ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER'].includes(role);
}

export function validateDepartment(department: string): boolean {
  const validDepartments = [
    'Computer Science',
    'Information Technology', 
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering'
  ];
  return validDepartments.includes(department);
}

export function validateSemester(semester: number): boolean {
  return Number.isInteger(semester) && semester >= 1 && semester <= 8;
}

export function validateSkills(skills: any): boolean {
  return Array.isArray(skills) && skills.every(skill => typeof skill === 'string' && skill.trim().length > 0);
}

export function validateStipend(min: number, max: number): string | null {
  if (min < 0 || max < 0) {
    return 'Stipend amounts must be positive';
  }
  if (min > max) {
    return 'Minimum stipend cannot be greater than maximum stipend';
  }
  return null;
}

export function validateRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

// Sanitization helpers
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>"'&]/g, '');
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}