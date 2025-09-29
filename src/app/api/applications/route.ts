import { NextRequest } from 'next/server';
import { getDbQueries } from '@/lib/database';
import { withAuth, ApiResponse, validateRequiredFields, AuthenticatedRequest } from '@/lib/middleware';
import { NotificationService } from '@/lib/notification-system';

/**
 * GET /api/applications
 * Get applications based on user role
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const queries = getDbQueries();
    const user = req.user!;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }

    let applications: any[] = [];

    if (user.role === 'STUDENT') {
      // Students see their own applications
      applications = queries.getApplicationsByStudent.all(user.id);
    } else if (user.role === 'MENTOR') {
      // Mentors see applications from their department students
      applications = queries.getApplicationsForMentor.all(user.id);
    } else if (user.role === 'STAFF') {
      // Staff see all applications - using mock data until getAllApplications is implemented
      const studentApplications = queries.getApplicationsByStudent ? 
        queries.getApplicationsByStudent.all(user.id) : [];
      applications = studentApplications;
    } else if (user.role === 'EMPLOYER') {
      // Employers see applications for their internships
      // This would need a specific query implementation
      applications = [];
    }

    // Filter by status if provided
    if (status) {
      applications = applications.filter((app: any) => app.status === status);
    }

    return ApiResponse.success(applications);

  } catch (error) {
    console.error('Get applications error:', error);
    return ApiResponse.serverError('Failed to get applications');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);

/**
 * POST /api/applications
 * Create new application (students only)
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { internship_id } = body;
    const user = req.user!;

    // Validate required fields
    const validationError = validateRequiredFields(body, ['internship_id']);
    if (validationError) {
      return ApiResponse.error(validationError, 400);
    }

    const queries = getDbQueries();
    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Check if internship exists and is active
    const internship = queries.getInternshipById.get(internship_id) as any;

    if (!internship) {
      return ApiResponse.notFound('Internship not found or inactive');
    }

    // Parse eligible departments
    let eligibleDepartments = [];
    try {
      eligibleDepartments = JSON.parse(internship.eligible_departments);
    } catch (e) {
      return ApiResponse.serverError('Invalid internship data');
    }

    // Check if student's department is eligible
    if (!eligibleDepartments.includes(user.department)) {
      return ApiResponse.error('Your department is not eligible for this internship', 400);
    }

    // Check if student already applied
    const existingApplications = queries.getApplicationsByStudent.all(user.id);
    const alreadyApplied = existingApplications.some((app: any) => app.internship_id === internship_id);
    
    if (alreadyApplied) {
      return ApiResponse.error('You have already applied for this internship', 409);
    }

    // Create application
    const result = queries.createApplication.run(user.id, internship_id);

    // Get created application with details
    const newApplications = queries.getApplicationsByStudent.all(user.id);
    const newApplication = newApplications.find((app: any) => app.internship_id === internship_id);
    
    // Initialize application tracking if application was created successfully
    if (newApplication && newApplication.id) {
      // Initialize default tracking steps for the new application
      const defaultSteps = [
        { step: 'Application Submitted', status: 'COMPLETED' },
        { step: 'Resume Review', status: 'PENDING' },
        { step: 'Document Verification', status: 'PENDING' },
        { step: 'Mentor Review', status: 'PENDING' },
        { step: 'Employer Review', status: 'PENDING' },
        { step: 'Interview Scheduling', status: 'PENDING' },
        { step: 'Interview Process', status: 'PENDING' },
        { step: 'Feedback Collection', status: 'PENDING' },
        { step: 'Final Decision', status: 'PENDING' },
        { step: 'Offer Processing', status: 'PENDING' }
      ];

      const trackingStmt = queries.db.prepare(`
        INSERT INTO application_tracking (application_id, step, status, completed_at)
        VALUES (?, ?, ?, ?)
      `);

      defaultSteps.forEach(track => {
        const completedAt = track.status === 'COMPLETED' ? new Date().toISOString() : null;
        trackingStmt.run(newApplication.id, track.step, track.status, completedAt);
      });
    }

    // Send notifications
    await NotificationService.notifyApplicationSubmitted(
      user.id,
      internship.title,
      // In production, would find the appropriate mentor based on department
      undefined
    );

    return ApiResponse.success({
      application: newApplication,
      message: 'Application submitted successfully'
    }, 201);

  } catch (error) {
    console.error('Create application error:', error);
    return ApiResponse.serverError('Failed to create application');
  }
}, ['STUDENT']);