import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/middleware';
import { CrossDepartmentNotificationService } from '@/lib/cross-department-notifications';

/**
 * GET /api/notifications/cross-department
 * Get cross-department internship opportunities for a student
 */
export async function GET(req: NextRequest) {
  try {
    // Extract user ID from query parameters or authentication
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return ApiResponse.error('User ID is required', 400);
    }
    
    // In a real implementation, you would get the user's department from the database
    // For now, we'll mock this
    const userDepartment = 'Computer Science'; // This would come from the database
    
    const opportunities = await CrossDepartmentNotificationService.getCrossDepartmentInternships(
      parseInt(userId), 
      userDepartment
    );
    
    return ApiResponse.success({ 
      opportunities,
      count: opportunities.length
    });
    
  } catch (error) {
    console.error('Get cross-department opportunities error:', error);
    return ApiResponse.serverError('Failed to get cross-department opportunities');
  }
}