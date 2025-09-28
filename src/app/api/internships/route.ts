import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withAuth, ApiResponse, validateRequiredFields, AuthenticatedRequest } from '@/lib/middleware';

/**
 * GET /api/internships
 * Get all active internships (filtered by student's department if student)
 * Public endpoint - authentication optional
 */
export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');

    // Try to get user from token (optional)
    let user = null;
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { verifyToken } = await import('@/lib/auth');
        user = verifyToken(token);
      }
    } catch (error) {
      // Authentication failed, but continue as public request
      console.log('Public access to internships');
    }

    let query = `
      SELECT i.*, u.name as posted_by_name 
      FROM internships i 
      JOIN users u ON i.posted_by = u.id 
      WHERE i.is_active = 1
    `;
    let params: any[] = [];

    // Filter by department for authenticated students
    if (user && user.role === 'STUDENT' && user.department) {
      query += ` AND json_extract(i.eligible_departments, '$') LIKE ?`;
      params.push(`%"${user.department}"%`);
    } else if (department) {
      query += ` AND json_extract(i.eligible_departments, '$') LIKE ?`;
      params.push(`%"${department}"%`);
    }

    query += ` ORDER BY i.created_at DESC`;

    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }
    const internships = db.prepare(query).all(...params);

    // Parse JSON fields
    const internshipsData = internships.map((internship: any) => ({
      ...internship,
      required_skills: JSON.parse(internship.required_skills),
      eligible_departments: JSON.parse(internship.eligible_departments),
    }));

    return ApiResponse.success(internshipsData);

  } catch (error) {
    console.error('Get internships error:', error);
    return ApiResponse.serverError('Failed to get internships');
  }
}

/**
 * POST /api/internships
 * Create new internship (staff only)
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { title, description, required_skills, eligible_departments, stipend_min, stipend_max, is_placement } = body;
    const user = req.user!;

    // Validate required fields
    const validationError = validateRequiredFields(body, ['title', 'description', 'required_skills', 'eligible_departments']);
    if (validationError) {
      return ApiResponse.error(validationError);
    }

    // Validate arrays
    if (!Array.isArray(required_skills) || required_skills.length === 0) {
      return ApiResponse.error('required_skills must be a non-empty array');
    }

    if (!Array.isArray(eligible_departments) || eligible_departments.length === 0) {
      return ApiResponse.error('eligible_departments must be a non-empty array');
    }

    const db = getDatabase();
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Create internship
    const createInternship = db.prepare(`
      INSERT INTO internships (title, description, required_skills, eligible_departments, stipend_min, stipend_max, is_placement, posted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = createInternship.run(
      title,
      description,
      JSON.stringify(required_skills),
      JSON.stringify(eligible_departments),
      stipend_min || null,
      stipend_max || null,
      is_placement ? 1 : 0,
      user.id
    );

    // Get created internship
    const newInternship = db.prepare(`
      SELECT i.*, u.name as posted_by_name 
      FROM internships i 
      JOIN users u ON i.posted_by = u.id 
      WHERE i.id = ?
    `).get(result.lastInsertRowid) as {
      id: number;
      title: string;
      description: string;
      required_skills: string;
      eligible_departments: string;
      stipend_min: number;
      stipend_max: number;
      is_placement: number;
      posted_by_name: string;
    };

    const internshipData = {
      ...newInternship,
      required_skills: JSON.parse(newInternship.required_skills),
      eligible_departments: JSON.parse(newInternship.eligible_departments),
    };

    return ApiResponse.success(internshipData, 201);

  } catch (error) {
    console.error('Create internship error:', error);
    return ApiResponse.serverError('Failed to create internship');
  }
}, ['STAFF']);