// Badge Management System for Internship Portal
// Handles badge earning, verification, and management

import { getDatabase } from './database';

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  criteria: any; // JSON criteria
  points: number;
  badge_type: 'SKILL' | 'ACHIEVEMENT' | 'MILESTONE' | 'RECOGNITION';
  is_active: boolean;
  created_at: string;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  earned_at: string;
  verification_data: any; // JSON with verification details
  badge: Badge;
}

export interface BadgeEarningCriteria {
  skill?: string;
  skills?: string[];
  projects?: number;
  rating?: number;
  applications?: number;
  interviews_completed?: number;
  offers_received?: number;
  feedback_rating?: number;
  skills_count?: number;
  profile_completion?: number;
  internships_completed?: number;
  quick_application?: boolean;
  early_application?: boolean;
  placement_secured?: boolean;
  mentor_recommendation?: boolean;
  performance_rank?: string;
  leadership_role?: boolean;
  department_recognition?: boolean;
  innovation_project?: boolean;
  teamwork_rating?: number;
  problem_solving?: boolean;
  client_rating?: number;
  learning_speed?: string;
  // New employer criteria
  offers_made?: number;
  quick_response?: boolean;
}

export class BadgeManager {
  private db: any;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Get all available badges
   */
  async getAllBadges(): Promise<Badge[]> {
    const query = `
      SELECT * FROM badges 
      WHERE is_active = 1 
      ORDER BY badge_type, points DESC
    `;
    return this.db.prepare(query).all() as Badge[];
  }

