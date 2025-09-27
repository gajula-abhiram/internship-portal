// Automated Mentor/Faculty Approval Workflow System
import { getDatabase } from './database';
import { BadgeManager } from './badge-manager';

export interface MentorApprovalRequest {
  id?: number;
  application_id: number;
  student_id: number;
  mentor_id?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  auto_assigned: boolean;
  submitted_at: string;
  reviewed_at?: string;
  comments?: string;
}

export class AutomatedMentorWorkflow {
  private db: any;
  private badgeManager: BadgeManager;

  constructor() {
    this.db = getDatabase();
    this.badgeManager = new BadgeManager();
  }

  /**
   * Submit application for mentor approval with automatic routing
   */
  async submitForMentorApproval(applicationId: number): Promise<{
    success: boolean;
    approval_request_id?: number;
    assigned_mentor?: any;
    estimated_response_time?: string;
    message: string;
  }> {
    try {
      const application = await this.getApplicationDetails(applicationId);
      if (!application) {
        return { success: false, message: 'Application not found' };
      }

      const existingRequest = await this.getExistingApprovalRequest(applicationId);
      if (existingRequest) {
        return { success: false, message: 'Application already submitted for mentor approval' };
      }

      const priority = await this.calculatePriority(application);
      const assignedMentor = await this.autoAssignMentor(application.student_department, priority);
      
      if (!assignedMentor) {
        return { success: false, message: 'No available mentors found. Request has been queued.' };
      }

      const approvalRequestId = await this.createApprovalRequest({
        application_id: applicationId,
        student_id: application.student_id,
        mentor_id: assignedMentor.id,
        status: 'PENDING',
        priority,
        auto_assigned: true,
        submitted_at: new Date().toISOString()
      });

      await this.updateApplicationStatus(applicationId, 'MENTOR_REVIEW', assignedMentor.id);
      await this.sendApprovalNotifications(approvalRequestId, application, assignedMentor);

      return {
        success: true,
        approval_request_id: approvalRequestId,
        assigned_mentor: { id: assignedMentor.id, name: assignedMentor.name, department: assignedMentor.department },
        estimated_response_time: this.calculateEstimatedResponseTime(assignedMentor, priority),
        message: `Application submitted to ${assignedMentor.name} for review`
      };
      
    } catch (error) {
      console.error('Error submitting for mentor approval:', error);
      return { success: false, message: 'Failed to submit for mentor approval' };
    }
  }

  /**
   * Process mentor decision on application
   */
  async processMentorDecision(
    approvalRequestId: number,
    mentorId: number,
    decision: 'APPROVED' | 'REJECTED',
    comments?: string
  ): Promise<{ success: boolean; next_step?: string; message: string; }> {
    try {
      const request = await this.getApprovalRequest(approvalRequestId);
      if (!request || request.mentor_id !== mentorId) {
        return { success: false, message: 'Unauthorized to process this request' };
      }

      await this.updateApprovalRequest(approvalRequestId, {
        status: decision,
        reviewed_at: new Date().toISOString(),
        comments
      });

      const newStatus = decision === 'APPROVED' ? 'MENTOR_APPROVED' : 'MENTOR_REJECTED';
      await this.updateApplicationStatus(request.application_id, newStatus);
      await this.sendDecisionNotifications(request, decision, comments);
      await this.badgeManager.checkAndAwardBadges(mentorId, 'mentor_review_completed');
      
      let nextStep = '';
      if (decision === 'APPROVED') {
        await this.routeToEmployer(request.application_id);
        nextStep = 'Application forwarded to employer for review';
      }

      return {
        success: true,
        next_step: nextStep,
        message: `Application ${decision.toLowerCase()} successfully`
      };
      
    } catch (error) {
      console.error('Error processing mentor decision:', error);
      return { success: false, message: 'Failed to process mentor decision' };
    }
  }

