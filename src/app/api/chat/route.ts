import { NextRequest } from 'next/server';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';
import { ChatService } from '@/lib/chat-service';
import { getDatabase } from '@/lib/database';

/**
 * POST /api/chat/messages
 * Send a new message in a chat room
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = req.user!;
    const body = await req.json();
    const { application_id, message } = body;

    // Validate required fields
    if (!application_id || !message) {
      return ApiResponse.error('Application ID and message are required', 400);
    }

    // Get database connection
    const db = getDatabase();
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Verify user has access to this application
    let applicationQuery;
    if (user.role === 'STUDENT') {
      applicationQuery = db.prepare(`
        SELECT a.*, i.title as internship_title
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE a.id = ? AND a.student_id = ?
      `);
    } else if (user.role === 'MENTOR') {
      applicationQuery = db.prepare(`
        SELECT a.*, i.title as internship_title, i.posted_by as employer_id
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        WHERE a.id = ? AND u.department = ?
      `);
    } else {
      return ApiResponse.error('Only students and mentors can participate in chat', 403);
    }

    let application;
    if (user.role === 'STUDENT') {
      application = applicationQuery.get(application_id, user.id);
    } else {
      application = applicationQuery.get(application_id, user.department);
    }

    if (!application) {
      return ApiResponse.notFound('Application not found or access denied');
    }

    // Get or create chat room
    let chatRoom = await ChatService.getChatRoomByApplication(application_id);
    
    if (!chatRoom) {
      // Create chat room
      const mentorId = user.role === 'MENTOR' ? user.id : (application as any).mentor_id;
      const studentId = user.role === 'STUDENT' ? user.id : (application as any).student_id;
      
      chatRoom = await ChatService.createChatRoom(application_id, studentId, mentorId);
    }

    // Verify user is participant in chat room
    if (user.role === 'STUDENT' && chatRoom.student_id !== user.id) {
      return ApiResponse.error('You do not have permission to send messages in this chat', 403);
    }
    
    if (user.role === 'MENTOR' && chatRoom.mentor_id !== user.id) {
      return ApiResponse.error('You do not have permission to send messages in this chat', 403);
    }

    // Send message
    const newMessage = await ChatService.sendMessage(chatRoom.id, user.id, message);

    return ApiResponse.success({
      message: newMessage,
      chat_room_id: chatRoom.id
    }, 201);

  } catch (error) {
    console.error('Send message error:', error);
    return ApiResponse.serverError('Failed to send message');
  }
}, ['STUDENT', 'MENTOR']);

/**
 * GET /api/chat/rooms/[application_id]
 * Get chat room and messages for an application
 */
export const GET = withAuth(async (req: AuthenticatedRequest, context: { params: Promise<{ application_id: string }> }) => {
  try {
    const user = req.user!;
    const { application_id } = await context.params;
    const appId = parseInt(application_id);

    if (isNaN(appId)) {
      return ApiResponse.error('Invalid application ID', 400);
    }

    // Get database connection
    const db = getDatabase();
    if (!db) {
      return ApiResponse.serverError('Database connection failed');
    }

    // Verify user has access to this application
    let applicationQuery;
    if (user.role === 'STUDENT') {
      applicationQuery = db.prepare(`
        SELECT a.*
        FROM applications a
        WHERE a.id = ? AND a.student_id = ?
      `);
    } else if (user.role === 'MENTOR') {
      applicationQuery = db.prepare(`
        SELECT a.*
        FROM applications a
        JOIN users u ON a.student_id = u.id
        WHERE a.id = ? AND u.department = ?
      `);
    } else {
      return ApiResponse.error('Only students and mentors can access chat', 403);
    }

    let application;
    if (user.role === 'STUDENT') {
      application = applicationQuery.get(appId, user.id);
    } else {
      application = applicationQuery.get(appId, user.department);
    }

    if (!application) {
      return ApiResponse.notFound('Application not found or access denied');
    }

    // Get or create chat room
    let chatRoom = await ChatService.getChatRoomByApplication(appId);
    
    if (!chatRoom) {
      // If no chat room exists and user is trying to access it, return empty
      return ApiResponse.success({
        chat_room: null,
        messages: []
      });
    }

    // Verify user is participant in chat room
    if (user.role === 'STUDENT' && chatRoom.student_id !== user.id) {
      return ApiResponse.error('You do not have permission to access this chat', 403);
    }
    
    if (user.role === 'MENTOR' && chatRoom.mentor_id !== user.id) {
      return ApiResponse.error('You do not have permission to access this chat', 403);
    }

    // Get messages
    const messages = await ChatService.getMessages(chatRoom.id);

    // Mark messages as read for this user
    await ChatService.markMessagesAsRead(chatRoom.id, user.id);

    return ApiResponse.success({
      chat_room: chatRoom,
      messages: messages
    });

  } catch (error) {
    console.error('Get chat room error:', error);
    return ApiResponse.serverError('Failed to get chat room');
  }
}, ['STUDENT', 'MENTOR']);