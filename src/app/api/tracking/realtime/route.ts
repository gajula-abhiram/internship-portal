import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';

/**
 * GET /api/tracking/realtime
 * Get real-time application tracking data for the current user
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const db = getDatabase();
    
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    let applicationsQuery;
    
    if (user.role === 'STUDENT') {
      // Students see their own applications with tracking data
      applicationsQuery = db.prepare(`
        SELECT 
          a.id,
          a.status,
          a.applied_at,
          i.title as internship_title,
          i.company_name,
          u.name as student_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        WHERE a.student_id = ?
        ORDER BY a.applied_at DESC
      `);
    } else if (user.role === 'STAFF') {
      // Staff see all applications
      applicationsQuery = db.prepare(`
        SELECT 
          a.id,
          a.status,
          a.applied_at,
          i.title as internship_title,
          i.company_name,
          u.name as student_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        ORDER BY a.applied_at DESC
      `);
    } else if (user.role === 'MENTOR') {
      // Mentors see applications from their department
      applicationsQuery = db.prepare(`
        SELECT 
          a.id,
          a.status,
          a.applied_at,
          i.title as internship_title,
          i.company_name,
          u.name as student_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        WHERE u.department = ?
        ORDER BY a.applied_at DESC
      `);
    } else if (user.role === 'EMPLOYER') {
      // Employers see applications for their posted internships
      applicationsQuery = db.prepare(`
        SELECT 
          a.id,
          a.status,
          a.applied_at,
          i.title as internship_title,
          i.company_name,
          u.name as student_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        WHERE i.posted_by = ?
        ORDER BY a.applied_at DESC
      `);
    } else {
      return ApiResponse.forbidden('Access denied');
    }

    let applications;
    if (user.role === 'STUDENT') {
      applications = applicationsQuery.all(user.id);
    } else if (user.role === 'MENTOR') {
      applications = applicationsQuery.all(user.department);
    } else if (user.role === 'EMPLOYER') {
      applications = applicationsQuery.all(user.id);
    } else {
      applications = applicationsQuery.all();
    }

    // Add tracking steps for each application
    const applicationsWithTracking = applications.map((app: any) => {
      // Get tracking steps
      const trackingQuery = db.prepare(`
        SELECT *
        FROM application_tracking
        WHERE application_id = ?
        ORDER BY created_at ASC
      `);
      
      const trackingSteps = trackingQuery.all(app.id);
      
      return {
        ...app,
        tracking_steps: trackingSteps
      };
    });

    return ApiResponse.success({
      applications: applicationsWithTracking,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Real-time tracking error:', error);
    return ApiResponse.serverError('Failed to fetch real-time tracking data');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);