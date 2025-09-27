// Enhanced Recommendation Engine with Real-time Notifications
// Builds upon the existing recommendation engine with notification capabilities

import { getDatabase } from './database';
import { RecommendationEngine } from './recommendation-engine';

export interface RecommendationNotification {
  id: number;
  user_id: number;
  internship_id: number;
  recommendation_score: number;
  match_reasons: string[];
  skill_match_percentage: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notification_sent: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  minimum_score: number;
  preferred_times: string[]; // ['09:00', '14:00', '18:00']
  frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY';
}

export class EnhancedRecommendationEngine extends RecommendationEngine {
  private db: any;

  constructor() {
    super();
    this.db = getDatabase();
  }

  /**
   * Process new internship and notify eligible students
   */
  async processNewInternship(internshipId: number): Promise<{
    total_students_notified: number;
    high_priority_matches: number;
    notifications_sent: number;
  }> {
    try {
      // Get internship details
      const internship = await this.getInternshipForRecommendation(internshipId);
      if (!internship) {
        return { total_students_notified: 0, high_priority_matches: 0, notifications_sent: 0 };
      }

      // Get eligible students from the same departments
      const eligibleStudents = await this.getEligibleStudents(internship.eligible_departments);
      
      let totalNotified = 0;
      let highPriorityMatches = 0;
      let notificationsSent = 0;

      for (const student of eligibleStudents) {
        // Calculate recommendation score
        const recommendation = RecommendationEngine.calculateMatchScore(student, internship);
        
        if (recommendation.score > 0) {
          totalNotified++;
          
          // Determine priority based on score
          let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
          if (recommendation.score >= 80) {
            priority = 'HIGH';
            highPriorityMatches++;
          } else if (recommendation.score >= 60) {
            priority = 'MEDIUM';
          }
          
          // Create recommendation notification
          await this.createRecommendationNotification({
            user_id: student.id,
            internship_id: internshipId,
            recommendation_score: recommendation.score,
            match_reasons: recommendation.match_reasons,
            skill_match_percentage: recommendation.skill_match_percentage,
            priority
          });
          
          // Send immediate notification if high priority or user preferences allow
          const shouldSendNotification = await this.shouldSendNotification(student.id, recommendation.score, priority);
          
          if (shouldSendNotification) {
            await this.sendRecommendationNotification(student.id, internshipId, recommendation, priority);
            notificationsSent++;
          }
        }
      }

      return {
        total_students_notified: totalNotified,
        high_priority_matches: highPriorityMatches,
        notifications_sent: notificationsSent
      };
    } catch (error) {
      console.error('Error processing new internship for recommendations:', error);
      return { total_students_notified: 0, high_priority_matches: 0, notifications_sent: 0 };
    }
  }

  /**
   * Get personalized recommendations for a student with real-time updates
   */
  async getPersonalizedRecommendations(
    studentId: number, 
    includeRecent: boolean = true,
    limit: number = 10
  ): Promise<{
    recommendations: any[];
    new_count: number;
    total_score: number;
    trending_matches: any[];
  }> {
    try {
      const student = await this.getStudentForRecommendation(studentId);
      if (!student) {
        return { recommendations: [], new_count: 0, total_score: 0, trending_matches: [] };
      }

      // Get available internships
      const availableInternships = await this.getAvailableInternships(student.department);
      
      // Get recommendations using base class method
      const recommendations = RecommendationEngine.getRecommendations(student, availableInternships, limit);
      
      // Enhance with additional data
      const enhancedRecommendations = await Promise.all(
        recommendations.map(async (rec) => {
          const internship = availableInternships.find(i => i.id === rec.internship_id);
          const applicationCount = await this.getApplicationCount(rec.internship_id);
          const isNew = await this.isNewInternship(rec.internship_id);
          
          return {
            ...rec,
            internship_details: internship,
            application_count: applicationCount,
            is_new: isNew,
            trending_score: this.calculateTrendingScore(internship, applicationCount)
          };
        })
      );
      
      // Get new recommendations count
      const newCount = enhancedRecommendations.filter(r => r.is_new).length;
      
      // Calculate total potential score
      const totalScore = enhancedRecommendations.reduce((sum, r) => sum + r.score, 0);
      
      // Get trending matches (high application activity)
      const trendingMatches = enhancedRecommendations
        .filter(r => r.trending_score > 70)
        .slice(0, 3);
      
      return {
        recommendations: enhancedRecommendations,
        new_count: newCount,
        total_score: totalScore,
        trending_matches: trendingMatches
      };
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return { recommendations: [], new_count: 0, total_score: 0, trending_matches: [] };
    }
  }