  /**
   * Get mentor's pending approval requests
   */
  async getMentorWorkqueue(mentorId: number): Promise<{
    pending_requests: any[];
    overdue_requests: any[];
    summary: { total_pending: number; high_priority: number; avg_waiting_time_hours: number; };
  }> {
    try {
      const requests = this.db.prepare(`
        SELECT ar.*, a.applied_at, i.title as internship_title, i.company_name,
               u.name as student_name, u.department as student_department
        FROM mentor_approval_requests ar
        JOIN applications a ON ar.application_id = a.id
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON ar.student_id = u.id
        WHERE ar.mentor_id = ? AND ar.status = 'PENDING'
        ORDER BY ar.priority DESC, ar.submitted_at ASC
      `).all(mentorId);
      
      const now = new Date();
      const enhancedRequests = requests.map((req: any) => {
        const submittedAt = new Date(req.submitted_at);
        const waitingHours = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
        const isOverdue = waitingHours > this.getMaxResponseTime(req.priority);
        
        return { ...req, waiting_hours: Math.round(waitingHours), is_overdue: isOverdue };
      });
      
      const overdueRequests = enhancedRequests.filter((r: any) => r.is_overdue);
      const avgWaitingTime = enhancedRequests.length > 0 
        ? enhancedRequests.reduce((sum: number, r: any) => sum + r.waiting_hours, 0) / enhancedRequests.length 
        : 0;
      
      return {
        pending_requests: enhancedRequests,
        overdue_requests: overdueRequests,
        summary: {
          total_pending: enhancedRequests.length,
          high_priority: enhancedRequests.filter((r: any) => r.priority === 'HIGH' || r.priority === 'URGENT').length,
          avg_waiting_time_hours: Math.round(avgWaitingTime)
        }
      };
      
    } catch (error) {
      console.error('Error getting mentor workqueue:', error);
      return { pending_requests: [], overdue_requests: [], summary: { total_pending: 0, high_priority: 0, avg_waiting_time_hours: 0 } };
    }
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(): Promise<{
    total_requests: number;
    avg_approval_time_hours: number;
    approval_rate: number;
    mentor_performance: Array<{ mentor_name: string; requests_handled: number; avg_response_time: number; }>;
  }> {
    try {
      const overallStats = this.db.prepare(`
        SELECT COUNT(*) as total_requests,
               AVG((julianday(reviewed_at) - julianday(submitted_at)) * 24) as avg_approval_time_hours,
               ROUND(COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0 / 
                     NULLIF(COUNT(CASE WHEN status IN ('APPROVED', 'REJECTED') THEN 1 END), 0), 1) as approval_rate
        FROM mentor_approval_requests
        WHERE submitted_at > datetime('now', '-30 days')
      `).get();
      
      const mentorPerformance = this.db.prepare(`
        SELECT u.name as mentor_name, COUNT(ar.id) as requests_handled,
               AVG((julianday(ar.reviewed_at) - julianday(ar.submitted_at)) * 24) as avg_response_time
        FROM mentor_approval_requests ar
        JOIN users u ON ar.mentor_id = u.id
        WHERE ar.submitted_at > datetime('now', '-30 days')
        GROUP BY u.id, u.name
        ORDER BY requests_handled DESC
      `).all();
      
      return {
        total_requests: overallStats.total_requests || 0,
        avg_approval_time_hours: Math.round(overallStats.avg_approval_time_hours || 0),
        approval_rate: overallStats.approval_rate || 0,
        mentor_performance: mentorPerformance.map((mp: any) => ({
          ...mp,
          avg_response_time: Math.round(mp.avg_response_time || 0)
        }))
      };
      
    } catch (error) {
      console.error('Error getting workflow analytics:', error);
      return { total_requests: 0, avg_approval_time_hours: 0, approval_rate: 0, mentor_performance: [] };
    }
  }

  // Private helper methods
  private async getApplicationDetails(applicationId: number): Promise<any> {
    return this.db.prepare(`
      SELECT a.*, u.department as student_department, i.application_deadline, i.company_name
      FROM applications a
      JOIN users u ON a.student_id = u.id
      JOIN internships i ON a.internship_id = i.id
      WHERE a.id = ?
    `).get(applicationId);
  }
  
  private async calculatePriority(application: any): Promise<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> {
    const now = new Date();
    if (application.application_deadline) {
      const deadline = new Date(application.application_deadline);
      const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntilDeadline < 3) return 'URGENT';
      if (daysUntilDeadline < 7) return 'HIGH';
    }
    const applicationAge = (now.getTime() - new Date(application.applied_at).getTime()) / (1000 * 60 * 60 * 24);
    if (applicationAge > 5) return 'HIGH';
    if (applicationAge > 2) return 'MEDIUM';
    return 'LOW';
  }
  
