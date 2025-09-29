// Chat Service for Mentor-Applicant Communication
// Implements "in-app chat between mentors and applicants to resolve queries"

import { getDatabase } from './database';
import { NotificationService } from './notification-system';

export interface ChatRoom {
  id: number;
  application_id: number;
  student_id: number;
  mentor_id: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender_name: string;
  sender_role: string;
}

export class ChatService {
  
  /**
   * Create a chat room for an application
   */
  static async createChatRoom(applicationId: number, studentId: number, mentorId: number): Promise<ChatRoom> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Create chat_rooms table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL,
          student_id INTEGER NOT NULL,
          mentor_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (application_id) REFERENCES applications(id),
          FOREIGN KEY (student_id) REFERENCES users(id),
          FOREIGN KEY (mentor_id) REFERENCES users(id),
          UNIQUE(application_id)
        )
      `);
      
      // Check if chat room already exists
      const existingRoomQuery = db.prepare(`
        SELECT * FROM chat_rooms WHERE application_id = ?
      `);
      
      const existingRoom = existingRoomQuery.get(applicationId) as ChatRoom | undefined;
      
      if (existingRoom) {
        return existingRoom;
      }
      
      // Create new chat room
      const insert = db.prepare(`
        INSERT INTO chat_rooms (application_id, student_id, mentor_id)
        VALUES (?, ?, ?)
      `);
      
      const result = insert.run(applicationId, studentId, mentorId);
      
      // Create chat_messages table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_room_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id),
          FOREIGN KEY (sender_id) REFERENCES users(id)
        )
      `);
      
      const newRoom: ChatRoom = {
        id: result.lastInsertRowid as number,
        application_id: applicationId,
        student_id: studentId,
        mentor_id: mentorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newRoom;
      
    } catch (error) {
      console.error('Failed to create chat room:', error);
      throw error;
    }
  }
  
  /**
   * Send a message in a chat room
   */
  static async sendMessage(chatRoomId: number, senderId: number, message: string): Promise<ChatMessage> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Insert message
      const insert = db.prepare(`
        INSERT INTO chat_messages (chat_room_id, sender_id, message)
        VALUES (?, ?, ?)
      `);
      
      const result = insert.run(chatRoomId, senderId, message);
      
      // Update chat room updated_at timestamp
      const updateRoom = db.prepare(`
        UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `);
      
      updateRoom.run(chatRoomId);
      
      const newMessage: ChatMessage = {
        id: result.lastInsertRowid as number,
        chat_room_id: chatRoomId,
        sender_id: senderId,
        message: message,
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      // Notify recipient about new message
      await this.notifyNewMessage(chatRoomId, senderId, message);
      
      return newMessage;
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }
  
  /**
   * Get chat room by application ID
   */
  static async getChatRoomByApplication(applicationId: number): Promise<ChatRoom | null> {
    try {
      const db = getDatabase();
      if (!db) {
        return null;
      }
      
      const query = db.prepare(`
        SELECT * FROM chat_rooms WHERE application_id = ?
      `);
      
      const room = query.get(applicationId) as ChatRoom | undefined;
      
      return room || null;
      
    } catch (error) {
      console.error('Failed to get chat room:', error);
      return null;
    }
  }
  
  /**
   * Get messages for a chat room
   */
  static async getMessages(chatRoomId: number): Promise<ChatMessageWithSender[]> {
    try {
      const db = getDatabase();
      if (!db) {
        return [];
      }
      
      const query = db.prepare(`
        SELECT 
          cm.*,
          u.name as sender_name,
          u.role as sender_role
        FROM chat_messages cm
        JOIN users u ON cm.sender_id = u.id
        WHERE cm.chat_room_id = ?
        ORDER BY cm.created_at ASC
      `);
      
      const messages = query.all(chatRoomId) as ChatMessageWithSender[];
      
      return messages;
      
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }
  
  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(chatRoomId: number, userId: number): Promise<void> {
    try {
      const db = getDatabase();
      if (!db) {
        return;
      }
      
      const update = db.prepare(`
        UPDATE chat_messages 
        SET is_read = 1 
        WHERE chat_room_id = ? AND sender_id != ?
      `);
      
      update.run(chatRoomId, userId);
      
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }
  
  /**
   * Get unread message count for a user
   */
  static async getUnreadMessageCount(userId: number): Promise<number> {
    try {
      const db = getDatabase();
      if (!db) {
        return 0;
      }
      
      // For students, count unread messages in rooms where they are the student
      // For mentors, count unread messages in rooms where they are the mentor
      const query = db.prepare(`
        SELECT COUNT(*) as count
        FROM chat_messages cm
        JOIN chat_rooms cr ON cm.chat_room_id = cr.id
        WHERE cm.is_read = 0 
        AND cm.sender_id != ?
        AND (cr.student_id = ? OR cr.mentor_id = ?)
      `);
      
      const result = query.get(userId, userId, userId) as { count: number };
      
      return result.count;
      
    } catch (error) {
      console.error('Failed to get unread message count:', error);
      return 0;
    }
  }
  
  /**
   * Get chat rooms for a user with latest message preview
   */
  static async getUserChatRooms(userId: number): Promise<Array<{
    room: ChatRoom;
    latest_message: ChatMessageWithSender | null;
    unread_count: number;
  }>> {
    try {
      const db = getDatabase();
      if (!db) {
        return [];
      }
      
      const query = db.prepare(`
        SELECT 
          cr.*,
          cm.message as latest_message_text,
          cm.created_at as latest_message_time,
          cm.sender_id as latest_message_sender_id,
          u.name as latest_message_sender_name,
          u.role as latest_message_sender_role,
          (SELECT COUNT(*) FROM chat_messages cm2 
           WHERE cm2.chat_room_id = cr.id 
           AND cm2.is_read = 0 
           AND cm2.sender_id != ?) as unread_count
        FROM chat_rooms cr
        LEFT JOIN chat_messages cm ON cm.id = (
          SELECT id FROM chat_messages cm2 
          WHERE cm2.chat_room_id = cr.id 
          ORDER BY cm2.created_at DESC 
          LIMIT 1
        )
        LEFT JOIN users u ON cm.sender_id = u.id
        WHERE cr.student_id = ? OR cr.mentor_id = ?
        ORDER BY cm.created_at DESC
      `);
      
      const rooms = query.all(userId, userId, userId) as Array<{
        id: number;
        application_id: number;
        student_id: number;
        mentor_id: number;
        created_at: string;
        updated_at: string;
        latest_message_text: string | null;
        latest_message_time: string | null;
        latest_message_sender_id: number | null;
        latest_message_sender_name: string | null;
        latest_message_sender_role: string | null;
        unread_count: number;
      }>;
      
      return rooms.map(room => ({
        room: {
          id: room.id,
          application_id: room.application_id,
          student_id: room.student_id,
          mentor_id: room.mentor_id,
          created_at: room.created_at,
          updated_at: room.updated_at
        },
        latest_message: room.latest_message_text ? {
          id: 0, // This is just a preview, not a real message ID
          chat_room_id: room.id,
          sender_id: room.latest_message_sender_id || 0,
          message: room.latest_message_text,
          is_read: false,
          created_at: room.latest_message_time || '',
          sender_name: room.latest_message_sender_name || '',
          sender_role: room.latest_message_sender_role || ''
        } : null,
        unread_count: room.unread_count
      }));
      
    } catch (error) {
      console.error('Failed to get user chat rooms:', error);
      return [];
    }
  }
  
  /**
   * Notify recipient about new message
   */
  private static async notifyNewMessage(chatRoomId: number, senderId: number, message: string): Promise<void> {
    try {
      const db = getDatabase();
      if (!db) {
        return;
      }
      
      // Get chat room details
      const roomQuery = db.prepare(`
        SELECT cr.*, u1.name as student_name, u2.name as mentor_name
        FROM chat_rooms cr
        JOIN users u1 ON cr.student_id = u1.id
        JOIN users u2 ON cr.mentor_id = u2.id
        WHERE cr.id = ?
      `);
      
      const room = roomQuery.get(chatRoomId) as any;
      if (!room) {
        return;
      }
      
      // Determine recipient
      let recipientId: number;
      let recipientRole: 'STUDENT' | 'MENTOR';
      let recipientName: string;
      
      if (senderId === room.student_id) {
        recipientId = room.mentor_id;
        recipientRole = 'MENTOR';
        recipientName = room.mentor_name;
      } else {
        recipientId = room.student_id;
        recipientRole = 'STUDENT';
        recipientName = room.student_name;
      }
      
      // Get application details for context
      const appQuery = db.prepare(`
        SELECT i.title as internship_title
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE a.id = ?
      `);
      
      const app = appQuery.get(room.application_id) as any;
      
      // Send notification
      await NotificationService.notifyNewMessage(
        recipientId,
        recipientRole,
        app?.internship_title || 'internship',
        message
      );
      
    } catch (error) {
      console.error('Failed to notify new message:', error);
    }
  }
}