import { NextRequest, NextResponse } from 'next/server';
import { getDbQueries } from '@/lib/database';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const user = req.user!;
    const { id } = await context.params;
    const applicationId = parseInt(id);

    if (isNaN(applicationId)) {
      return ApiResponse.error('Invalid application ID', 400);
    }

    const queries = getDbQueries();
    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Get detailed application information
    const applications = queries.getApplicationsByStudent ? 
      queries.getApplicationsByStudent.all(user.id) : [];
    
    // Find the specific application
    const application = applications.find((app: any) => app.id === applicationId);

    if (!application) {
      return ApiResponse.notFound('Application not found');
    }

    // Check if user has permission to view this application
    const canView = 
      user.role === 'STAFF' || // Staff can see all
      (user.role === 'STUDENT' && (application as any).student_id === user.id) || // Students can see their own
      (user.role === 'MENTOR' && (application as any).student_department === user.department) || // Mentors can see their department
      (user.role === 'EMPLOYER'); // Employers can see applications for their positions

    if (!canView) {
      return ApiResponse.error('Permission denied', 403);
    }

    // Get feedback for this application (mock implementation for now)
    const feedback: any[] = [];
    
    // In a real implementation, you would query the feedback table
    // const feedback = queries.getFeedbackByApplication.all(applicationId);

    // Combine application data with feedback
    const applicationWithFeedback = {
      ...application,
      feedback: feedback
    };

    return ApiResponse.success(applicationWithFeedback);

  } catch (error) {
    console.error('Error fetching application details:', error);
    return ApiResponse.serverError('Failed to fetch application details');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);