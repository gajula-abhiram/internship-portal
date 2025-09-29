// Notification Scheduler for Automated Reminders
// Implements "email/push alerts for deadlines, interviews, approvals, and feedback"

import { getDatabase } from './database';
import { NotificationService } from './notification-system';
import { EmailService } from './email-service';
import { CrossDepartmentNotificationService } from './cross-department-notifications';

export interface ScheduledNotification {
  id?: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  scheduled_for: string; // ISO date string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  sent_at?: string;
  created_at?: string;
}

export class NotificationScheduler {
  
  /**
   * Schedule a notification for future delivery
   */
  static async scheduleNotification(notification: ScheduledNotification): Promise<ScheduledNotification> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Create notifications table if it doesn't exist with new columns
      db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('APPLICATION', 'APPROVAL', 'INTERVIEW', 'OFFER', 'BADGE', 'GENERAL', 'DEADLINE', 'FEEDBACK', 'REMINDER', 'CROSS_DEPARTMENT')),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data TEXT, -- JSON with additional data
          is_read BOOLEAN DEFAULT 0,
          priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
          scheduled_for DATETIME, -- For scheduled notifications
          sent_at DATETIME, -- When notification was actually sent
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      
      const insert = db.prepare(`
        INSERT INTO notifications (
          user_id, type, title, message, data, priority, scheduled_for
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insert.run(
        notification.user_id,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data),
        notification.priority,
        notification.scheduled_for
      );
      
      return {
        ...notification,
        id: result.lastInsertRowid as number,
        created_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }
  
  /**
   * Process due notifications
   */
  static async processDueNotifications(): Promise<{ processed: number; failed: number }> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Get notifications that are due to be sent
      const dueNotificationsQuery = db.prepare(`
        SELECT * FROM notifications 
        WHERE scheduled_for <= datetime('now') 
        AND sent_at IS NULL
        ORDER BY priority DESC, scheduled_for ASC
      `);
      
      const dueNotifications = dueNotificationsQuery.all() as any[];
      
      let processed = 0;
      let failed = 0;
      
      for (const notification of dueNotifications) {
        try {
          // Parse data if it exists
          const data = notification.data ? JSON.parse(notification.data) : {};
          
          // Send the notification
          await NotificationService.sendNotification({
            recipient_id: notification.user_id,
            recipient_role: data.user_role || 'STUDENT', // Default to STUDENT if not specified
            type: notification.type as any,
            title: notification.title,
            message: notification.message,
            data: data,
            action_url: data.action_url
          });
          
          // Mark as sent
          const update = db.prepare(`
            UPDATE notifications 
            SET sent_at = datetime('now') 
            WHERE id = ?
          `);
          
          update.run(notification.id);
          processed++;
          
        } catch (error) {
          console.error(`Failed to process notification ${notification.id}:`, error);
          failed++;
        }
      }
      
      console.log(`Processed ${processed} notifications, ${failed} failed`);
      return { processed, failed };
      
    } catch (error) {
      console.error('Failed to process due notifications:', error);
      throw error;
    }
  }
  
  /**
   * Schedule deadline reminders
   */
  static async scheduleDeadlineReminders(): Promise<void> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Get upcoming internship deadlines (1 day and 1 week from now)
      const upcomingDeadlinesQuery = db.prepare(`
        SELECT 
          i.id,
          i.title,
          i.company_name,
          i.application_deadline,
          a.student_id,
          u.email,
          u.role as user_role
        FROM internships i
        JOIN applications a ON i.id = a.internship_id
        JOIN users u ON a.student_id = u.id
        WHERE i.application_deadline > datetime('now')
        AND i.application_deadline <= datetime('now', '+7 days')
        AND a.status IN ('APPLIED', 'MENTOR_APPROVED', 'MENTOR_REJECTED')
      `);
      
      const upcomingDeadlines = upcomingDeadlinesQuery.all() as any[];
      
      for (const deadline of upcomingDeadlines) {
        const deadlineDate = new Date(deadline.application_deadline);
        const now = new Date();
        const timeDiff = deadlineDate.getTime() - now.getTime();
        const daysUntilDeadline = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Only schedule if it's 1 day or 1 week before deadline
        if (daysUntilDeadline === 1 || daysUntilDeadline === 7) {
          // Check if notification already exists
          const existingNotificationQuery = db.prepare(`
            SELECT id FROM notifications 
            WHERE user_id = ? 
            AND type = 'DEADLINE' 
            AND data LIKE ? 
            AND sent_at IS NULL
          `);
          
          const existingNotification = existingNotificationQuery.get(
            deadline.student_id,
            `%${deadline.id}%`
          );
          
          if (!existingNotification) {
            const scheduledTime = new Date(deadlineDate);
            scheduledTime.setDate(scheduledTime.getDate() - (daysUntilDeadline === 1 ? 1 : 7));
            
            await this.scheduleNotification({
              user_id: deadline.student_id,
              type: 'DEADLINE',
              title: `Application Deadline ${daysUntilDeadline === 1 ? 'Tomorrow' : 'In One Week'}`,
              message: `The application deadline for "${deadline.title}" at ${deadline.company_name} is ${daysUntilDeadline === 1 ? 'tomorrow' : 'in one week'}.`,
              data: {
                internship_id: deadline.id,
                internship_title: deadline.title,
                company_name: deadline.company_name,
                deadline: deadline.application_deadline,
                user_role: deadline.user_role
              },
              scheduled_for: scheduledTime.toISOString(),
              priority: daysUntilDeadline === 1 ? 'HIGH' : 'NORMAL'
            });
          }
        }
      }
      
      console.log(`Scheduled ${upcomingDeadlines.length} deadline reminders`);
      
    } catch (error) {
      console.error('Failed to schedule deadline reminders:', error);
      throw error;
    }
  }
  
  /**
   * Schedule interview reminders
   */
  static async scheduleInterviewReminders(): Promise<void> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Get upcoming interviews (1 day and 1 hour before)
      const upcomingInterviewsQuery = db.prepare(`
        SELECT 
          i.id,
          i.title as internship_title,
          i.company_name,
          isch.scheduled_datetime,
          isch.student_id,
          isch.interviewer_id,
          s.email as student_email,
          s.role as student_role,
          emp.email as employer_email,
          emp.role as employer_role
        FROM interview_schedules isch
        JOIN applications a ON isch.application_id = a.id
        JOIN internships i ON a.internship_id = i.id
        JOIN users s ON isch.student_id = s.id
        JOIN users emp ON isch.interviewer_id = emp.id
        WHERE isch.scheduled_datetime > datetime('now')
        AND isch.scheduled_datetime <= datetime('now', '+1 day')
        AND isch.status = 'SCHEDULED'
      `);
      
      const upcomingInterviews = upcomingInterviewsQuery.all() as any[];
      
      for (const interview of upcomingInterviews) {
        const interviewDate = new Date(interview.scheduled_datetime);
        const now = new Date();
        const timeDiff = interviewDate.getTime() - now.getTime();
        const hoursUntilInterview = Math.ceil(timeDiff / (1000 * 3600));
        
        // Schedule reminders for 1 day and 1 hour before
        if (hoursUntilInterview === 1 || hoursUntilInterview === 24) {
          // Schedule for student
          const existingStudentNotificationQuery = db.prepare(`
            SELECT id FROM notifications 
            WHERE user_id = ? 
            AND type = 'INTERVIEW' 
            AND data LIKE ? 
            AND sent_at IS NULL
          `);
          
          const existingStudentNotification = existingStudentNotificationQuery.get(
            interview.student_id,
            `%${interview.id}%`
          );
          
          if (!existingStudentNotification) {
            const scheduledTime = new Date(interviewDate);
            scheduledTime.setHours(scheduledTime.getHours() - (hoursUntilInterview === 1 ? 1 : 24));
            
            await this.scheduleNotification({
              user_id: interview.student_id,
              type: 'INTERVIEW',
              title: `Interview ${hoursUntilInterview === 1 ? 'In One Hour' : 'Tomorrow'}`,
              message: `Your interview for "${interview.internship_title}" at ${interview.company_name} is ${hoursUntilInterview === 1 ? 'in one hour' : 'tomorrow'}.`,
              data: {
                interview_id: interview.id,
                internship_title: interview.internship_title,
                company_name: interview.company_name,
                scheduled_datetime: interview.scheduled_datetime,
                user_role: interview.student_role
              },
              scheduled_for: scheduledTime.toISOString(),
              priority: hoursUntilInterview === 1 ? 'HIGH' : 'NORMAL'
            });
          }
          
          // Schedule for interviewer
          const existingEmployerNotificationQuery = db.prepare(`
            SELECT id FROM notifications 
            WHERE user_id = ? 
            AND type = 'INTERVIEW' 
            AND data LIKE ? 
            AND sent_at IS NULL
          `);
          
          const existingEmployerNotification = existingEmployerNotificationQuery.get(
            interview.interviewer_id,
            `%${interview.id}%`
          );
          
          if (!existingEmployerNotification) {
            const scheduledTime = new Date(interviewDate);
            scheduledTime.setHours(scheduledTime.getHours() - (hoursUntilInterview === 1 ? 1 : 24));
            
            await this.scheduleNotification({
              user_id: interview.interviewer_id,
              type: 'INTERVIEW',
              title: `Interview ${hoursUntilInterview === 1 ? 'In One Hour' : 'Tomorrow'}`,
              message: `Your interview with the candidate for "${interview.internship_title}" is ${hoursUntilInterview === 1 ? 'in one hour' : 'tomorrow'}.`,
              data: {
                interview_id: interview.id,
                internship_title: interview.internship_title,
                company_name: interview.company_name,
                scheduled_datetime: interview.scheduled_datetime,
                user_role: interview.employer_role
              },
              scheduled_for: scheduledTime.toISOString(),
              priority: hoursUntilInterview === 1 ? 'HIGH' : 'NORMAL'
            });
          }
        }
      }
      
      console.log(`Scheduled ${upcomingInterviews.length} interview reminders`);
      
    } catch (error) {
      console.error('Failed to schedule interview reminders:', error);
      throw error;
    }
  }
  
  /**
   * Schedule approval reminders for mentors
   */
  static async scheduleApprovalReminders(): Promise<void> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Get pending approvals that are older than 24 hours
      const pendingApprovalsQuery = db.prepare(`
        SELECT 
          a.id,
          a.student_id,
          i.title as internship_title,
          i.company_name,
          a.applied_at,
          u.department,
          m.id as mentor_id,
          m.email as mentor_email
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        JOIN users m ON u.department = m.department AND m.role = 'MENTOR'
        WHERE a.status = 'APPLIED'
        AND a.applied_at <= datetime('now', '-1 day')
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.user_id = m.id 
          AND n.type = 'APPROVAL' 
          AND n.data LIKE '%' || a.id || '%'
          AND n.sent_at IS NULL
        )
      `);
      
      const pendingApprovals = pendingApprovalsQuery.all() as any[];
      
      for (const approval of pendingApprovals) {
        await this.scheduleNotification({
          user_id: approval.mentor_id,
          type: 'APPROVAL',
          title: 'Pending Application Approval',
          message: `You have a pending application for "${approval.internship_title}" at ${approval.company_name} that requires your review.`,
          data: {
            application_id: approval.id,
            internship_title: approval.internship_title,
            company_name: approval.company_name,
            student_id: approval.student_id,
            applied_at: approval.applied_at
          },
          scheduled_for: new Date().toISOString(),
          priority: 'NORMAL'
        });
      }
      
      console.log(`Scheduled ${pendingApprovals.length} approval reminders`);
      
    } catch (error) {
      console.error('Failed to schedule approval reminders:', error);
      throw error;
    }
  }
  
  /**
   * Schedule feedback reminders for supervisors
   */
  static async scheduleFeedbackReminders(): Promise<void> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Get completed internships without feedback (older than 3 days)
      const completedInternshipsQuery = db.prepare(`
        SELECT 
          a.id as application_id,
          a.student_id,
          i.title as internship_title,
          i.company_name,
          a.completion_date,
          u.email as student_email,
          emp.id as employer_id,
          emp.email as employer_email
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        JOIN users emp ON i.posted_by = emp.id
        WHERE a.status = 'COMPLETED'
        AND a.completion_date <= datetime('now', '-3 days')
        AND NOT EXISTS (
          SELECT 1 FROM feedback f 
          WHERE f.application_id = a.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.user_id = emp.id 
          AND n.type = 'FEEDBACK' 
          AND n.data LIKE '%' || a.id || '%'
          AND n.sent_at IS NULL
        )
      `);
      
      const completedInternships = completedInternshipsQuery.all() as any[];
      
      for (const internship of completedInternships) {
        await this.scheduleNotification({
          user_id: internship.employer_id,
          type: 'FEEDBACK',
          title: 'Feedback Request',
          message: `Please provide feedback for ${internship.student_name} who completed the internship "${internship.internship_title}".`,
          data: {
            application_id: internship.application_id,
            internship_title: internship.internship_title,
            company_name: internship.company_name,
            student_id: internship.student_id,
            completion_date: internship.completion_date
          },
          scheduled_for: new Date().toISOString(),
          priority: 'NORMAL'
        });
      }
      
      console.log(`Scheduled ${completedInternships.length} feedback reminders`);
      
    } catch (error) {
      console.error('Failed to schedule feedback reminders:', error);
      throw error;
    }
  }
  
  /**
   * Schedule cross-department internship notifications
   */
  static async scheduleCrossDepartmentNotifications(): Promise<void> {
    try {
      console.log('🔍 Scheduling cross-department internship notifications');
      
      // Use the cross-department notification service to check and notify students
      await CrossDepartmentNotificationService.notifyCrossDepartmentInternships();
      
      console.log('✅ Cross-department notifications scheduled');
    } catch (error) {
      console.error('Failed to schedule cross-department notifications:', error);
      throw error;
    }
  }
  
  /**
   * Process all scheduled notifications
   */
  static async processAllScheduledNotifications(): Promise<void> {
    try {
      // Process due notifications
      await this.processDueNotifications();
      
      // Schedule new notifications
      await this.scheduleDeadlineReminders();
      await this.scheduleInterviewReminders();
      await this.scheduleApprovalReminders();
      await this.scheduleFeedbackReminders();
      await this.scheduleCrossDepartmentNotifications();
      
      console.log('All scheduled notifications processed');
    } catch (error) {
      console.error('Failed to process all scheduled notifications:', error);
      throw error;
    }
  }
}