  /**
   * Update student profile and trigger recommendation refresh
   */
  async updateStudentAndRefreshRecommendations(studentId: number, profileUpdates: any): Promise<{
    updated: boolean;
    new_recommendations: number;
    improved_matches: number;
  }> {
    try {
      // Update student profile (this would be handled by ProfileManager)
      // Here we just trigger recommendation refresh
      
      // Get updated student data
      const student = await this.getStudentForRecommendation(studentId);
      if (!student) {
        return { updated: false, new_recommendations: 0, improved_matches: 0 };
      }

      // Get current recommendations
      const oldRecommendations = await this.getStoredRecommendations(studentId);
      
      // Generate new recommendations
      const newRecsData = await this.getPersonalizedRecommendations(studentId, true, 20);
      
      // Compare and find improvements
      const improvedMatches = this.compareRecommendations(oldRecommendations, newRecsData.recommendations);
      
      // Store new recommendations
      await this.storeRecommendations(studentId, newRecsData.recommendations);
      
      // Send notification about profile improvement impact
      if (improvedMatches > 0) {
        await this.sendProfileImprovementNotification(studentId, improvedMatches);
      }
      
      return {
        updated: true,
        new_recommendations: newRecsData.new_count,
        improved_matches: improvedMatches
      };
    } catch (error) {
      console.error('Error updating student recommendations:', error);
      return { updated: false, new_recommendations: 0, improved_matches: 0 };
    }
  }