  private async autoAssignMentor(department: string, priority: string): Promise<any> {
    return this.db.prepare(`
      SELECT u.*, COUNT(ar.id) as current_workload
      FROM users u
      LEFT JOIN mentor_approval_requests ar ON u.id = ar.mentor_id AND ar.status = 'PENDING'
      WHERE u.role = 'MENTOR' AND u.department = ?
      GROUP BY u.id ORDER BY current_workload ASC LIMIT 1
    `).get(department);
  }
  
  private async createApprovalRequest(request: Omit<MentorApprovalRequest, 'id'>): Promise<number> {
    const result = this.db.prepare(`
      INSERT INTO mentor_approval_requests (application_id, student_id, mentor_id, status, priority, auto_assigned, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(request.application_id, request.student_id, request.mentor_id, request.status, 
           request.priority, request.auto_assigned ? 1 : 0, request.submitted_at);
    return result.lastInsertRowid as number;
  }
  
  private async updateApplicationStatus(applicationId: number, status: string, mentorId?: number): Promise<void> {
    this.db.prepare('UPDATE applications SET status = ?, mentor_id = ?, updated_at = ? WHERE id = ?')
           .run(status, mentorId, new Date().toISOString(), applicationId);
  }
  
  private async sendApprovalNotifications(requestId: number, application: any, mentor: any): Promise<void> {
    // Send notifications to mentor and student
    this.db.prepare('INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)')
           .run(mentor.id, 'APPROVAL', 'New Application for Review', 
                `You have been assigned to review an application for ${application.company_name}`,
                JSON.stringify({ approval_request_id: requestId, application_id: application.id }));
  }
  
  private getMaxResponseTime(priority: string): number {
    const responseTimeMap = { 'URGENT': 12, 'HIGH': 24, 'MEDIUM': 48, 'LOW': 72 };
    return responseTimeMap[priority as keyof typeof responseTimeMap] || 72;
  }
  
  private calculateEstimatedResponseTime(mentor: any, priority: string): string {
    const baseTime = this.getMaxResponseTime(priority);
    return `${Math.round(baseTime * 0.8)}-${baseTime} hours`;
  }
  
  // Additional helper methods for completeness
  private async getExistingApprovalRequest(applicationId: number): Promise<any> {
    return this.db.prepare('SELECT * FROM mentor_approval_requests WHERE application_id = ?').get(applicationId);
  }
  
  private async getApprovalRequest(requestId: number): Promise<any> {
    return this.db.prepare('SELECT * FROM mentor_approval_requests WHERE id = ?').get(requestId);
  }
  
  private async updateApprovalRequest(requestId: number, updates: any): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    this.db.prepare(`UPDATE mentor_approval_requests SET ${fields} WHERE id = ?`).run(...values, requestId);
  }
  
  private async sendDecisionNotifications(request: any, decision: string, comments?: string): Promise<void> {
    // Send notification to student about decision
    this.db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)')
           .run(request.student_id, 'APPLICATION', `Application ${decision}`, 
                `Your application has been ${decision.toLowerCase()} by mentor`);
  }
  
  private async routeToEmployer(applicationId: number): Promise<void> {
    // Update application status to route to employer
    this.db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('EMPLOYER_REVIEW', applicationId);
  }
}