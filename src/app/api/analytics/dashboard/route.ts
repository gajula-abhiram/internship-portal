import { NextRequest } from 'next/server';
import { getDbQueries } from '@/lib/database';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';

/**
 * GET /api/analytics/dashboard
 * Get dashboard analytics (staff only)
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const queries = getDbQueries();
    
    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Get unplaced students count
    const unplacedStudents = queries.getUnplacedStudentsCount.get() as { count: number } | undefined;

    // Get application status breakdown
    const statusBreakdown = queries.getApplicationStatusBreakdown.all() as { status: string; count: number }[];

    // Get open positions count
    const openPositions = queries.getOpenPositionsCount.get() as { count: number } | undefined;

    // Mock recent applications and feedback data for now
    const recentApplications = [
      { id: 1, internship_title: 'Software Developer', student_name: 'John Doe', student_department: 'Computer Science', status: 'APPLIED', created_at: new Date().toISOString() },
      { id: 2, internship_title: 'Frontend Developer', student_name: 'Jane Smith', student_department: 'IT', status: 'MENTOR_APPROVED', created_at: new Date().toISOString() }
    ];

    // Mock data for missing queries until we implement them
    const topInternships = [
      { id: 1, title: 'Software Developer Intern', application_count: 15, posted_by_name: 'Tech Corp' },
      { id: 2, title: 'Frontend Developer', application_count: 12, posted_by_name: 'Web Solutions' }
    ];

    // Mock average rating
    const avgRating = 4.2;
    const totalFeedback = 15;

    const analytics = {
      summary: {
        unplaced_students: unplacedStudents?.count || 0,
        open_positions: openPositions?.count || 0,
        total_applications: statusBreakdown.reduce((sum: number, item: any) => sum + item.count, 0),
        average_rating: Math.round(avgRating * 100) / 100,
        total_feedback: totalFeedback
      },
      status_breakdown: statusBreakdown,
      recent_applications: recentApplications,
      top_internships: topInternships
    };

    return ApiResponse.success(analytics);

  } catch (error) {
    console.error('Get analytics error:', error);
    return ApiResponse.serverError('Failed to get analytics');
  }
}, ['STAFF']);