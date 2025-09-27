import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withAuth, ApiResponse, validateRequiredFields, AuthenticatedRequest } from '@/lib/middleware';

/**
 * GET /api/feedback
 * Get feedback based on user role
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const db = getDatabase();
    const user = req.user!;
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    let query = '';
    let params: any[] = [];

    if (user.role === 'STUDENT') {
      // Students see feedback for their applications
      query = `
        SELECT f.*, u.name as supervisor_name, a.internship_id, i.title as internship_title
        FROM feedback f
        JOIN applications a ON f.application_id = a.id
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON f.supervisor_id = u.id
        WHERE a.student_id = ?
      `;
      params.push(user.id);
    } else if (user.role === 'EMPLOYER') {
      // Employers see feedback they have given
      query = `
        SELECT f.*, u.name as supervisor_name, a.student_id, s.name as student_name,
               a.internship_id, i.title as internship_title
        FROM feedback f
        JOIN applications a ON f.application_id = a.id
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON f.supervisor_id = u.id
        JOIN users s ON a.student_id = s.id
        WHERE f.supervisor_id = ?
      `;
      params.push(user.id);
    } else if (user.role === 'STAFF') {
      // Staff see all feedback
      query = `
        SELECT f.*, u.name as supervisor_name, a.student_id, s.name as student_name,
               a.internship_id, i.title as internship_title
        FROM feedback f
        JOIN applications a ON f.application_id = a.id
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON f.supervisor_id = u.id
        JOIN users s ON a.student_id = s.id
        WHERE 1=1
      `;
    }

    // Add application filter if provided
    if (applicationId && query) {
      query += ` AND a.id = ?`;
      params.push(parseInt(applicationId));
    }

    if (query) {
      query += ` ORDER BY f.created_at DESC`;
      if (!db) {
        return ApiResponse.serverError('Database connection failed');
      }
      const feedback = db.prepare(query).all(...params);
      return ApiResponse.success(feedback);
    }

    return ApiResponse.success([]);

  } catch (error) {
    console.error('Get feedback error:', error);
    return ApiResponse.serverError('Failed to get feedback');
  }
}, ['STUDENT', 'STAFF', 'EMPLOYER']);

/**
 * POST /api/feedback
 * Create feedback (employers only)
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { application_id, rating, comments } = body;
    const user = req.user!;

    // Validate required fields
    const validationError = validateRequiredFields(body, ['application_id', 'rating']);
    if (validationError) {
      return ApiResponse.error(validationError);
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return ApiResponse.error('Rating must be between 1 and 5');
    }

    const db = getDatabase();
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Check if application exists and is for employer's internship
    const application = db.prepare(`
      SELECT a.*, i.posted_by, i.title as internship_title, s.name as student_name
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN users s ON a.student_id = s.id
      WHERE a.id = ?
    `).get(application_id) as {
      id: number;
      student_id: number;
      internship_id: number;
      status: string;
      posted_by: number;
      internship_title: string;
      student_name: string;
    } | undefined;

    if (!application) {
      return ApiResponse.notFound('Application not found');
    }

    if (application.posted_by !== user.id) {
      return ApiResponse.forbidden('You can only give feedback for your own internships');
    }

    // Check if application status allows feedback
    if (!['OFFERED', 'COMPLETED'].includes(application.status)) {
      return ApiResponse.error('Can only give feedback for offered or completed internships');
    }

    // Check if feedback already exists
    const existingFeedback = db.prepare('SELECT id FROM feedback WHERE application_id = ?').get(application_id);
    if (existingFeedback) {
      return ApiResponse.error('Feedback already exists for this application');
    }

    // Create feedback
    const createFeedback = db.prepare(`
      INSERT INTO feedback (application_id, supervisor_id, rating, comments)
      VALUES (?, ?, ?, ?)
    `);

    const result = createFeedback.run(application_id, user.id, rating, comments || null);

    // Update application status to completed
    const updateApplication = db.prepare(`
      UPDATE applications 
      SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateApplication.run(application_id);

    // Get created feedback with details
    const newFeedback = db.prepare(`
      SELECT f.*, u.name as supervisor_name, a.student_id, s.name as student_name,
             a.internship_id, i.title as internship_title
      FROM feedback f
      JOIN applications a ON f.application_id = a.id
      JOIN internships i ON a.internship_id = i.id
      JOIN users u ON f.supervisor_id = u.id
      JOIN users s ON a.student_id = s.id
      WHERE f.id = ?
    `).get(result.lastInsertRowid);

    return ApiResponse.success(newFeedback, 201);

  } catch (error) {
    console.error('Create feedback error:', error);
    return ApiResponse.serverError('Failed to create feedback');
  }
}, ['EMPLOYER']);