  /**
   * Get real-time notification feed for a student
   */
  async getNotificationFeed(studentId: number, limit: number = 20): Promise<{
    notifications: any[];
    unread_count: number;
    priority_count: number;
  }> {
    try {
      const notifications = this.db.prepare(`
        SELECT 
          n.*,
          i.title as internship_title,
          i.company_name,
          i.stipend_max,
          i.location
        FROM notifications n
        LEFT JOIN internships i ON n.data LIKE '%\"internship_id\":' || i.id || '%'
        WHERE n.user_id = ? AND n.type IN ('APPLICATION', 'RECOMMENDATION')
        ORDER BY n.created_at DESC
        LIMIT ?
      `).all(studentId, limit);
      
      const unreadCount = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0
      `).get(studentId)?.count || 0;
      
      const priorityCount = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0 AND data LIKE '%\"priority\":\"HIGH\"%'
      `).get(studentId)?.count || 0;
      
      return {
        notifications: notifications.map((n: any) => ({
          ...n,
          data: n.data ? JSON.parse(n.data) : {}
        })),
        unread_count: unreadCount,
        priority_count: priorityCount
      };
    } catch (error) {
      console.error('Error getting notification feed:', error);
      return { notifications: [], unread_count: 0, priority_count: 0 };
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(studentId: number, notificationIds?: number[]): Promise<boolean> {
    try {
      let query = 'UPDATE notifications SET is_read = 1 WHERE user_id = ?';
      const params = [studentId];
      
      if (notificationIds && notificationIds.length > 0) {
        query += ` AND id IN (${notificationIds.map(() => '?').join(', ')})`;
        params.push(...notificationIds);
      }
      
      this.db.prepare(query).run(...params);
      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }

  // Private helper methods
  
  private async getInternshipForRecommendation(internshipId: number): Promise<any> {
    const internship = this.db.prepare(`
      SELECT * FROM internships WHERE id = ? AND is_active = 1
    `).get(internshipId);
    
    if (internship) {
      return {
        ...internship,
        required_skills: JSON.parse(internship.required_skills || '[]'),
        eligible_departments: JSON.parse(internship.eligible_departments || '[]')
      };
    }
    return null;
  }
  
  private async getEligibleStudents(departments: string[]): Promise<any[]> {
    const deptConditions = departments.map(() => 'department = ?').join(' OR ');
    const query = `
      SELECT * FROM users 
      WHERE role = 'STUDENT' AND placement_status = 'AVAILABLE'
      AND (${deptConditions})
    `;
    
    const students = this.db.prepare(query).all(...departments);
    
    return students.map((student: any) => ({
      ...student,
      skills: JSON.parse(student.skills || '[]'),
      preferences: JSON.parse(student.preferences || '{}')
    }));
  }
  
  private async createRecommendationNotification(data: Omit<RecommendationNotification, 'id' | 'notification_sent' | 'created_at'>): Promise<void> {
    this.db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      data.user_id,
      'RECOMMENDATION',
      'New Internship Match Found!',
      `We found a ${data.priority.toLowerCase()} priority internship match with ${data.recommendation_score}% compatibility.`,
      JSON.stringify({
        internship_id: data.internship_id,
        score: data.recommendation_score,
        match_reasons: data.match_reasons,
        skill_match: data.skill_match_percentage,
        priority: data.priority
      })
    );
  }
  
  private async shouldSendNotification(studentId: number, score: number, priority: string): Promise<boolean> {
    // Check user notification preferences
    const preferences = await this.getNotificationPreferences(studentId);
    
    if (!preferences.email_enabled && !preferences.push_enabled) {
      return false;
    }
    
    if (score < preferences.minimum_score) {
      return false;
    }
    
    if (priority === 'HIGH') {
      return true; // Always send high priority
    }
    
    if (preferences.frequency === 'IMMEDIATE') {
      return true;
    }
    
    // For daily/weekly, check if it's time to send
    return this.isTimeToSend(preferences);
  }
  
  private async getNotificationPreferences(studentId: number): Promise<NotificationPreferences> {
    // Default preferences - would be stored in user preferences
    return {
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false,
      minimum_score: 50,
      preferred_times: ['09:00', '14:00', '18:00'],
      frequency: 'IMMEDIATE'
    };
  }
  
  private isTimeToSend(preferences: NotificationPreferences): boolean {
    // Simple time check - in production would be more sophisticated
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return preferences.preferred_times.some(time => {
      const [hour, minute] = time.split(':').map(Number);
      const prefTime = new Date();
      prefTime.setHours(hour, minute, 0, 0);
      
      const timeDiff = Math.abs(now.getTime() - prefTime.getTime());
      return timeDiff < 30 * 60 * 1000; // Within 30 minutes
    });
  }
  
  private async sendRecommendationNotification(studentId: number, internshipId: number, recommendation: any, priority: string): Promise<void> {
    // This would integrate with email service, push notifications, etc.
    console.log(`Sending ${priority} priority recommendation notification to student ${studentId} for internship ${internshipId}`);
    
    // Update notification as sent
    this.db.prepare(`
      UPDATE notifications 
      SET data = json_set(data, '$.notification_sent', 1)
      WHERE user_id = ? AND data LIKE '%\"internship_id\":' || ? || '%'
      AND created_at > datetime('now', '-1 hour')
    `).run(studentId, internshipId);
  }
  
  private async getStudentForRecommendation(studentId: number): Promise<any> {
    const student = this.db.prepare('SELECT * FROM users WHERE id = ? AND role = \"STUDENT\"').get(studentId);
    
    if (student) {
      return {
        ...student,
        skills: JSON.parse(student.skills || '[]'),
        preferences: JSON.parse(student.preferences || '{}')
      };
    }
    return null;
  }
  
  private async getAvailableInternships(department: string): Promise<any[]> {
    const internships = this.db.prepare(`
      SELECT * FROM internships 
      WHERE is_active = 1 AND verification_status = 'VERIFIED'
      AND eligible_departments LIKE ?
      AND application_deadline > datetime('now')
      ORDER BY created_at DESC
    `).all(`%\"${department}\"%`);
    
    return internships.map((i: any) => ({
      ...i,
      required_skills: JSON.parse(i.required_skills || '[]'),
      eligible_departments: JSON.parse(i.eligible_departments || '[]')
    }));
  }
  
  private async getApplicationCount(internshipId: number): Promise<number> {
    const result = this.db.prepare(
      'SELECT COUNT(*) as count FROM applications WHERE internship_id = ?'
    ).get(internshipId);
    return result?.count || 0;
  }
  
  private async isNewInternship(internshipId: number): Promise<boolean> {
    const result = this.db.prepare(`
      SELECT created_at FROM internships 
      WHERE id = ? AND created_at > datetime('now', '-7 days')
    `).get(internshipId);
    return !!result;
  }
  
  private calculateTrendingScore(internship: any, applicationCount: number): number {
    const daysSincePosted = Math.floor(
      (Date.now() - new Date(internship.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const applicationsPerDay = daysSincePosted > 0 ? applicationCount / daysSincePosted : applicationCount;
    return Math.min(100, applicationsPerDay * 20); // Scale to 0-100
  }
  
  private async getStoredRecommendations(studentId: number): Promise<any[]> {
    // Would retrieve previously stored recommendations for comparison
    return [];
  }
  
  private async storeRecommendations(studentId: number, recommendations: any[]): Promise<void> {
    // Would store recommendations for future comparison
  }
  
  private compareRecommendations(oldRecs: any[], newRecs: any[]): number {
    // Compare recommendation scores and return count of improvements
    return newRecs.filter(newRec => 
      !oldRecs.find(oldRec => 
        oldRec.internship_id === newRec.internship_id && 
        oldRec.score >= newRec.score
      )
    ).length;
  }
  
  private async sendProfileImprovementNotification(studentId: number, improvedMatches: number): Promise<void> {
    this.db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      studentId,
      'GENERAL',
      'Profile Update Impact',
      `Great! Your profile updates improved ${improvedMatches} internship matches.`,
      JSON.stringify({ type: 'profile_improvement', improved_matches: improvedMatches })
    );
  }
}