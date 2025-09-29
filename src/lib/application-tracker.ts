// Application Tracking Service
// Manages live tracking of application steps (resume viewed, interview scheduled, feedback received, offer status)

import { getDatabase } from './database';

export interface TrackingStep {
  id?: number;
  application_id: number;
  step: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completed_at?: string;
  notes?: string;
  actor_id?: number;
}

export interface InterviewSchedule {
  id?: number;
  application_id: number;
  interviewer_id: number;
  student_id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  mode: 'ONLINE' | 'OFFLINE' | 'PHONE';
  meeting_link?: string;
  location?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED';
  interview_type: 'TECHNICAL' | 'HR' | 'MANAGER' | 'FINAL';
  notes?: string;
  feedback?: string;
  rating?: number;
}

export interface PlacementOffer {
  id?: number;
  application_id: number;
  student_id: number;
  company_id: number;
  position_title: string;
  offer_type: 'INTERNSHIP' | 'PLACEMENT' | 'FULL_TIME';
  offer_details: string;
  offer_status: 'DRAFT' | 'EXTENDED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  offer_date: string;
  response_deadline: string;
  acceptance_date?: string;
  rejection_date?: string;
  rejection_reason?: string;
  contract_signed: boolean;
  contract_details?: string;
}

export class ApplicationTracker {
  private db: any;

