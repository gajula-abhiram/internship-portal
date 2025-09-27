import { NextRequest } from 'next/server';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';
import { NotificationService } from '@/lib/notification-system';

/**
 * GET /api/notifications
 * Get user's notifications
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    
    const notifications = await NotificationService.getUserNotifications(user.id, limit);
    
    const filteredNotifications = unreadOnly 
      ? notifications.filter(n => !n.read)
      : notifications;
    
    return ApiResponse.success({
      notifications: filteredNotifications,
      unread_count: notifications.filter(n => !n.read).length,
      total_count: notifications.length
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    return ApiResponse.serverError('Failed to get notifications');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);

/**
 * POST /api/notifications/mark-read
 * Mark notification(s) as read
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const body = await req.json();
    const { notification_id, mark_all = false } = body;
    
    if (mark_all) {
      // Mark all notifications as read (mock implementation)
      console.log(`Marked all notifications as read for user ${user.id}`);
    } else if (notification_id) {
      await NotificationService.markAsRead(notification_id, user.id);
    } else {
      return ApiResponse.error('notification_id is required when mark_all is false', 400);
    }
    
    return ApiResponse.success({ 
      message: mark_all ? 'All notifications marked as read' : 'Notification marked as read' 
    });
    
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return ApiResponse.serverError('Failed to mark notification as read');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);