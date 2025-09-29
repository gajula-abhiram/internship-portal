import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/middleware';
import { NotificationScheduler } from '@/lib/notification-scheduler';
import { CrossDepartmentNotificationService } from '@/lib/cross-department-notifications';

/**
 * POST /api/notifications/scheduled/process
 * Process all scheduled notifications
 * This endpoint should be called by a cron job or background task
 */
export async function POST(req: NextRequest) {
  try {
    // In production, you should add authentication/authorization here
    // For example, check for a cron secret or specific API key
    
    // Process all scheduled notifications
    await NotificationScheduler.processAllScheduledNotifications();
    
    return ApiResponse.success({ 
      message: 'Scheduled notifications processed successfully' 
    });
    
  } catch (error) {
    console.error('Process scheduled notifications error:', error);
    return ApiResponse.serverError('Failed to process scheduled notifications');
  }
}

/**
 * GET /api/notifications/scheduled/trigger
 * Trigger scheduled notifications processing
 * This is a convenience endpoint for manual triggering
 */
export async function GET(req: NextRequest) {
  try {
    // In production, you should add authentication/authorization here
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_AUTH_TOKEN;
    
    // Check if this is an authorized request
    if (cronSecret && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
      return ApiResponse.error('Unauthorized', 401);
    }
    
    // Process all scheduled notifications
    const result = await NotificationScheduler.processAllScheduledNotifications();
    
    return ApiResponse.success({ 
      message: 'Scheduled notifications processed successfully',
      result
    });
    
  } catch (error) {
    console.error('Trigger scheduled notifications error:', error);
    return ApiResponse.serverError('Failed to trigger scheduled notifications processing');
  }
}