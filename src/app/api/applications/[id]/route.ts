import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';

export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const user = req.user!;
    const { id } = await context.params;
    const applicationId = parseInt(id);

    if (isNaN(applicationId)) {
      return ApiResponse.error('Invalid application ID', 400);
    }

    const db = getDatabase();
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Get the specific application with detailed information
    let applicationQuery;
    
    if (user.role === 'STUDENT') {
      // Students can only see their own applications
      applicationQuery = db.prepare(`
        SELECT a.*, i.title as internship_title, i.description as internship_description,
               u.name as student_name, u.department as student_department, u.email as student_email,
               u.skills as student_skills, m.name as mentor_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        LEFT JOIN users m ON a.mentor_id = m.id
        WHERE a.id = ? AND a.student_id = ?
      `);
    } else if (user.role === 'STAFF') {
      // Staff can see all applications
      applicationQuery = db.prepare(`
        SELECT a.*, i.title as internship_title, i.description as internship_description,
               u.name as student_name, u.department as student_department, u.email as student_email,
               u.skills as student_skills, m.name as mentor_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        LEFT JOIN users m ON a.mentor_id = m.id
        WHERE a.id = ?
      `);
    } else if (user.role === 'MENTOR') {
      // Mentors can see applications from their department
      applicationQuery = db.prepare(`
        SELECT a.*, i.title as internship_title, i.description as internship_description,
               u.name as student_name, u.department as student_department, u.email as student_email,
               u.skills as student_skills, m.name as mentor_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        LEFT JOIN users m ON a.mentor_id = m.id
        WHERE a.id = ? AND u.department = ?
      `);
    } else if (user.role === 'EMPLOYER') {
      // Employers can see applications for their posted internships
      applicationQuery = db.prepare(`
        SELECT a.*, i.title as internship_title, i.description as internship_description,
               u.name as student_name, u.department as student_department, u.email as student_email,
               u.skills as student_skills, m.name as mentor_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        LEFT JOIN users m ON a.mentor_id = m.id
        WHERE a.id = ?
      `);
    }

    let application;
    if (applicationQuery) {
      if (user.role === 'STUDENT') {
        application = applicationQuery.get(applicationId, user.id);
      } else if (user.role === 'MENTOR') {
        application = applicationQuery.get(applicationId, user.department);
      } else {
        application = applicationQuery.get(applicationId);
      }
    }

    if (!application) {
      return ApiResponse.notFound('Application not found');
    }

    // Get feedback for this application
    const feedbackQuery = db.prepare(`
      SELECT f.*, u.name as supervisor_name
      FROM feedback f
      JOIN users u ON f.supervisor_id = u.id
      WHERE f.application_id = ?
      ORDER BY f.created_at DESC
    `);
    
    const feedback = feedbackQuery.all(applicationId) || [];

    // Get application tracking steps
    const trackingQuery = db.prepare(`
      SELECT *
      FROM application_tracking
      WHERE application_id = ?
      ORDER BY created_at ASC
    `);
    
    const trackingSteps = trackingQuery.all(applicationId) || [];

    // Get interview schedules if any
    const interviewQuery = db.prepare(`
      SELECT *
      FROM interview_schedules
      WHERE application_id = ?
      ORDER BY scheduled_datetime ASC
    `);
    
    const interviews = interviewQuery.all(applicationId) || [];

    // Get placement offers if any
    const offerQuery = db.prepare(`
      SELECT *
      FROM placement_offers
      WHERE application_id = ?
    `);
    
    const offers = offerQuery.all(applicationId) || [];

    // Parse JSON fields
    const applicationWithDetails = {
      ...application,
      student_skills: application && (application as any).student_skills ? JSON.parse((application as any).student_skills) : [],
      feedback: feedback,
      tracking_steps: trackingSteps,
      interviews: interviews,
      offers: offers
    };

    return ApiResponse.success(applicationWithDetails);

  } catch (error) {
    console.error('Error fetching application details:', error);
    return ApiResponse.serverError('Failed to fetch application details');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);