  constructor() {
    // Initialize database with dynamic import
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      const { getDatabase } = await import('./database');
      this.db = getDatabase();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.db = null;
    }
  }

  /**
   * Initialize default tracking steps for a new application
   */
  async initializeTracking(applicationId: number): Promise<void> {
    // Wait for database initialization
    if (this.db === undefined) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.db) return;

    const defaultSteps = [
      { step: 'Application Submitted', status: 'COMPLETED' },
      { step: 'Resume Review', status: 'PENDING' },
      { step: 'Document Verification', status: 'PENDING' },
      { step: 'Mentor Review', status: 'PENDING' },
      { step: 'Employer Review', status: 'PENDING' },
      { step: 'Interview Scheduling', status: 'PENDING' },
      { step: 'Interview Process', status: 'PENDING' },
      { step: 'Feedback Collection', status: 'PENDING' },
      { step: 'Final Decision', status: 'PENDING' },
      { step: 'Offer Processing', status: 'PENDING' }
    ];

    const stmt = this.db.prepare(`
      INSERT INTO application_tracking (application_id, step, status, completed_at)
      VALUES (?, ?, ?, ?)
    `);

    defaultSteps.forEach(track => {
      const completedAt = track.status === 'COMPLETED' ? new Date().toISOString() : null;
      stmt.run(applicationId, track.step, track.status, completedAt);
    });
  }

  /**
   * Update tracking step status
   */
  async updateTrackingStep(stepId: number, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED', notes?: string, actorId?: number): Promise<boolean> {
    // Wait for database initialization
    if (this.db === undefined) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.db) return false;

    try {
      const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;
      
      const stmt = this.db.prepare(`
        UPDATE application_tracking 
        SET status = ?, completed_at = ?, notes = ?, actor_id = ?
        WHERE id = ?
      `);
      
      stmt.run(status, completedAt, notes || null, actorId || null, stepId);
      return true;
    } catch (error) {
      console.error('Error updating tracking step:', error);
      return false;
    }
  }

  /**
   * Mark step as completed with optional notes
   */
  async completeStep(stepId: number, notes?: string, actorId?: number): Promise<boolean> {
    return this.updateTrackingStep(stepId, 'COMPLETED', notes, actorId);
  }

  /**
   * Get all tracking steps for an application
   */
  async getTrackingSteps(applicationId: number): Promise<TrackingStep[]> {
    // Wait for database initialization
    if (this.db === undefined) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM application_tracking
        WHERE application_id = ?
        ORDER BY created_at ASC
      `);
      
      return stmt.all(applicationId);
    } catch (error) {
      console.error('Error fetching tracking steps:', error);
      return [];
    }
  }

  /**
   * Schedule an interview for an application
   */
  async scheduleInterview(interviewData: Omit<InterviewSchedule, 'id'>): Promise<number | null> {
    // Wait for database initialization
    if (this.db === undefined) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO interview_schedules (
          application_id, interviewer_id, student_id, scheduled_datetime,
          duration_minutes, mode, meeting_link, location, status,
          interview_type, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        interviewData.application_id,
        interviewData.interviewer_id,
        interviewData.student_id,
        interviewData.scheduled_datetime,
        interviewData.duration_minutes,
        interviewData.mode,
        interviewData.meeting_link || null,
        interviewData.location || null,
        interviewData.status,
        interviewData.interview_type,
        interviewData.notes || null
      );
      
      // Sync with calendar using dynamic import
      try {
        const { CalendarService } = await import('./calendar-service');
        const calendarService = new CalendarService();
        await calendarService.syncInterviewWithCalendar(
          result.lastInsertRowid as number,
          interviewData.application_id,
          interviewData.student_id,
          interviewData.interviewer_id,
          interviewData.scheduled_datetime,
          interviewData.duration_minutes
        );
      } catch (error) {
        console.error('Error syncing with calendar:', error);
      }
      
      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error scheduling interview:', error);
      return null;
    }
  }

  /**
   * Update interview status
   */
  async updateInterviewStatus(interviewId: number, status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED', feedback?: string, rating?: number): Promise<boolean> {
    // Wait for database initialization
    if (this.db === undefined) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare(`
        UPDATE interview_schedules 
        SET status = ?, feedback = ?, rating = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(status, feedback || null, rating || null, interviewId);
      return true;
    } catch (error) {
      console.error('Error updating interview status:', error);
      return false;
    }
  }

  /**
   * Get interviews for an application
   */
  async getInterviews(applicationId: number): Promise<InterviewSchedule[]> {
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM interview_schedules
        WHERE application_id = ?
        ORDER BY scheduled_datetime ASC
      `);
      
      const interviews = stmt.all(applicationId);
      
      // Map the database results to include proper typing
      return interviews.map((interview: any) => ({
        id: interview.id,
        application_id: interview.application_id,
        interviewer_id: interview.interviewer_id,
        student_id: interview.student_id,
        scheduled_datetime: interview.scheduled_datetime,
        duration_minutes: interview.duration_minutes,
        mode: interview.mode,
        meeting_link: interview.meeting_link,
        location: interview.location,
        status: interview.status,
        interview_type: interview.interview_type,
        notes: interview.notes,
        feedback: interview.feedback,
        rating: interview.rating
      }));
    } catch (error) {
      console.error('Error fetching interviews:', error);
      return [];
    }
  }

  /**
   * Create a placement offer
   */
  async createOffer(offerData: Omit<PlacementOffer, 'id'>): Promise<number | null> {
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO placement_offers (
          application_id, student_id, company_id, position_title,
          offer_type, offer_details, offer_status, offer_date,
          response_deadline, contract_signed, contract_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        offerData.application_id,
        offerData.student_id,
        offerData.company_id,
        offerData.position_title,
        offerData.offer_type,
        offerData.offer_details,
        offerData.offer_status,
        offerData.offer_date,
        offerData.response_deadline,
        offerData.contract_signed ? 1 : 0,
        offerData.contract_details || null
      );
      
      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error creating offer:', error);
      return null;
    }
  }

  /**
   * Update offer status
   */
  async updateOfferStatus(offerId: number, status: 'DRAFT' | 'EXTENDED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED', acceptanceDate?: string, rejectionDate?: string, rejectionReason?: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare(`
        UPDATE placement_offers 
        SET offer_status = ?, acceptance_date = ?, rejection_date = ?, 
            rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(status, acceptanceDate || null, rejectionDate || null, rejectionReason || null, offerId);
      return true;
    } catch (error) {
      console.error('Error updating offer status:', error);
      return false;
    }
  }

  /**
   * Get offers for an application
   */
  async getOffers(applicationId: number): Promise<PlacementOffer[]> {
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM placement_offers
        WHERE application_id = ?
      `);
      
      return stmt.all(applicationId);
    } catch (error) {
      console.error('Error fetching offers:', error);
      return [];
    }
  }

  /**
   * Record feedback for an application
   */
  async recordFeedback(applicationId: number, supervisorId: number, rating: number, comments?: string): Promise<number | null> {
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO feedback (application_id, supervisor_id, rating, comments)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(applicationId, supervisorId, rating, comments || null);
      
      // Update tracking step for feedback
      const trackingSteps = await this.getTrackingSteps(applicationId);
      const feedbackStep = trackingSteps.find(step => step.step === 'Feedback Collection');
      
      if (feedbackStep) {
        await this.completeStep(feedbackStep.id!, 'Feedback received and recorded', supervisorId);
      }
      
      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error recording feedback:', error);
      return null;
    }
  }

  /**
   * Get resume view status
   */
  async getResumeViewStatus(applicationId: number): Promise<{ viewed: boolean; viewed_at?: string; viewer?: string } | null> {
    if (!this.db) return null;

    try {
      // Check if resume has been viewed by looking at tracking steps or resume access logs
      const stmt = this.db.prepare(`
        SELECT at.completed_at, u.name as viewer_name
        FROM application_tracking at
        LEFT JOIN users u ON at.actor_id = u.id
        WHERE at.application_id = ? AND at.step = 'Resume Review' AND at.status = 'COMPLETED'
      `);
      
      const result = stmt.get(applicationId);
      
      if (result) {
        return {
          viewed: true,
          viewed_at: result.completed_at,
          viewer: result.viewer_name
        };
      }
      
      return {
        viewed: false
      };
    } catch (error) {
      console.error('Error checking resume view status:', error);
      return null;
    }
  }

  /**
   * Mark resume as viewed
   */
  async markResumeViewed(applicationId: number, viewerId: number): Promise<boolean> {
    if (!this.db) return false;

    try {
      // Get the resume review tracking step
      const stmt = this.db.prepare(`
        SELECT id FROM application_tracking
        WHERE application_id = ? AND step = 'Resume Review'
      `);
      
      const step = stmt.get(applicationId);
      
      if (step) {
        return await this.completeStep(step.id, 'Resume viewed by employer', viewerId);
      }
      
      return false;
    } catch (error) {
      console.error('Error marking resume as viewed:', error);
      return false;
    }
  }

  /**
   * Sync application timelines with calendar events
   */
  async syncApplicationTimeline(applicationId: number, studentId: number): Promise<boolean> {
    const calendarService = new (await import('./calendar-service')).CalendarService();
    return await calendarService.syncApplicationTimeline(applicationId, studentId);
  }
}