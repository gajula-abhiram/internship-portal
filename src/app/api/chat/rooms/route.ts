import { NextRequest } from 'next/server';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';
import { ChatService } from '@/lib/chat-service';

/**
 * GET /api/chat/rooms
 * Get all chat rooms for the authenticated user
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    
    // Get chat rooms for the user
    const chatRooms = await ChatService.getUserChatRooms(user.id);

    return ApiResponse.success({
      chat_rooms: chatRooms
    });

  } catch (error) {
    console.error('Get chat rooms error:', error);
    return ApiResponse.serverError('Failed to get chat rooms');
  }
}, ['STUDENT', 'MENTOR']);