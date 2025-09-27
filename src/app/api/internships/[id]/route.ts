import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/database';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/internships/[id]
 * Get specific internship by ID
 */
export const GET = withAuth(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const db = getDatabase();
    const internshipId = parseInt(params.id);

    if (isNaN(internshipId)) {
      return ApiResponse.error('Invalid internship ID');
    }

    // Get internship with poster information
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }
    const internship = db.prepare(`
      SELECT i.*, u.name as posted_by_name 
      FROM internships i 
      JOIN users u ON i.posted_by = u.id 
      WHERE i.id = ? AND i.is_active = 1
    `).get(internshipId) as {
      id: number;
      title: string;
      description: string;
      required_skills: string;
      eligible_departments: string;
      stipend_min: number;
      stipend_max: number;
      is_placement: number;
      posted_by_name: string;
      created_at: string;
    } | undefined;

    if (!internship) {
      return ApiResponse.error('Internship not found', 404);
    }

    // Parse JSON fields
    const internshipData = {
      ...internship,
      required_skills: JSON.parse(internship.required_skills),
      eligible_departments: JSON.parse(internship.eligible_departments),
    };

    return ApiResponse.success(internshipData);

  } catch (error) {
    console.error('Get internship error:', error);
    return ApiResponse.serverError('Failed to get internship');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);

/**
 * PUT /api/internships/[id]
 * Update internship (staff only)
 */
export const PUT = withAuth(async (req: AuthenticatedRequest, context: { params: { id: string } }) => {
  try {
    const body = await req.json();
    const { title, description, required_skills, eligible_departments, stipend_min, stipend_max, is_placement, is_active } = body;
    const user = req.user!;
    const { id } = await context.params;
    const internshipId = parseInt(id);

    if (isNaN(internshipId)) {
      return ApiResponse.error('Invalid internship ID');
    }

    const db = getDatabase();
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Check if internship exists and user owns it
    const existingInternship: any = db.prepare('SELECT * FROM internships WHERE id = ? AND posted_by = ?').get(internshipId, user.id);
    if (!existingInternship) {
      return ApiResponse.notFound('Internship not found or access denied');
    }

    // Update internship
    const updateInternship = db.prepare(`
      UPDATE internships 
      SET title = ?, description = ?, required_skills = ?, eligible_departments = ?, 
          stipend_min = ?, stipend_max = ?, is_placement = ?, is_active = ?
      WHERE id = ?
    `);

    updateInternship.run(
      title || existingInternship.title,
      description || existingInternship.description,
      required_skills ? JSON.stringify(required_skills) : existingInternship.required_skills,
      eligible_departments ? JSON.stringify(eligible_departments) : existingInternship.eligible_departments,
      stipend_min !== undefined ? stipend_min : existingInternship.stipend_min,
      stipend_max !== undefined ? stipend_max : existingInternship.stipend_max,
      is_placement !== undefined ? (is_placement ? 1 : 0) : existingInternship.is_placement,
      is_active !== undefined ? (is_active ? 1 : 0) : existingInternship.is_active,
      internshipId
    );

    // Get updated internship
    const updatedInternship: any = db.prepare(`
      SELECT i.*, u.name as posted_by_name 
      FROM internships i 
      JOIN users u ON i.posted_by = u.id 
      WHERE i.id = ?
    `).get(internshipId);

    const internshipData = {
      ...updatedInternship,
      required_skills: JSON.parse(updatedInternship.required_skills),
      eligible_departments: JSON.parse(updatedInternship.eligible_departments),
    };

    return ApiResponse.success(internshipData);

  } catch (error) {
    console.error('Update internship error:', error);
    return ApiResponse.serverError('Failed to update internship');
  }
}, ['STAFF']);

/**
 * DELETE /api/internships/[id]
 * Delete internship (staff only)
 */
export const DELETE = withAuth(async (req: AuthenticatedRequest, context: { params: { id: string } }) => {
  try {
    const user = req.user!;
    const internshipId = parseInt(context.params.id);

    if (isNaN(internshipId)) {
      return ApiResponse.error('Invalid internship ID');
    }

    const db = getDatabase();
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Check if internship exists and user owns it
    const existingInternship = db.prepare('SELECT * FROM internships WHERE id = ? AND posted_by = ?').get(internshipId, user.id);
    if (!existingInternship) {
      return ApiResponse.notFound('Internship not found or access denied');
    }

    // Soft delete by setting is_active to false
    const deleteInternship = db.prepare('UPDATE internships SET is_active = 0 WHERE id = ?');
    deleteInternship.run(internshipId);

    return ApiResponse.success({ message: 'Internship deleted successfully' });

  } catch (error) {
    console.error('Delete internship error:', error);
    return ApiResponse.serverError('Failed to delete internship');
  }
}, ['STAFF']);