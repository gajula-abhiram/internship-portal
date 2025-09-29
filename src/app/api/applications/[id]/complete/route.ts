import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withAuth, ApiResponse, validateRequiredFields, AuthenticatedRequest } from '@/lib/middleware';
import { CertificateGenerator } from '@/lib/certificate-generator';
import { NotificationService } from '@/lib/notification-system';

/**
 * POST /api/applications/[id]/complete
 * Complete an internship and generate certificate
 */
export const POST = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const user = req.user!;
    const { id } = await context.params;
    const applicationId = parseInt(id);
    
    if (isNaN(applicationId)) {
      return ApiResponse.error('Invalid application ID', 400);
    }

    const body = await req.json();
    const { 
      performance_rating, 
      skills_demonstrated, 
      supervisor_comments,
      start_date,
      end_date
    } = body;

    // Validate required fields
    const validationError = validateRequiredFields(body, ['performance_rating', 'start_date', 'end_date']);
    if (validationError) {
      return ApiResponse.error(validationError, 400);
    }

    if (performance_rating < 1 || performance_rating > 5) {
      return ApiResponse.error('Performance rating must be between 1 and 5', 400);
    }

    const db = getDatabase();
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Get application details
    const applicationQuery = db.prepare(`
      SELECT a.*, i.title as internship_title, i.company_name,
             u.id as student_id, u.name as student_name, u.username as student_username,
             u.department as student_department
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN users u ON a.student_id = u.id
      WHERE a.id = ?
    `);

    const application = applicationQuery.get(applicationId) as any;

    if (!application) {
      return ApiResponse.notFound('Application not found');
    }

    // Only employers who posted the internship or staff can complete it
    if (user.role !== 'STAFF') {
      const internshipQuery = db.prepare('SELECT * FROM internships WHERE id = ? AND posted_by = ?');
      const internship = internshipQuery.get(application.internship_id, user.id);
      
      if (!internship && user.role !== 'EMPLOYER') {
        return ApiResponse.forbidden('You can only complete internships you posted');
      }
    }

    // Update application status to COMPLETED
    const updateQuery = db.prepare(`
      UPDATE applications 
      SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    updateQuery.run(applicationId);

    // Generate certificate
    const certificateData = {
      student_name: application.student_name,
      student_id: application.student_id.toString(),
      student_username: application.student_username,
      internship_title: application.internship_title,
      company_name: application.company_name,
      supervisor_name: user.name,
      start_date: start_date,
      end_date: end_date,
      duration_weeks: Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)),
      performance_rating,
      skills_demonstrated: skills_demonstrated || [],
      completion_date: new Date().toISOString().split('T')[0],
      certificate_id: ''
    };

    const certificate = await CertificateGenerator.generateCertificate(certificateData);

    // Update employability record
    const employabilityRecord = await CertificateGenerator.updateEmployabilityRecord(
      application.student_id, 
      { ...certificateData, certificate_id: certificate.certificate_id }
    );

    // Store certificate feedback
    if (supervisor_comments) {
      const feedbackQuery = db.prepare(`
        INSERT INTO feedback (application_id, supervisor_id, rating, comments)
        VALUES (?, ?, ?, ?)
      `);
      
      feedbackQuery.run(applicationId, user.id, performance_rating, supervisor_comments);
    }

    // Send notification to student
    await NotificationService.notifyCertificateGenerated(
      application.student_id,
      application.internship_title,
      certificate.certificate_url
    );

    return ApiResponse.success({
      certificate,
      employability_record: employabilityRecord,
      message: 'Internship completed and certificate generated successfully'
    });

  } catch (error) {
    console.error('Complete internship error:', error);
    return ApiResponse.serverError('Failed to complete internship');
  }
}, ['EMPLOYER', 'STAFF']);