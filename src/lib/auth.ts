import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Use environment variable for JWT secret, with a more robust fallback for Vercel
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 
                  (process.env.VERCEL === '1' ? 'vercel_production_secret_fallback_32_chars_min' : 'fallback-development-secret');

// Validate JWT secret in production
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.warn('⚠️  Production deployment requires a secure JWT_SECRET (minimum 32 characters)');
  console.warn('💡 Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  if (process.env.VERCEL === '1') {
    console.warn('🔧 Set JWT_SECRET in your Vercel environment variables for better security');
  }
}

export interface UserPayload {
  id: number;
  username: string;
  role: 'STUDENT' | 'STAFF' | 'MENTOR' | 'EMPLOYER';
  name: string;
  department?: string;
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: UserPayload): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify JWT token and return user data
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.substring(7); // Remove "Bearer " prefix
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Role-based access control helper
 */
export const ROLES = {
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
  MENTOR: 'MENTOR',
  EMPLOYER: 'EMPLOYER',
} as const;

export const ROLE_PERMISSIONS = {
  STUDENT: ['view_internships', 'apply_internship', 'view_own_applications', 'update_own_profile'],
  STAFF: ['manage_internships', 'view_all_applications', 'view_analytics', 'manage_users'],
  MENTOR: ['approve_applications', 'view_department_applications', 'view_own_profile'],
  EMPLOYER: ['give_feedback', 'view_hosted_internships', 'view_own_profile'],
} as const;

/**
 * Middleware to require authentication for API routes
 */
export async function requireAuth(request: Request): Promise<UserPayload & { skills?: string } | null> {
  const authorization = request.headers.get('authorization');
  const token = extractTokenFromHeader(authorization || '');
  
  if (!token) {
    return null;
  }
  
  const user = verifyToken(token);
  return user;
}