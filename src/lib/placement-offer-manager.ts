// Placement Offer Management System
// Tracks process from application to signed offer with status notifications and deadlines

import { getDatabase } from './database';
import { BadgeManager } from './badge-manager';

export interface PlacementOffer {
  id?: number;
  application_id: number;
  student_id: number;
  company_id: number;
  position_title: string;
  offer_type: 'INTERNSHIP' | 'PLACEMENT' | 'FULL_TIME';
  offer_details: {
    salary?: number;
    stipend?: number;
    start_date: string;
    end_date?: string;
    location: string;
    work_mode: 'REMOTE' | 'ONSITE' | 'HYBRID';
    benefits?: string[];
    joining_bonus?: number;
  };
  offer_status: 'DRAFT' | 'EXTENDED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  offer_date: string;
  response_deadline: string;
  acceptance_date?: string;
  rejection_date?: string;
  rejection_reason?: string;
  contract_signed: boolean;
  contract_details?: {
    contract_url?: string;
    signed_date?: string;
    witness_details?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface OfferTrackingStep {
  id?: number;
  offer_id: number;
  step_name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completed_at?: string;
  completed_by?: number;
  notes?: string;
  documents_required?: string[];
  documents_submitted?: string[];
}

export interface OfferAnalytics {
  total_offers_extended: number;
  acceptance_rate: number;
  avg_response_time_days: number;
  offers_by_status: Record<string, number>;
  offers_by_company: Array<{ company: string; count: number; acceptance_rate: number }>;
  salary_insights: {
    avg_salary: number;
    min_salary: number;
    max_salary: number;
    by_department: Record<string, number>;
  };
}

export class PlacementOfferManager {
  private db: any;
  private badgeManager: BadgeManager;

  constructor() {
    this.db = getDatabase();
    this.badgeManager = new BadgeManager();
  }

  /**
   * Create and extend a new placement offer
   */
  async createOffer(offerData: Omit<PlacementOffer, 'id' | 'created_at' | 'updated_at'>): Promise<{
    success: boolean;
    offer_id?: number;
    message: string;
    tracking_steps?: OfferTrackingStep[];
  }> {
    try {
      // Validate application exists and is in appropriate status
      const application = await this.validateApplication(offerData.application_id);
      if (!application) {
        return { success: false, message: 'Application not found or not eligible for offer' };
      }

      // Check for existing offers
      const existingOffer = await this.getExistingOffer(offerData.application_id);
      if (existingOffer && existingOffer.offer_status !== 'REJECTED') {
        return { success: false, message: 'An active offer already exists for this application' };
      }

      // Create offer record
      const offerId = await this.insertOffer(offerData);
      if (!offerId) {
        return { success: false, message: 'Failed to create offer' };
      }

      // Initialize tracking steps
      const trackingSteps = await this.initializeOfferTracking(offerId);

      // Update application status
      await this.updateApplicationStatus(offerData.application_id, 'OFFERED');

      // Send notifications
      await this.sendOfferNotifications(offerId, offerData);

      // Award badges
      await this.badgeManager.checkAndAwardBadges(offerData.student_id, 'offer_received');

      return {
        success: true,
        offer_id: offerId,
        message: 'Offer extended successfully',
        tracking_steps: trackingSteps
      };
    } catch (error) {
      console.error('Error creating offer:', error);
      return { success: false, message: 'Internal error while creating offer' };
    }
  }

  /**
   * Process student response to offer
   */
  async processOfferResponse(
    offerId: number,
    studentId: number,
    response: 'ACCEPTED' | 'REJECTED',
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    next_steps?: string[];
  }> {
    try {
      const offer = await this.getOfferById(offerId);
      if (!offer || offer.student_id !== studentId) {
        return { success: false, message: 'Offer not found or access denied' };
      }

      if (offer.offer_status !== 'EXTENDED') {
        return { success: false, message: 'Offer is not in a state that allows response' };
      }

      // Check if response is within deadline
      const now = new Date();
      const deadline = new Date(offer.response_deadline);
      if (now > deadline) {
        return { success: false, message: 'Response deadline has passed' };
      }

      // Update offer status
      const updateData: any = {
        offer_status: response,
        updated_at: new Date().toISOString()
      };

      if (response === 'ACCEPTED') {
        updateData.acceptance_date = new Date().toISOString();
        // Update application status
        await this.updateApplicationStatus(offer.application_id, 'OFFER_ACCEPTED');
      } else {
        updateData.rejection_date = new Date().toISOString();
        updateData.rejection_reason = reason;
        // Update application status
        await this.updateApplicationStatus(offer.application_id, 'OFFER_REJECTED');
      }

      await this.updateOffer(offerId, updateData);

      // Update tracking
      await this.updateOfferTracking(offerId, response === 'ACCEPTED' ? 'Offer Accepted' : 'Offer Rejected');

      // Send notifications
      await this.sendResponseNotifications(offerId, response, reason);

      // Award badges and update placement status
      if (response === 'ACCEPTED') {
        await this.badgeManager.checkAndAwardBadges(studentId, 'offer_accepted');
        await this.updateStudentPlacementStatus(studentId, offer.offer_type === 'PLACEMENT' ? 'PLACED' : 'INTERNING');
        
        return {
          success: true,
          message: 'Offer accepted successfully!',
          next_steps: [
            'Contract signing process will begin',
            'HR will contact you with joining details',
            'Complete any pending documentation',
            'Prepare for onboarding process'
          ]
        };
      } else {
        return {
          success: true,
          message: 'Offer declined',
          next_steps: [
            'Continue applying for other opportunities',
            'Your application history remains intact',
            'Feedback will be shared with placement cell'
          ]
        };
      }
    } catch (error) {
      console.error('Error processing offer response:', error);
      return { success: false, message: 'Internal error while processing response' };
    }
  }

  /**
   * Get comprehensive offer details with tracking
   */
  async getOfferDetails(offerId: number, userId?: number): Promise<{
    offer: PlacementOffer;
    tracking_steps: OfferTrackingStep[];
    progress_percentage: number;
    time_remaining: string;
    company_details: any;
  }> {
    try {
      const offer = await this.getOfferById(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check access permissions
      if (userId && offer.student_id !== userId) {
        throw new Error('Access denied');
      }

      const trackingSteps = await this.getOfferTracking(offerId);
      const progressPercentage = this.calculateProgress(trackingSteps);
      const timeRemaining = this.calculateTimeRemaining(offer);
      const companyDetails = await this.getCompanyDetails(offer.company_id);

      return {
        offer,
        tracking_steps: trackingSteps,
        progress_percentage: progressPercentage,
        time_remaining: timeRemaining,
        company_details: companyDetails
      };
    } catch (error) {
      console.error('Error getting offer details:', error);
      throw error;
    }
  }

  /**
   * Get offer analytics and insights
   */
  async getOfferAnalytics(filters?: {
    department?: string;
    date_range?: { start: string; end: string };
    company?: string;
  }): Promise<OfferAnalytics> {
    try {
      let whereClause = '1=1';
      const params: any[] = [];

      if (filters?.department) {
        whereClause += ' AND u.department = ?';
        params.push(filters.department);
      }

      if (filters?.date_range) {
        whereClause += ' AND po.offer_date BETWEEN ? AND ?';
        params.push(filters.date_range.start, filters.date_range.end);
      }

      // Total offers and acceptance rate
      const overallStats = this.db.prepare(`
        SELECT 
          COUNT(*) as total_offers,
          COUNT(CASE WHEN offer_status = 'ACCEPTED' THEN 1 END) as accepted_offers,
          AVG(CASE WHEN acceptance_date IS NOT NULL 
              THEN julianday(acceptance_date) - julianday(offer_date) END) as avg_response_days
        FROM placement_offers po
        JOIN users u ON po.student_id = u.id
        WHERE ${whereClause}
      `).get(...params);

      const acceptanceRate = overallStats.total_offers > 0 
        ? (overallStats.accepted_offers / overallStats.total_offers) * 100 
        : 0;

      // Offers by status
      const statusStats = this.db.prepare(`
        SELECT offer_status, COUNT(*) as count
        FROM placement_offers po
        JOIN users u ON po.student_id = u.id
        WHERE ${whereClause}
        GROUP BY offer_status
      `).all(...params);

      const offersByStatus = statusStats.reduce((acc: Record<string, number>, stat: any) => {
        acc[stat.offer_status] = stat.count;
        return acc;
      }, {});

      // Company-wise analytics
      const companyStats = this.db.prepare(`
        SELECT 
          i.company_name as company,
          COUNT(*) as count,
          COUNT(CASE WHEN po.offer_status = 'ACCEPTED' THEN 1 END) as accepted_count
        FROM placement_offers po
        JOIN applications a ON po.application_id = a.id
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON po.student_id = u.id
        WHERE ${whereClause}
        GROUP BY i.company_name
        ORDER BY count DESC
      `).all(...params);

      const offersByCompany = companyStats.map((stat: any) => ({
        company: stat.company,
        count: stat.count,
        acceptance_rate: stat.count > 0 ? (stat.accepted_count / stat.count) * 100 : 0
      }));

      // Salary insights
      const salaryStats = this.db.prepare(`
        SELECT 
          AVG(CASE WHEN json_extract(offer_details, '$.salary') IS NOT NULL 
              THEN json_extract(offer_details, '$.salary') END) as avg_salary,
          MIN(CASE WHEN json_extract(offer_details, '$.salary') IS NOT NULL 
              THEN json_extract(offer_details, '$.salary') END) as min_salary,
          MAX(CASE WHEN json_extract(offer_details, '$.salary') IS NOT NULL 
              THEN json_extract(offer_details, '$.salary') END) as max_salary
        FROM placement_offers po
        JOIN users u ON po.student_id = u.id
        WHERE ${whereClause} AND json_extract(offer_details, '$.salary') IS NOT NULL
      `).get(...params);

      // Department-wise salary
      const deptSalaryStats = this.db.prepare(`
        SELECT 
          u.department,
          AVG(CASE WHEN json_extract(offer_details, '$.salary') IS NOT NULL 
              THEN json_extract(offer_details, '$.salary') END) as avg_salary
        FROM placement_offers po
        JOIN users u ON po.student_id = u.id
        WHERE ${whereClause} AND json_extract(offer_details, '$.salary') IS NOT NULL
        GROUP BY u.department
      `).all(...params);

      const salaryByDepartment = deptSalaryStats.reduce((acc: Record<string, number>, stat: any) => {
        acc[stat.department] = Math.round(stat.avg_salary || 0);
        return acc;
      }, {});

      return {
        total_offers_extended: overallStats.total_offers || 0,
        acceptance_rate: Math.round(acceptanceRate),
        avg_response_time_days: Math.round(overallStats.avg_response_days || 0),
        offers_by_status: offersByStatus,
        offers_by_company: offersByCompany,
        salary_insights: {
          avg_salary: Math.round(salaryStats.avg_salary || 0),
          min_salary: Math.round(salaryStats.min_salary || 0),
          max_salary: Math.round(salaryStats.max_salary || 0),
          by_department: salaryByDepartment
        }
      };
    } catch (error) {
      console.error('Error getting offer analytics:', error);
      return {
        total_offers_extended: 0,
        acceptance_rate: 0,
        avg_response_time_days: 0,
        offers_by_status: {},
        offers_by_company: [],
        salary_insights: {
          avg_salary: 0,
          min_salary: 0,
          max_salary: 0,
          by_department: {}
        }
      };
    }
  }

  // Private helper methods

  private async validateApplication(applicationId: number): Promise<any> {
    return this.db.prepare(`
      SELECT * FROM applications 
      WHERE id = ? AND status IN ('INTERVIEWED', 'EMPLOYER_REVIEW')
    `).get(applicationId);
  }

  private async getExistingOffer(applicationId: number): Promise<any> {
    return this.db.prepare(`
      SELECT * FROM placement_offers 
      WHERE application_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(applicationId);
  }

  private async insertOffer(offerData: Omit<PlacementOffer, 'id' | 'created_at' | 'updated_at'>): Promise<number | null> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO placement_offers (
          application_id, student_id, company_id, position_title, offer_type,
          offer_details, offer_status, offer_date, response_deadline,
          contract_signed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        offerData.application_id,
        offerData.student_id,
        offerData.company_id,
        offerData.position_title,
        offerData.offer_type,
        JSON.stringify(offerData.offer_details),
        offerData.offer_status,
        offerData.offer_date,
        offerData.response_deadline,
        offerData.contract_signed ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      );

      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error inserting offer:', error);
      return null;
    }
  }

  private async initializeOfferTracking(offerId: number): Promise<OfferTrackingStep[]> {
    const steps = [
      { step_name: 'Offer Extended', status: 'COMPLETED' as const },
      { step_name: 'Student Response', status: 'PENDING' as const },
      { step_name: 'Contract Preparation', status: 'PENDING' as const },
      { step_name: 'Contract Signing', status: 'PENDING' as const },
      { step_name: 'Documentation Complete', status: 'PENDING' as const },
      { step_name: 'Onboarding Scheduled', status: 'PENDING' as const }
    ];

    const stmt = this.db.prepare(`
      INSERT INTO offer_tracking_steps (offer_id, step_name, status, completed_at)
      VALUES (?, ?, ?, ?)
    `);

    const trackingSteps: OfferTrackingStep[] = [];
    
    steps.forEach(step => {
      const result = stmt.run(
        offerId,
        step.step_name,
        step.status,
        step.status === 'COMPLETED' ? new Date().toISOString() : null
      );
      
      trackingSteps.push({
        id: result.lastInsertRowid as number,
        offer_id: offerId,
        ...step
      });
    });

    return trackingSteps;
  }

  private async updateApplicationStatus(applicationId: number, status: string): Promise<void> {
    this.db.prepare('UPDATE applications SET status = ?, updated_at = ? WHERE id = ?')
           .run(status, new Date().toISOString(), applicationId);
  }

  private async sendOfferNotifications(offerId: number, offerData: any): Promise<void> {
    // Send notification to student
    this.db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      offerData.student_id,
      'OFFER',
      'Congratulations! You received an offer',
      `You have received an offer for ${offerData.position_title}. Please review and respond by the deadline.`,
      JSON.stringify({ offer_id: offerId, type: 'offer_received' })
    );
  }

  private async getOfferById(offerId: number): Promise<PlacementOffer | null> {
    const offer = this.db.prepare('SELECT * FROM placement_offers WHERE id = ?').get(offerId);
    if (offer) {
      return {
        ...offer,
        offer_details: JSON.parse(offer.offer_details || '{}'),
        contract_details: offer.contract_details ? JSON.parse(offer.contract_details) : undefined
      };
    }
    return null;
  }

  private async updateOffer(offerId: number, updateData: any): Promise<void> {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    this.db.prepare(`UPDATE placement_offers SET ${fields} WHERE id = ?`).run(...values, offerId);
  }

  private async updateOfferTracking(offerId: number, stepName: string): Promise<void> {
    this.db.prepare(`
      UPDATE offer_tracking_steps 
      SET status = 'COMPLETED', completed_at = ? 
      WHERE offer_id = ? AND step_name = ?
    `).run(new Date().toISOString(), offerId, stepName);
  }

  private async sendResponseNotifications(offerId: number, response: string, reason?: string): Promise<void> {
    // Implementation for sending notifications about offer response
    console.log(`Offer ${offerId} response: ${response}`, reason);
  }

  private async updateStudentPlacementStatus(studentId: number, status: string): Promise<void> {
    this.db.prepare('UPDATE users SET placement_status = ? WHERE id = ?').run(status, studentId);
  }

  private async getOfferTracking(offerId: number): Promise<OfferTrackingStep[]> {
    return this.db.prepare(`
      SELECT * FROM offer_tracking_steps 
      WHERE offer_id = ? 
      ORDER BY id ASC
    `).all(offerId);
  }

  private calculateProgress(steps: OfferTrackingStep[]): number {
    const completedSteps = steps.filter(step => step.status === 'COMPLETED').length;
    return Math.round((completedSteps / steps.length) * 100);
  }

  private calculateTimeRemaining(offer: PlacementOffer): string {
    if (offer.offer_status !== 'EXTENDED') return 'N/A';
    
    const deadline = new Date(offer.response_deadline);
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Expired';
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  }

  private async getCompanyDetails(companyId: number): Promise<any> {
    // Mock company details - in production, get from companies table
    return {
      id: companyId,
      name: 'Technology Corp',
      industry: 'Technology',
      size: '1000+ employees',
      location: 'Multiple locations'
    };
  }
}