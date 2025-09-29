import { NextRequest } from 'next/server';
import { getDbQueries, getDatabase } from '@/lib/database';
import { withAuth, ApiResponse, validateRequiredFields, AuthenticatedRequest } from '@/lib/middleware';
import { CertificateGenerator } from '@/lib/certificate-generator';
import { NotificationService } from '@/lib/notification-system';

/**
 * POST /api/certificates
 * Generate certificate for completed internship
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const body = await req.json();
    const { application_id, performance_rating, skills_demonstrated, supervisor_comments } = body;

    // Only employers/supervisors can generate certificates
    if (user.role !== 'EMPLOYER' && user.role !== 'STAFF') {
      return ApiResponse.forbidden('Only employers and staff can generate certificates');
    }

    // Validate required fields
    const validationError = validateRequiredFields(body, ['application_id', 'performance_rating']);
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
      WHERE a.id = ? AND a.status = 'COMPLETED'
    `);

    const application = applicationQuery.get(application_id) as any;

    if (!application) {
      return ApiResponse.notFound('Application not found or not completed');
    }

    // For employers, verify they posted the internship
    if (user.role === 'EMPLOYER') {
      const internshipQuery = db.prepare('SELECT * FROM internships WHERE id = ? AND posted_by = ?');
      const internship = internshipQuery.get(application.internship_id, user.id);
      
      if (!internship) {
        return ApiResponse.forbidden('You can only generate certificates for your own internships');
      }
    }

    // Calculate internship duration
    const startDate = new Date(application.start_date || '2024-01-15');
    const endDate = new Date(application.end_date || new Date());
    const durationWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Generate certificate
    const certificateData = {
      student_name: application.student_name,
      student_id: application.student_id.toString(),
      student_username: application.student_username,
      internship_title: application.internship_title,
      company_name: application.company_name,
      supervisor_name: user.name,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      duration_weeks: durationWeeks,
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
      
      feedbackQuery.run(application_id, user.id, performance_rating, supervisor_comments);
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
      message: 'Certificate generated successfully'
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return ApiResponse.serverError('Failed to generate certificate');
  }
}, ['EMPLOYER', 'STAFF']);

/**
 * GET /api/certificates
 * Get certificates for current user
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const db = getDatabase();

    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Students can only see their own certificates
    if (user.role === 'STUDENT') {
      const certificatesQuery = db.prepare(`
        SELECT * FROM certificates 
        WHERE student_id = ?
        ORDER BY created_at DESC
      `);
      
      const certificates = certificatesQuery.all(user.id) as any[];
      
      const formattedCertificates = certificates.map(cert => ({
        id: cert.certificate_id,
        internship_title: cert.internship_title,
        company_name: cert.company_name,
        completion_date: cert.completion_date,
        performance_rating: cert.performance_rating,
        certificate_url: `/certificates/${cert.certificate_id}.pdf`,
        qr_code_url: `/qr-codes/${cert.certificate_id}.png`
      }));

      return ApiResponse.success({ certificates: formattedCertificates });
    }

    // Staff can see all certificates
    if (user.role === 'STAFF') {
      const certificatesQuery = db.prepare(`
        SELECT c.*, u.name as student_name
        FROM certificates c
        JOIN users u ON c.student_id = u.id
        ORDER BY c.created_at DESC
        LIMIT 50
      `);
      
      const certificates = certificatesQuery.all() as any[];
      
      const formattedCertificates = certificates.map(cert => ({
        id: cert.certificate_id,
        student_name: cert.student_name,
        internship_title: cert.internship_title,
        company_name: cert.company_name,
        completion_date: cert.completion_date,
        performance_rating: cert.performance_rating,
        certificate_url: `/certificates/${cert.certificate_id}.pdf`,
        qr_code_url: `/qr-codes/${cert.certificate_id}.png`
      }));

      return ApiResponse.success({ certificates: formattedCertificates });
    }

    // Employers can see certificates for their internships
    if (user.role === 'EMPLOYER') {
      const certificatesQuery = db.prepare(`
        SELECT c.*, u.name as student_name
        FROM certificates c
        JOIN users u ON c.student_id = u.id
        JOIN applications a ON c.student_id = a.student_id
        JOIN internships i ON a.internship_id = i.id
        WHERE i.posted_by = ?
        ORDER BY c.created_at DESC
        LIMIT 50
      `);
      
      const certificates = certificatesQuery.all(user.id) as any[];
      
      const formattedCertificates = certificates.map(cert => ({
        id: cert.certificate_id,
        student_name: cert.student_name,
        internship_title: cert.internship_title,
        company_name: cert.company_name,
        completion_date: cert.completion_date,
        performance_rating: cert.performance_rating,
        certificate_url: `/certificates/${cert.certificate_id}.pdf`,
        qr_code_url: `/qr-codes/${cert.certificate_id}.png`
      }));

      return ApiResponse.success({ certificates: formattedCertificates });
    }

    return ApiResponse.forbidden('Access denied');

  } catch (error) {
    console.error('Get certificates error:', error);
    return ApiResponse.serverError('Failed to get certificates');
  }
}, ['STUDENT', 'STAFF', 'EMPLOYER']);