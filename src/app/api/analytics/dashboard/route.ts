import { NextRequest } from 'next/server';
import { getDbQueries, getDatabase } from '@/lib/database';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';

/**
 * GET /api/analytics/dashboard
 * Get dashboard analytics (staff only)
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const queries = getDbQueries();
    const db = getDatabase();
    
    if (!queries || !db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Get unplaced students count
    const unplacedStudents = queries.getUnplacedStudentsCount.get() as { count: number } | undefined;

    // Get application status breakdown
    const statusBreakdown = queries.getApplicationStatusBreakdown.all() as { status: string; count: number }[];

    // Get open positions count
    const openPositions = queries.getOpenPositionsCount.get() as { count: number } | undefined;

    // Get average feedback rating
    const avgRatingResult = queries.getAverageFeedbackRating.get() as { average_rating: number; total_feedback: number } | undefined;

    // Get recent applications
    const recentApplications = queries.getRecentApplications.all(5) as any[];

    // Get top internships
    const topInternships = queries.getTopInternships.all(5) as any[];

    // Get department-wise placement statistics
    const departmentStatsQuery = db.prepare(`
      SELECT 
        u.department,
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT CASE WHEN a.status IN ('OFFERED', 'COMPLETED') THEN u.id END) as placed_students,
        COUNT(DISTINCT CASE WHEN a.status IN ('INTERVIEWED', 'INTERVIEW_SCHEDULED') THEN u.id END) as interviewing_students,
        COUNT(DISTINCT CASE WHEN a.id IS NULL OR a.status NOT IN ('OFFERED', 'COMPLETED', 'INTERVIEWED', 'INTERVIEW_SCHEDULED') THEN u.id END) as unplaced_students
      FROM users u
      LEFT JOIN applications a ON u.id = a.student_id
      WHERE u.role = 'STUDENT' AND u.department IS NOT NULL
      GROUP BY u.department
      ORDER BY placed_students DESC
    `);

    const departmentStats = departmentStatsQuery.all() as Array<{
      department: string;
      total_students: number;
      placed_students: number;
      interviewing_students: number;
      unplaced_students: number;
    }>;

    // Calculate placement percentages
    const departmentStatsWithPercentages = departmentStats.map(dept => ({
      ...dept,
      placement_percentage: dept.total_students > 0 ? Math.round((dept.placed_students / dept.total_students) * 10000) / 100 : 0,
      interviewing_percentage: dept.total_students > 0 ? Math.round((dept.interviewing_students / dept.total_students) * 10000) / 100 : 0,
      unplaced_percentage: dept.total_students > 0 ? Math.round((dept.unplaced_students / dept.total_students) * 10000) / 100 : 0
    }));

    // Get application trends (last 30 days)
    const applicationTrendsQuery = db.prepare(`
      SELECT 
        DATE(applied_at) as date,
        COUNT(*) as application_count
      FROM applications
      WHERE applied_at >= DATE('now', '-30 days')
      GROUP BY DATE(applied_at)
      ORDER BY date
    `);

    const applicationTrends = applicationTrendsQuery.all() as Array<{
      date: string;
      application_count: number;
    }>;

    const analytics = {
      summary: {
        unplaced_students: unplacedStudents?.count || 0,
        open_positions: openPositions?.count || 0,
        total_applications: statusBreakdown.reduce((sum: number, item: any) => sum + item.count, 0),
        average_rating: avgRatingResult?.average_rating ? Math.round(avgRatingResult.average_rating * 100) / 100 : 0,
        total_feedback: avgRatingResult?.total_feedback || 0
      },
      status_breakdown: statusBreakdown,
      recent_applications: recentApplications,
      top_internships: topInternships,
      department_stats: departmentStatsWithPercentages,
      application_trends: applicationTrends
    };

    return ApiResponse.success(analytics);

  } catch (error) {
    console.error('Get analytics error:', error);
    return ApiResponse.serverError('Failed to get analytics');
  }
}, ['STAFF']);