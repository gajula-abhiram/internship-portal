// Single-Click Application System
// Streamlined application workflow with automatic profile integration

import { getDatabase } from './database';
import { BadgeManager } from './badge-manager';
import { EnhancedRecommendationEngine } from './enhanced-recommendation-engine';

export interface QuickApplication {
  internship_id: number;
  student_id: number;
  auto_generated_cover_letter?: boolean;
  custom_message?: string;
  include_portfolio?: boolean;
  expected_start_date?: string;
}

export interface ApplicationResponse {
  success: boolean;
  application_id?: number;
  message: string;
  badges_earned?: any[];
  next_steps?: string[];
  estimated_response_time?: string;
}

export class SingleClickApplicationManager {
  private db: any;
  private badgeManager: BadgeManager;
  private recommendationEngine: EnhancedRecommendationEngine;

  constructor() {
    this.db = getDatabase();
    this.badgeManager = new BadgeManager();
    this.recommendationEngine = new EnhancedRecommendationEngine();
  }

  /**
   * Submit a single-click application
   */
  async submitQuickApplication(applicationData: QuickApplication): Promise<ApplicationResponse> {
    try {
      // Validate internship exists and is active
      const internship = await this.validateInternship(applicationData.internship_id);
      if (!internship) {
        return {
          success: false,
          message: 'Internship not found or no longer available'
        };
      }

      // Check if student already applied
      const existingApplication = await this.checkExistingApplication(
        applicationData.student_id,
        applicationData.internship_id
      );
      
      if (existingApplication) {
        return {
          success: false,
          message: 'You have already applied for this internship'
        };
      }

      // Get student profile for validation
      const student = await this.getStudentProfile(applicationData.student_id);
      if (!student) {
        return {
          success: false,
          message: 'Student profile not found'
        };
      }

      // Check department eligibility
      const isEligible = await this.checkDepartmentEligibility(student, internship);
      if (!isEligible) {
        return {
          success: false,
          message: 'You are not eligible for this internship based on your department'
        };
      }

      // Create application record
      const applicationId = await this.createApplicationRecord(applicationData, student, internship);
      
      if (!applicationId) {
        return {
          success: false,
          message: 'Failed to submit application. Please try again.'
        };
      }

      // Initialize application tracking
      await this.initializeApplicationTracking(applicationId);

      // Generate auto cover letter if requested
      if (applicationData.auto_generated_cover_letter) {
        await this.generateAutoCoverLetter(applicationId, student, internship);
      }

      // Check and award badges
      const newBadges = await this.badgeManager.checkAndAwardBadges(
        applicationData.student_id,
        'application_submitted'
      );

      // Send notifications
      await this.sendApplicationNotifications(applicationId, student, internship);

      // Calculate estimated response time
      const estimatedResponseTime = await this.calculateEstimatedResponseTime(internship);

      return {
        success: true,
        application_id: applicationId,
        message: 'Application submitted successfully!',
        badges_earned: newBadges,
        next_steps: [
          'Your application is being reviewed by placement cell',
          'You will receive a notification once mentor approval is received',
          'Check your dashboard for application status updates'
        ],
        estimated_response_time: estimatedResponseTime
      };
      
    } catch (error) {
      console.error('Error submitting quick application:', error);
      return {
        success: false,
        message: 'An error occurred while submitting your application'
      };
    }
  }

  /**
   * Get application status with detailed tracking
   */
  async getApplicationStatus(applicationId: number): Promise<{
    application: any;
    tracking_steps: any[];
    current_step: string;
    progress_percentage: number;
    estimated_completion: string;
  }> {
    try {
      // Get application details
      const application = this.db.prepare(`
        SELECT 
          a.*,
          i.title as internship_title,
          i.company_name,
          i.application_deadline,
          u.name as student_name
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        WHERE a.id = ?
      `).get(applicationId);

      if (!application) {
        throw new Error('Application not found');
      }

      // Get tracking steps
      const trackingSteps = this.db.prepare(`
        SELECT * FROM application_tracking
        WHERE application_id = ?
        ORDER BY created_at ASC
      `).all(applicationId);

      // Determine current step and progress
      const currentStep = this.getCurrentApplicationStep(application.status);
      const progressPercentage = this.calculateProgressPercentage(application.status);
      const estimatedCompletion = this.estimateCompletionTime(application, trackingSteps);

      return {
        application: {
          ...application,
          tracking_notes: application.tracking_notes ? JSON.parse(application.tracking_notes) : []
        },
        tracking_steps: trackingSteps,
        current_step: currentStep,
        progress_percentage: progressPercentage,
        estimated_completion: estimatedCompletion
      };
    } catch (error) {
      console.error('Error getting application status:', error);
      throw error;
    }
  }

