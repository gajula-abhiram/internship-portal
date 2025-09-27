import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';

/**
 * PUT /api/applications/[id]/reject
 * Reject application (mentors only)
 */
export const PUT = withAuth(async (req: AuthenticatedRequest, context: { params: { id: string } }) => {
  try {
    const user = req.user!;
    const applicationId = parseInt(context.params.id);

    if (isNaN(applicationId)) {
      return ApiResponse.error('Invalid application ID');
    }

    const db = getDatabase();
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Get application with student details
    const application = db.prepare(`
      SELECT a.*, s.department as student_department, s.name as student_name
      FROM applications a
      JOIN users s ON a.student_id = s.id
      WHERE a.id = ?
    `).get(applicationId) as {
      id: number;
      student_id: number;
      internship_id: number;
      status: string;
      student_department: string;
      student_name: string;
    } | undefined;

    if (!application) {
      return ApiResponse.notFound('Application not found');
    }

    // Check if mentor can reject (same department)
    if (application.student_department !== user.department) {
      return ApiResponse.forbidden('You can only reject applications from your department');
    }

    // Check if application is in correct status
    if (application.status !== 'APPLIED') {
      return ApiResponse.error('Application is not in applied status');
    }

    // Update application status
    const updateApplication = db.prepare(`
      UPDATE applications 
      SET status = 'MENTOR_REJECTED', mentor_id = ?, mentor_approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateApplication.run(user.id, applicationId);

    // Get updated application
    const updatedApplication = db.prepare(`
      SELECT a.*, i.title as internship_title, s.name as student_name, s.department as student_department
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN users s ON a.student_id = s.id
      WHERE a.id = ?
    `).get(applicationId);

    return ApiResponse.success(updatedApplication);

  } catch (error) {
    console.error('Reject application error:', error);
    return ApiResponse.serverError('Failed to reject application');
  }
}, ['MENTOR']);