  /**
   * Get badges earned by a user
   */
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    const query = `
      SELECT ub.*, b.name, b.description, b.icon, b.points, b.badge_type
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC
    `;
    return this.db.prepare(query).all(userId) as UserBadge[];
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(
    userId: number, 
    badgeId: number, 
    verificationData: any = {}
  ): Promise<boolean> {
    try {
      // Check if user already has this badge
      const existing = this.db.prepare(
        'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?'
      ).get(userId, badgeId);

      if (existing) {
        return false; // Already has this badge
      }

      // Award the badge
      const insert = this.db.prepare(`
        INSERT INTO user_badges (user_id, badge_id, verification_data)
        VALUES (?, ?, ?)
      `);
      
      insert.run(userId, badgeId, JSON.stringify(verificationData));

      // Create notification
      await this.createBadgeNotification(userId, badgeId);

      return true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  }

  /**
   * Check and award eligible badges for a user
   */
  async checkAndAwardBadges(userId: number, triggerEvent?: string): Promise<Badge[]> {
    const awardedBadges: Badge[] = [];
    
    try {
      // Get user data for evaluation
      const userData = await this.getUserDataForBadgeEvaluation(userId);
      
      // Get all badges that user doesn't have yet
      const availableBadges = this.db.prepare(`
        SELECT b.* FROM badges b
        WHERE b.is_active = 1
        AND b.id NOT IN (
          SELECT badge_id FROM user_badges WHERE user_id = ?
        )
      `).all(userId) as Badge[];

      // Check each badge criteria
      for (const badge of availableBadges) {
        if (await this.evaluateBadgeCriteria(badge, userData)) {
          const awarded = await this.awardBadge(userId, badge.id, {
            trigger_event: triggerEvent,
            evaluation_date: new Date().toISOString(),
            user_data_snapshot: userData
          });
          
          if (awarded) {
            awardedBadges.push(badge);
          }
        }
      }

      return awardedBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  /**
   * Get user data needed for badge evaluation
   */
  private async getUserDataForBadgeEvaluation(userId: number): Promise<any> {
    // Get user profile
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    // Get application stats
    const appStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'OFFERED' THEN 1 END) as offers_received,
        COUNT(CASE WHEN status = 'INTERVIEWED' THEN 1 END) as interviews_completed,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as internships_completed
      FROM applications WHERE student_id = ?
    `).get(userId);

    // Get feedback stats
    const feedbackStats = this.db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as feedback_count
      FROM feedback f
      JOIN applications a ON f.application_id = a.id
      WHERE a.student_id = ?
    `).get(userId);

    // Calculate profile completion
    const profileCompletion = this.calculateProfileCompletion(user);
    
    // Get skills count
    const skills = user?.skills ? JSON.parse(user.skills) : [];
    
    // For employers, get offer stats
    let employerStats = {};
    if (user?.role === 'EMPLOYER') {
      const offerStats = this.db.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'OFFERED' THEN 1 END) as offers_made,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as internships_completed
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE i.posted_by = ?
      `).get(userId);
      
      employerStats = {
        offers_made: offerStats?.offers_made || 0,
        internships_completed: offerStats?.internships_completed || 0
      };
    }
    
    return {
      ...user,
      ...appStats,
      avg_rating: feedbackStats?.avg_rating || 0,
      feedback_count: feedbackStats?.feedback_count || 0,
      profile_completion: profileCompletion,
      skills_count: skills.length,
      skills_list: skills,
      ...employerStats
    };
  }

  /**
   * Evaluate if user meets badge criteria
   */
  private async evaluateBadgeCriteria(badge: Badge, userData: any): Promise<boolean> {
    try {
      const criteria: BadgeEarningCriteria = JSON.parse(badge.criteria);
      
      // Check each criterion
      if (criteria.applications && userData.total_applications < criteria.applications) return false;
      if (criteria.interviews_completed && userData.interviews_completed < criteria.interviews_completed) return false;
      if (criteria.offers_received && userData.offers_received < criteria.offers_received) return false;
      if (criteria.internships_completed && userData.internships_completed < criteria.internships_completed) return false;
      if (criteria.feedback_rating && userData.avg_rating < criteria.feedback_rating) return false;
      if (criteria.skills_count && userData.skills_count < criteria.skills_count) return false;
      if (criteria.profile_completion && userData.profile_completion < criteria.profile_completion) return false;
      
      // New employer criteria
      if (criteria.offers_made && userData.offers_made < criteria.offers_made) return false;
      
      // Check skill-based criteria
      if (criteria.skill) {
        const hasSkill = userData.skills_list.some((skill: string) => 
          skill.toLowerCase().includes(criteria.skill!.toLowerCase())
        );
        if (!hasSkill) return false;
      }
      
      if (criteria.skills) {
        const hasAllSkills = criteria.skills.every(requiredSkill => 
          userData.skills_list.some((userSkill: string) => 
            userSkill.toLowerCase().includes(requiredSkill.toLowerCase())
          )
        );
        if (!hasAllSkills) return false;
      }
      
      // Special checks
      if (criteria.placement_secured) {
        if (userData.placement_status !== 'PLACED') return false;
      }
      
      if (criteria.quick_response) {
        // This would be checked in real-time when employer reviews applications quickly
        // For now, we'll assume it's checked elsewhere
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error evaluating badge criteria:', error);
      return false;
    }
  }

  /**
   * Calculate profile completion percentage
   */
  private calculateProfileCompletion(user: any): number {
    const fields = [
      'name', 'email', 'department', 'current_semester', 
      'skills', 'resume', 'cover_letter', 'phone', 
      'linkedin_url', 'cgpa', 'graduation_year'
    ];
    
    const completedFields = fields.filter(field => 
      user[field] && user[field].toString().trim() !== ''
    ).length;
    
    return Math.round((completedFields / fields.length) * 100);
  }

  /**
   * Create notification for badge award
   */
  private async createBadgeNotification(userId: number, badgeId: number): Promise<void> {
    const badge = this.db.prepare('SELECT * FROM badges WHERE id = ?').get(badgeId) as Badge;
    
    if (badge) {
      this.db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        'BADGE',
        'New Badge Earned!',
        `Congratulations! You've earned the \"${badge.name}\" badge worth ${badge.points} points.`,
        JSON.stringify({ badge_id: badgeId, badge_name: badge.name, points: badge.points })
      );
    }
  }

  /**
   * Get badge statistics for a user
   */
  async getUserBadgeStats(userId: number): Promise<{
    total_badges: number;
    total_points: number;
    badges_by_type: Record<string, number>;
    recent_badges: UserBadge[];
  }> {
    const badges = await this.getUserBadges(userId);
    
    const stats = {
      total_badges: badges.length,
      total_points: badges.reduce((sum, badge) => sum + (badge.badge?.points || 0), 0),
      badges_by_type: badges.reduce((acc, badge) => {
        const type = badge.badge?.badge_type || 'UNKNOWN';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent_badges: badges.slice(0, 5) // Last 5 badges
    };
    
    return stats;
  }

  /**
   * Get leaderboard based on badge points
   */
  async getBadgeLeaderboard(limit: number = 10, department?: string): Promise<any[]> {
    let query = `
      SELECT 
        u.id, u.name, u.department,
        COUNT(ub.id) as badge_count,
        COALESCE(SUM(b.points), 0) as total_points
      FROM users u
      LEFT JOIN user_badges ub ON u.id = ub.user_id
      LEFT JOIN badges b ON ub.badge_id = b.id
      WHERE u.role = 'STUDENT'
    `;
    
    const params: any[] = [];
    
    if (department) {
      query += ' AND u.department = ?';
      params.push(department);
    }
    
    query += `
      GROUP BY u.id, u.name, u.department
      ORDER BY total_points DESC, badge_count DESC
      LIMIT ?
    `;
    
    params.push(limit);
    
    return this.db.prepare(query).all(...params);
  }

  /**
   * Initialize default badges if they don't exist
   */
  async initializeDefaultBadges(): Promise<void> {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM badges').get() as { count: number };
    
    if (count.count === 0) {
      // Run the initial badges SQL
      const fs = require('fs');
      const path = require('path');
      
      try {
        const badgesSQL = fs.readFileSync(
          path.join(process.cwd(), 'database', 'initial-badges.sql'), 
          'utf8'
        );
        
        // Execute each statement
        const statements = badgesSQL.split(';').filter((stmt: string) => stmt.trim());
        statements.forEach((stmt: string) => {
          if (stmt.trim()) {
            this.db.exec(stmt);
          }
        });
        
        console.log('Default badges initialized successfully');
      } catch (error) {
        console.error('Error initializing default badges:', error);
      }
    }
  }
}