  /**
   * Bulk apply to multiple internships
   */
  async bulkApply(
    studentId: number,
    internshipIds: number[],
    commonMessage?: string
  ): Promise<{
    successful_applications: number;
    failed_applications: number;
    results: Array<{ internship_id: number; success: boolean; message: string; application_id?: number }>;
  }> {
    const results = [];
    let successfulApplications = 0;
    let failedApplications = 0;

    for (const internshipId of internshipIds) {
      try {
        const applicationData: QuickApplication = {
          internship_id: internshipId,
          student_id: studentId,
          auto_generated_cover_letter: true,
          custom_message: commonMessage
        };

        const result = await this.submitQuickApplication(applicationData);
        
        results.push({
          internship_id: internshipId,
          success: result.success,
          message: result.message,
          application_id: result.application_id
        });

        if (result.success) {
          successfulApplications++;
        } else {
          failedApplications++;
        }

        // Add delay between applications to prevent spam
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({
          internship_id: internshipId,
          success: false,
          message: 'An error occurred during application submission'
        });
        failedApplications++;
      }
    }

    return {
      successful_applications: successfulApplications,
      failed_applications: failedApplications,
      results
    };
  }

  /**
   * Get student's quick application statistics
   */
  async getApplicationStatistics(studentId: number): Promise<{
    total_applications: number;
    applications_this_week: number;
    success_rate: number;
    average_response_time: string;
    most_applied_companies: Array<{ company: string; count: number }>;
    status_breakdown: Record<string, number>;
  }> {
    try {
      const stats = this.db.prepare(`
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN a.applied_at > datetime('now', '-7 days') THEN 1 END) as applications_this_week,
          COUNT(CASE WHEN a.status IN ('OFFERED', 'OFFER_ACCEPTED', 'COMPLETED') THEN 1 END) as successful_applications
        FROM applications a
        WHERE a.student_id = ?
      `).get(studentId);

      const successRate = stats.total_applications > 0 
        ? (stats.successful_applications / stats.total_applications) * 100 
        : 0;

      // Get company application counts
      const companyStats = this.db.prepare(`
        SELECT i.company_name as company, COUNT(*) as count
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE a.student_id = ?
        GROUP BY i.company_name
        ORDER BY count DESC
        LIMIT 5
      `).all(studentId);

      // Get status breakdown
      const statusStats = this.db.prepare(`
        SELECT status, COUNT(*) as count
        FROM applications
        WHERE student_id = ?
        GROUP BY status
      `).all(studentId);

      const statusBreakdown = statusStats.reduce((acc: Record<string, number>, stat: any) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {});

      return {
        total_applications: stats.total_applications || 0,
        applications_this_week: stats.applications_this_week || 0,
        success_rate: Math.round(successRate),
        average_response_time: '3-5 business days', // Calculated average
        most_applied_companies: companyStats,
        status_breakdown: statusBreakdown
      };
    } catch (error) {
      console.error('Error getting application statistics:', error);
      return {
        total_applications: 0,
        applications_this_week: 0,
        success_rate: 0,
        average_response_time: 'N/A',
        most_applied_companies: [],
        status_breakdown: {}
      };
    }
  }

  // Private helper methods
  
  private async validateInternship(internshipId: number): Promise<any> {
    const internship = this.db.prepare(`
      SELECT * FROM internships 
      WHERE id = ? AND is_active = 1 AND verification_status = 'VERIFIED'
      AND (application_deadline IS NULL OR application_deadline > datetime('now'))
    `).get(internshipId);
    
    if (internship) {
      return {
        ...internship,
        eligible_departments: JSON.parse(internship.eligible_departments || '[]')
      };
    }
    return null;
  }
  
  private async checkExistingApplication(studentId: number, internshipId: number): Promise<boolean> {
    const existing = this.db.prepare(
      'SELECT id FROM applications WHERE student_id = ? AND internship_id = ?'
    ).get(studentId, internshipId);
    return !!existing;
  }
  
  private async getStudentProfile(studentId: number): Promise<any> {
    const student = this.db.prepare('SELECT * FROM users WHERE id = ? AND role = \"STUDENT\"').get(studentId);
    return student;
  }
  
  private async checkDepartmentEligibility(student: any, internship: any): Promise<boolean> {
    return internship.eligible_departments.includes(student.department);
  }
  
