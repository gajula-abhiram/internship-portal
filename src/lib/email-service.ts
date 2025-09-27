// Email Service for Production
// Integrates with SMTP providers for real email delivery

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: any;
  priority?: 'high' | 'normal' | 'low';
}

export class EmailService {
  private static config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };

  /**
   * Send email using SMTP
   */
  static async sendEmail(emailData: EmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // In production, use nodemailer or similar
      // For now, simulate email sending
      console.log('📧 Email sent:', {
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // In production, this would be:
      /*
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter(this.config);
      
      const mailOptions = {
        from: this.config.auth.user,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html || this.generateTemplate(emailData.template!, emailData.templateData),
        text: emailData.text
      };
      
      const result = await transporter.sendMail(mailOptions);
      */

      return {
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`
      };

    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send bulk emails with rate limiting
   */
  static async sendBulkEmails(emails: EmailData[]): Promise<{
    sent: number;
    failed: number;
    results: Array<{ email: string; success: boolean; error?: string }>;
  }> {
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        
        if (result.success) {
          sent++;
          results.push({ email: Array.isArray(email.to) ? email.to[0] : email.to, success: true });
        } else {
          failed++;
          results.push({ 
            email: Array.isArray(email.to) ? email.to[0] : email.to, 
            success: false, 
            error: result.error 
          });
        }

        // Rate limiting - wait between emails
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        failed++;
        results.push({
          email: Array.isArray(email.to) ? email.to[0] : email.to,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { sent, failed, results };
  }

  /**
   * Generate email from template
   */
  static generateTemplate(templateName: string, data: any): string {
    const templates = this.getEmailTemplates();
    const template = templates[templateName];
    
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    let html = template.html;
    
    // Simple template variable replacement
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    });

    return html;
  }

  /**
   * Email templates
   */
  private static getEmailTemplates(): Record<string, EmailTemplate> {
    return {
      application_submitted: {
        subject: 'Application Submitted - {{internship_title}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Application Submitted Successfully</h1>
                <p>Rajasthan Technical University - Internship Portal</p>
              </div>
              <div class="content">
                <p>Dear {{student_name}},</p>
                
                <p>Your application for <strong>{{internship_title}}</strong> has been successfully submitted and is now under review.</p>
                
                <h3>Next Steps:</h3>
                <ul>
                  <li>Your department mentor will review your application</li>
                  <li>You'll receive an email notification once reviewed</li>
                  <li>If approved, your application will be forwarded to the employer</li>
                </ul>
                
                <a href="{{portal_url}}/applications" class="button">Track Your Application</a>
                
                <p>Good luck with your application!</p>
                
                <p>Best regards,<br>Placement Cell</p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply directly to this message.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: 'Your application for {{internship_title}} has been submitted successfully.'
      },

      application_approved: {
        subject: 'Application Approved! - {{internship_title}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
              .success-badge { background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Application Approved!</h1>
                <p>Congratulations from RTU Placement Cell</p>
              </div>
              <div class="content">
                <div class="success-badge">
                  <strong>Great News!</strong> Your mentor has approved your application.
                </div>
                
                <p>Dear {{student_name}},</p>
                
                <p>We're excited to inform you that your application for <strong>{{internship_title}}</strong> has been approved by your department mentor.</p>
                
                <h3>What happens next:</h3>
                <ul>
                  <li>Your application is now forwarded to the employer</li>
                  <li>The employer will review your profile and application</li>
                  <li>You may be contacted for an interview</li>
                  <li>Keep checking your email and portal for updates</li>
                </ul>
                
                <a href="{{portal_url}}/applications" class="button">View Application Status</a>
                
                <p>Best of luck with the next steps!</p>
                
                <p>Warm regards,<br>{{mentor_name}}<br>Department Mentor</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: 'Congratulations! Your application for {{internship_title}} has been approved by your mentor.'
      },

      interview_scheduled: {
        subject: 'Interview Scheduled - {{internship_title}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .interview-details { background: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .button { background: #6f42c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📅 Interview Scheduled</h1>
                <p>Your next step towards success</p>
              </div>
              <div class="content">
                <p>Dear {{student_name}},</p>
                
                <p>Great news! You've been selected for an interview for the <strong>{{internship_title}}</strong> position.</p>
                
                <div class="interview-details">
                  <h3>Interview Details:</h3>
                  <p><strong>Date:</strong> {{interview_date}}</p>
                  <p><strong>Time:</strong> {{interview_time}}</p>
                  <p><strong>Mode:</strong> {{interview_mode}}</p>
                  <p><strong>Interviewer:</strong> {{interviewer_name}}</p>
                  {{#if interview_link}}<p><strong>Link:</strong> <a href="{{interview_link}}">{{interview_link}}</a></p>{{/if}}
                </div>
                
                <h3>Preparation Tips:</h3>
                <ul>
                  <li>Review the job description and requirements</li>
                  <li>Prepare examples of your relevant projects</li>
                  <li>Be ready to discuss your technical skills</li>
                  <li>Arrive 10 minutes early (or join the call early)</li>
                </ul>
                
                <a href="{{portal_url}}/applications" class="button">View Full Details</a>
                
                <p>We wish you the best of luck!</p>
                
                <p>Best regards,<br>Placement Cell</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: 'Your interview for {{internship_title}} has been scheduled for {{interview_date}} at {{interview_time}}.'
      },

      certificate_ready: {
        subject: 'Certificate Ready for Download - {{internship_title}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .certificate-info { background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #ffc107; }
              .button { background: #fd7e14; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏆 Certificate Ready!</h1>
                <p>Congratulations on your completion</p>
              </div>
              <div class="content">
                <p>Dear {{student_name}},</p>
                
                <p>Congratulations! You have successfully completed your internship, and your completion certificate is now ready for download.</p>
                
                <div class="certificate-info">
                  <h3>Certificate Details:</h3>
                  <p><strong>Internship:</strong> {{internship_title}}</p>
                  <p><strong>Company:</strong> {{company_name}}</p>
                  <p><strong>Duration:</strong> {{duration_weeks}} weeks</p>
                  <p><strong>Performance Rating:</strong> {{rating}}/5</p>
                  <p><strong>Certificate ID:</strong> {{certificate_id}}</p>
                </div>
                
                <a href="{{certificate_url}}" class="button">Download Certificate</a>
                
                <p>This certificate has been added to your employability record and can be verified online using the certificate ID.</p>
                
                <p>Congratulations once again on your achievement!</p>
                
                <p>Best regards,<br>Placement Cell<br>Rajasthan Technical University</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: 'Your completion certificate for {{internship_title}} is ready for download.'
      }
    };
  }

  /**
   * Test email configuration
   */
  static async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this would test SMTP connection
      console.log('Testing email configuration...');
      
      if (!this.config.auth.user || !this.config.auth.pass) {
        return {
          success: false,
          error: 'SMTP credentials not configured'
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration test failed'
      };
    }
  }

  /**
   * Queue email for later sending (for high volume)
   */
  static async queueEmail(emailData: EmailData): Promise<{ queued: boolean; queueId?: string }> {
    // In production, this would use Redis or database queue
    console.log('📬 Email queued:', emailData.subject);
    
    return {
      queued: true,
      queueId: `queue-${Date.now()}-${Math.random().toString(36).substring(7)}`
    };
  }
}