import { NextRequest } from 'next/server';
import { getDbQueries } from '@/lib/database';
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

    const queries = getDbQueries();
    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Get application details (would need to implement this query)
    // For now, using mock data
    const mockApplicationData = {
      id: application_id,
      student_id: 1,
      student_name: 'John Doe',
      student_username: 'john.doe',
      internship_title: 'Software Developer Intern',
      company_name: 'Tech Solutions Pvt Ltd',
      supervisor_name: user.name,
      start_date: '2024-01-15',
      end_date: '2024-04-15',
      duration_weeks: 12
    };

    // Generate certificate
    const certificateData = {
      student_name: mockApplicationData.student_name,
      student_id: mockApplicationData.student_username,
      internship_title: mockApplicationData.internship_title,
      company_name: mockApplicationData.company_name,
      supervisor_name: mockApplicationData.supervisor_name,
      start_date: mockApplicationData.start_date,
      end_date: mockApplicationData.end_date,
      duration_weeks: mockApplicationData.duration_weeks,
      performance_rating,
      skills_demonstrated: skills_demonstrated || [],
      completion_date: new Date().toISOString().split('T')[0],
      certificate_id: ''
    };

    const certificate = await CertificateGenerator.generateCertificate(certificateData);

    // Update employability record
    const employabilityRecord = await CertificateGenerator.updateEmployabilityRecord(
      mockApplicationData.student_id, 
      { ...certificateData, certificate_id: certificate.certificate_id }
    );

    // Update application status to COMPLETED
    // queries.updateApplicationStatus.run('COMPLETED', user.id, application_id);

    // Send notification to student
    await NotificationService.notifyCertificateGenerated(
      mockApplicationData.student_id,
      mockApplicationData.internship_title,
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

    // Students can only see their own certificates
    if (user.role === 'STUDENT') {
      // Mock data - in production, query database for user's certificates
      const certificates = [
        {
          id: 'CERT-123456',
          internship_title: 'Software Developer Intern',
          company_name: 'Tech Solutions',
          completion_date: '2024-04-15',
          performance_rating: 4.5,
          certificate_url: '/certificates/CERT-123456.pdf',
          qr_code_url: '/qr-codes/CERT-123456.png'
        }
      ];

      return ApiResponse.success({ certificates });
    }

    // Staff can see all certificates
    if (user.role === 'STAFF') {
      const allCertificates: any[] = [
        // Mock data for all certificates
      ];

      return ApiResponse.success({ certificates: allCertificates });
    }

    return ApiResponse.forbidden('Access denied');

  } catch (error) {
    console.error('Get certificates error:', error);
    return ApiResponse.serverError('Failed to get certificates');
  }
}, ['STUDENT', 'STAFF']);