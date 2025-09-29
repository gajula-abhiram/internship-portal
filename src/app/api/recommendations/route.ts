import { NextRequest } from 'next/server';
import { getDbQueries } from '@/lib/database';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';
import { RecommendationEngine } from '@/lib/recommendation-engine';

/**
 * GET /api/recommendations
 * Get personalized internship recommendations for a student
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (user.role !== 'STUDENT') {
      return ApiResponse.forbidden('Only students can access recommendations');
    }
    
    const queries = getDbQueries();
    if (!queries) {
      return ApiResponse.serverError('Database connection failed');
    }
    
    // Get student profile
    const student = queries.getUserById.get(user.id) as any;
    if (!student) {
      return ApiResponse.notFound('Student profile not found');
    }
    
    // Parse student skills
    let studentSkills = [];
    try {
      studentSkills = student.skills ? JSON.parse(student.skills) : [];
    } catch (e) {
      studentSkills = [];
    }
    
    // Get available internships
    const internships = queries.getActiveInternships.all().map((internship: any) => ({
      ...internship,
      required_skills: JSON.parse(internship.required_skills),
      eligible_departments: JSON.parse(internship.eligible_departments)
    }));
    
    // Prepare student data for recommendation engine
    const studentData = {
      id: student.id,
      skills: studentSkills,
      department: student.department,
      current_semester: student.current_semester || 1,
      preferences: {
        work_type: 'both' as const,
        stipend_min: 0
      }
    };
    
    // Get recommendations
    const recommendations = RecommendationEngine.getRecommendations(
      studentData, 
      internships, 
      limit
    );
    
    // Enrich recommendations with internship details
    const enrichedRecommendations = recommendations.map(rec => {
      const internship = internships.find((i: any) => i.id === rec.internship_id);
      return {
        ...rec,
        internship: internship
      };
    });
    
    // Get trending skills analysis
    const trendingSkills = RecommendationEngine.getTrendingSkills(internships);
    
    return ApiResponse.success({
      recommendations: enrichedRecommendations,
      trending_skills: trendingSkills.slice(0, 10),
      total_available: internships.length,
      student_profile: {
        department: student.department,
        semester: student.current_semester,
        skills_count: studentSkills.length
      }
    });
    
  } catch (error) {
    console.error('Recommendations error:', error);
    return ApiResponse.serverError('Failed to get recommendations');
  }
}, ['STUDENT']);

/**
 * Note: Skills gap analysis is implemented as a separate route
 * at /api/recommendations/skills-gap/[id]/route.ts
 */