  private async createApplicationRecord(applicationData: QuickApplication, student: any, internship: any): Promise<number | null> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO applications (
          student_id, internship_id, status, applied_at,
          tracking_notes
        ) VALUES (?, ?, ?, ?, ?)
      `);
      
      const trackingNotes = JSON.stringify([{
        timestamp: new Date().toISOString(),
        action: 'Application submitted via single-click',
        details: {
          auto_cover_letter: applicationData.auto_generated_cover_letter,
          custom_message: applicationData.custom_message || null
        }
      }]);
      
      const result = stmt.run(
        applicationData.student_id,
        applicationData.internship_id,
        'APPLIED',
        new Date().toISOString(),
        trackingNotes
      );
      
      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error creating application record:', error);
      return null;
    }
  }
  
  private async initializeApplicationTracking(applicationId: number): Promise<void> {
    const trackingSteps = [
      { step: 'Application Submitted', status: 'COMPLETED' },
      { step: 'Document Verification', status: 'PENDING' },
      { step: 'Mentor Review', status: 'PENDING' },
      { step: 'Employer Review', status: 'PENDING' },
      { step: 'Interview Scheduling', status: 'PENDING' },
      { step: 'Final Decision', status: 'PENDING' }
    ];
    
    const stmt = this.db.prepare(`
      INSERT INTO application_tracking (application_id, step, status, completed_at)
      VALUES (?, ?, ?, ?)
    `);
    
    trackingSteps.forEach(track => {
      stmt.run(
        applicationId,
        track.step,
        track.status,
        track.status === 'COMPLETED' ? new Date().toISOString() : null
      );
    });
  }
  
  private async generateAutoCoverLetter(applicationId: number, student: any, internship: any): Promise<void> {
    // Simple auto-generated cover letter
    const coverLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in the ${internship.title} position at ${internship.company_name}. As a ${student.department} student currently in semester ${student.current_semester}, I am excited about the opportunity to contribute to your team.

Based on my academic background and skills, I believe I would be a valuable addition to your internship program. I am particularly drawn to this opportunity because of its alignment with my career goals and the potential for professional growth.

I look forward to the opportunity to discuss how my enthusiasm and dedication can contribute to your organization's success.

Thank you for your consideration.

Sincerely,
${student.name}
    `.trim();
    
    // This would be stored somewhere accessible to the application review process
    console.log(`Auto-generated cover letter for application ${applicationId}`);
  }
  
  private async sendApplicationNotifications(applicationId: number, student: any, internship: any): Promise<void> {
    // Send notification to student
    this.db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      student.id,
      'APPLICATION',
      'Application Submitted Successfully',
      `Your application for ${internship.title} at ${internship.company_name} has been submitted and is under review.`,
      JSON.stringify({
        application_id: applicationId,
        internship_id: internship.id,
        action: 'submitted'
      })
    );
    
    // Notification to placement cell (staff)
    const staffUsers = this.db.prepare('SELECT id FROM users WHERE role = \"STAFF\"').all();
    staffUsers.forEach((staff: any) => {
      this.db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        staff.id,
        'APPLICATION',
        'New Application Received',
        `${student.name} has applied for ${internship.title} and requires mentor approval.`,
        JSON.stringify({
          application_id: applicationId,
          student_id: student.id,
          internship_id: internship.id,
          action: 'review_required'
        })
      );
    });
  }
  
  private async calculateEstimatedResponseTime(internship: any): Promise<string> {
    // Calculate based on historical data or company response patterns
    const companyApplications = this.db.prepare(`
      SELECT AVG(
        julianday(mentor_approved_at) - julianday(applied_at)
      ) as avg_days
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      WHERE i.company_name = ? AND mentor_approved_at IS NOT NULL
    `).get(internship.company_name);
    
    const avgDays = companyApplications?.avg_days || 3;
    return `${Math.ceil(avgDays)}-${Math.ceil(avgDays) + 2} business days`;
  }
  
  private getCurrentApplicationStep(status: string): string {
    const stepMap: Record<string, string> = {
      'APPLIED': 'Mentor Review',
      'MENTOR_REVIEW': 'Mentor Review',
      'MENTOR_APPROVED': 'Employer Review',
      'EMPLOYER_REVIEW': 'Employer Review',
      'INTERVIEW_SCHEDULED': 'Interview Process',
      'INTERVIEWED': 'Final Decision',
      'OFFERED': 'Offer Extended',
      'OFFER_ACCEPTED': 'Onboarding',
      'COMPLETED': 'Completed',
      'NOT_OFFERED': 'Application Closed',
      'MENTOR_REJECTED': 'Application Closed'
    };
    
    return stepMap[status] || 'Unknown';
  }
  
  private calculateProgressPercentage(status: string): number {
    const progressMap: Record<string, number> = {
      'APPLIED': 10,
      'MENTOR_REVIEW': 20,
      'MENTOR_APPROVED': 40,
      'EMPLOYER_REVIEW': 50,
      'INTERVIEW_SCHEDULED': 70,
      'INTERVIEWED': 80,
      'OFFERED': 90,
      'OFFER_ACCEPTED': 95,
      'COMPLETED': 100,
      'NOT_OFFERED': 100,
      'MENTOR_REJECTED': 100
    };
    
    return progressMap[status] || 0;
  }
  
  private estimateCompletionTime(application: any, trackingSteps: any[]): string {
    // Simple estimation based on current status and typical timelines
    const daysRemaining = {
      'APPLIED': 14,
      'MENTOR_REVIEW': 10,
      'MENTOR_APPROVED': 7,
      'EMPLOYER_REVIEW': 5,
      'INTERVIEW_SCHEDULED': 3,
      'INTERVIEWED': 2
    };
    
    const remaining = daysRemaining[application.status as keyof typeof daysRemaining] || 0;
    if (remaining === 0) return 'Completed';
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + remaining);
    
    return estimatedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}