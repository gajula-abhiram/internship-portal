// Notification System for Internship Portal
// Implements "automated approval requests" and "real-time notifications"

import { EmailService } from './email-service';

export interface NotificationData {
  id?: string;
  recipient_id: number;
  recipient_role: 'STUDENT' | 'STAFF' | 'MENTOR' | 'EMPLOYER';
  type: 'APPLICATION_SUBMITTED' | 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 
        'INTERVIEW_SCHEDULED' | 'OFFER_RECEIVED' | 'FEEDBACK_REQUEST' | 
        'CERTIFICATE_GENERATED' | 'DEADLINE_REMINDER' | 'NEW_INTERNSHIP';
  title: string;
  message: string;
  data?: any;
  created_at?: string;
  read?: boolean;
  action_url?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  template_data?: any;
}

export class NotificationService {
  
  /**
   * Send notification to user(s)
   */
  static async sendNotification(notification: NotificationData): Promise<void> {
    try {
      // In a real implementation, this would:
      // 1. Store notification in database
      // 2. Send email if user preferences allow
      // 3. Send push notification if mobile app exists
      // 4. Send SMS for urgent notifications
      
      console.log('📱 Notification sent:', notification);
      
      // Store in database (mock implementation)
      await this.storeNotificationInDb(notification);
      
      // Send email notification
      if (this.shouldSendEmail(notification.type)) {
        await this.sendEmailNotification(notification);
      }
      
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
  
  /**
   * Send bulk notifications
   */
  static async sendBulkNotifications(notifications: NotificationData[]): Promise<void> {
    for (const notification of notifications) {
      await this.sendNotification(notification);
    }
  }
  
  /**
   * Application workflow notifications
   */
  static async notifyApplicationSubmitted(studentId: number, internshipTitle: string, mentorId?: number): Promise<void> {
    const notifications: NotificationData[] = [];
    
    // Notify student
    notifications.push({
      recipient_id: studentId,
      recipient_role: 'STUDENT',
      type: 'APPLICATION_SUBMITTED',
      title: 'Application Submitted Successfully',
      message: `Your application for "${internshipTitle}" has been submitted and is awaiting mentor approval.`,
      action_url: '/applications'
    });
    
    // Notify mentor if assigned
    if (mentorId) {
      notifications.push({
        recipient_id: mentorId,
        recipient_role: 'MENTOR',
        type: 'APPLICATION_SUBMITTED',
        title: 'New Application for Review',
        message: `A student has applied for "${internshipTitle}" and requires your approval.`,
        action_url: '/applications'
      });
    }
    
    await this.sendBulkNotifications(notifications);
  }
  
  static async notifyApplicationApproved(studentId: number, mentorId: number, internshipTitle: string): Promise<void> {
    await this.sendNotification({
      recipient_id: studentId,
      recipient_role: 'STUDENT',
      type: 'APPLICATION_APPROVED',
      title: 'Application Approved!',
      message: `Great news! Your mentor has approved your application for "${internshipTitle}". Your application is now forwarded to the employer.`,
      action_url: '/applications'
    });
  }
  
  static async notifyApplicationRejected(studentId: number, mentorId: number, internshipTitle: string, reason?: string): Promise<void> {
    const message = `Your application for "${internshipTitle}" was not approved by your mentor.` + 
      (reason ? ` Reason: ${reason}` : ' Please consult with your mentor for guidance.');
    
    await this.sendNotification({
      recipient_id: studentId,
      recipient_role: 'STUDENT',
      type: 'APPLICATION_REJECTED',
      title: 'Application Status Update',
      message,
      action_url: '/applications'
    });
  }
  
  static async notifyInterviewScheduled(studentId: number, internshipTitle: string, interviewDetails: any): Promise<void> {
    await this.sendNotification({
      recipient_id: studentId,
      recipient_role: 'STUDENT',
      type: 'INTERVIEW_SCHEDULED',
      title: 'Interview Scheduled',
      message: `Your interview for "${internshipTitle}" has been scheduled for ${interviewDetails.date} at ${interviewDetails.time}.`,
      data: interviewDetails,
      action_url: '/applications'
    });
  }
  
  static async notifyOfferReceived(studentId: number, internshipTitle: string, offerDetails: any): Promise<void> {
    await this.sendNotification({
      recipient_id: studentId,
      recipient_role: 'STUDENT',
      type: 'OFFER_RECEIVED',
      title: 'Congratulations! Offer Received',
      message: `You have received an offer for "${internshipTitle}". Please review the offer details and respond within the deadline.`,
      data: offerDetails,
      action_url: '/applications'
    });
  }
  
  static async notifyFeedbackRequest(supervisorId: number, studentName: string, internshipTitle: string): Promise<void> {
    await this.sendNotification({
      recipient_id: supervisorId,
      recipient_role: 'EMPLOYER',
      type: 'FEEDBACK_REQUEST',
      title: 'Feedback Required',
      message: `Please provide feedback for ${studentName} who completed the internship "${internshipTitle}".`,
      action_url: '/feedback'
    });
  }
  
  static async notifyCertificateGenerated(studentId: number, internshipTitle: string, certificateUrl: string): Promise<void> {
    await this.sendNotification({
      recipient_id: studentId,
      recipient_role: 'STUDENT',
      type: 'CERTIFICATE_GENERATED',
      title: 'Certificate Ready!',
      message: `Your completion certificate for "${internshipTitle}" is ready for download.`,
      action_url: certificateUrl
    });
  }
  
  static async notifyNewInternship(departmentStudents: number[], internshipTitle: string, company: string): Promise<void> {
    const notifications = departmentStudents.map(studentId => ({
      recipient_id: studentId,
      recipient_role: 'STUDENT' as const,
      type: 'NEW_INTERNSHIP' as const,
      title: 'New Opportunity Available',
      message: `A new internship "${internshipTitle}" at ${company} is now available for your department.`,
      action_url: '/internships'
    }));
    
    await this.sendBulkNotifications(notifications);
  }
  
  static async notifyDeadlineReminder(studentId: number, internshipTitle: string, deadline: string): Promise<void> {
    await this.sendNotification({
      recipient_id: studentId,
      recipient_role: 'STUDENT',
      type: 'DEADLINE_REMINDER',
      title: 'Application Deadline Approaching',
      message: `Reminder: The application deadline for "${internshipTitle}" is ${deadline}. Don't miss out!`,
      action_url: '/internships'
    });
  }
  
  /**
   * Email notification templates
   */
  /**
   * Send email notification using EmailService
   */
  private static async sendEmailNotification(notification: NotificationData): Promise<void> {
    try {
      const templateMap = {
        'APPLICATION_SUBMITTED': 'application_submitted',
        'APPLICATION_APPROVED': 'application_approved', 
        'INTERVIEW_SCHEDULED': 'interview_scheduled',
        'CERTIFICATE_GENERATED': 'certificate_ready'
      };

      const template = templateMap[notification.type as keyof typeof templateMap];
      if (!template) {
        console.log('No email template for notification type:', notification.type);
        return;
      }

      const emailData = {
        to: `user_${notification.recipient_id}@university.edu`, // Would get from user profile
        subject: notification.title,
        template: template,
        templateData: {
          student_name: notification.data?.student_name || 'Student',
          internship_title: notification.data?.internship_title || 'Internship',
          mentor_name: notification.data?.mentor_name || 'Mentor',
          company_name: notification.data?.company_name || 'Company',
          portal_url: process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000',
          ...notification.data
        }
      };

      await EmailService.sendEmail(emailData);
      console.log('📧 Email notification sent:', notification.type);
      
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }
  
  private static generateEmailTemplate(notification: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
          .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Internship Portal</h1>
            <h2>${notification.title}</h2>
          </div>
          <div class="content">
            <p>${notification.message}</p>
            ${notification.action_url ? `<a href="${notification.action_url}" class="button">View Details</a>` : ''}
          </div>
          <div class="footer">
            <p>Rajasthan Technical University - Internship & Placement Portal</p>
            <p><small>This is an automated notification. Please do not reply to this email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  private static shouldSendEmail(type: NotificationData['type']): boolean {
    // Configure which notification types should trigger emails
    const emailTypes: NotificationData['type'][] = [
      'APPLICATION_APPROVED',
      'APPLICATION_REJECTED', 
      'INTERVIEW_SCHEDULED',
      'OFFER_RECEIVED',
      'CERTIFICATE_GENERATED'
    ];
    
    return emailTypes.includes(type);
  }
  
  private static async storeNotificationInDb(notification: NotificationData): Promise<void> {
    // Mock database storage
    console.log('💾 Stored notification in database:', notification.type);
    
    // In production, this would store in the notifications table:
    /*
    const queries = getDbQueries();
    queries.createNotification.run(
      notification.recipient_id,
      notification.type,
      notification.title,
      notification.message,
      JSON.stringify(notification.data),
      notification.action_url
    );
    */
  }
  
  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: number, limit: number = 20): Promise<NotificationData[]> {
    // Mock implementation - would query database in production
    return [
      {
        id: '1',
        recipient_id: userId,
        recipient_role: 'STUDENT',
        type: 'APPLICATION_APPROVED',
        title: 'Application Approved!',
        message: 'Your application for Software Developer Intern has been approved.',
        created_at: new Date().toISOString(),
        read: false,
        action_url: '/applications'
      }
    ];
  }
  
  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: number): Promise<void> {
    console.log(`Marked notification ${notificationId} as read for user ${userId}`);
  }
}

// Notification templates for different events
export const NotificationTemplates = {
  APPLICATION_SUBMITTED: (internshipTitle: string) => ({
    title: 'Application Submitted Successfully',
    message: `Your application for "${internshipTitle}" has been submitted and is awaiting mentor approval.`
  }),
  
  APPLICATION_APPROVED: (internshipTitle: string) => ({
    title: 'Application Approved!',
    message: `Great news! Your mentor has approved your application for "${internshipTitle}".`
  }),
  
  NEW_INTERNSHIP: (internshipTitle: string, company: string) => ({
    title: 'New Opportunity Available',
    message: `A new internship "${internshipTitle}" at ${company} is now available for your department.`
  })
};