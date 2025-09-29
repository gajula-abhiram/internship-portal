// Enhanced Profile Management System
// Handles comprehensive student profiles with cover letters, resumes, and skills

import { getDatabase } from './database';
import { BadgeManager } from './badge-manager';
import { CertificateGenerator } from './certificate-generator';

export interface StudentProfile {
  id: number;
  username: string;
  role: string;
  name: string;
  email: string;
  department: string;
  current_semester: number;
  skills: string[];
  resume: string;
  cover_letter: string;
  profile_picture: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  cgpa: number;
  graduation_year: number;
  employability_score: number;
  placement_status: 'AVAILABLE' | 'PLACED' | 'INTERNING';
  preferences: any;
  created_at: string;
  updated_at: string;
}

export interface ProfileCompletionStatus {
  percentage: number;
  missing_fields: string[];
  completed_sections: string[];
  recommendations: string[];
}

export interface EmployabilityMetrics {
  score: number;
  factors: {
    profile_completion: number;
    skills_relevance: number;
    application_success_rate: number;
    feedback_ratings: number;
    badge_points: number;
  };
  recommendations: string[];
  industry_readiness: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export class ProfileManager {
  private db: any;
  private badgeManager: BadgeManager;

  constructor() {
    this.db = getDatabase();
    this.badgeManager = new BadgeManager();
  }

  /**
   * Get complete student profile with analytics
   */
  async getStudentProfile(userId: number): Promise<{
    profile: StudentProfile;
    completion: ProfileCompletionStatus;
    employability: EmployabilityMetrics;
    badges: any[];
    stats: any;
    certificates: any[];
  }> {
    try {
      // Get basic profile
      const profile = await this.getBasicProfile(userId);
      
      // Get completion status
      const completion = this.calculateProfileCompletion(profile);
      
      // Get employability metrics
      const employability = await this.calculateEmployabilityScore(userId);
      
      // Get badges
      const badges = await this.badgeManager.getUserBadges(userId);
      
      // Get profile statistics
      const stats = await this.getProfileStatistics(userId);
      
      // Get certificates
      const certificates = await CertificateGenerator.getUserCertificates(userId);
      
      return {
        profile,
        completion,
        employability,
        badges,
        stats,
        certificates
      };
    } catch (error) {
      console.error('Error getting student profile:', error);
      throw error;
    }
  }

  /**
   * Update student profile
   */
  async updateProfile(userId: number, updates: Partial<StudentProfile>): Promise<boolean> {
    try {
      const fields = [];
      const values = [];
      
      // Handle each field update
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          fields.push(`${key} = ?`);
          
          // Handle JSON fields
          if (key === 'skills' && Array.isArray(value)) {
            values.push(JSON.stringify(value));
          } else if (key === 'preferences' && typeof value === 'object') {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      });
      
      if (fields.length === 0) {
        return false;
      }
      
      // Add updated_at timestamp
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(userId);
      
      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = ?
      `;
      
      this.db.prepare(query).run(...values);
      
      // Update employability score
      await this.updateEmployabilityScore(userId);
      
      // Check for new badges
      await this.badgeManager.checkAndAwardBadges(userId, 'profile_update');
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  /**
   * Notify students about internships in other departments
   */
  async notifyCrossDepartmentInternships(userId: number): Promise<void> {
    try {
      const studentProfile = await this.getBasicProfile(userId);
      
      // Get internships from other departments
      const crossDepartmentInternships = this.db.prepare(`
        SELECT i.*, u.name as posted_by_name, u.department as company_department
        FROM internships i
        JOIN users u ON i.posted_by = u.id
        WHERE i.is_active = 1
        AND i.application_deadline > datetime('now')
        AND u.department != ?
        AND i.id NOT IN (
          SELECT internship_id FROM applications WHERE student_id = ?
        )
        ORDER BY i.created_at DESC
        LIMIT 5
      `).all(studentProfile.department, userId) as any[];
      
      // If there are internships in other departments, notify the student
      if (crossDepartmentInternships.length > 0) {
        // For now, we'll just log this - in a real implementation, 
        // this would send notifications to the student
        console.log(`Found ${crossDepartmentInternships.length} internships in other departments for student ${userId}`);
        
        // In a real implementation, we would send notifications here
        // For example:
        // await NotificationService.notifyCrossDepartmentOpportunities(userId, crossDepartmentInternships);
      }
    } catch (error) {
      console.error('Error checking cross-department internships:', error);
    }
  }

  /**
   * Get basic profile data
   */
  private async getBasicProfile(userId: number): Promise<StudentProfile> {
    const query = 'SELECT * FROM users WHERE id = ?';
    const user = this.db.prepare(query).get(userId) as any;
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Parse JSON fields
    return {
      ...user,
      skills: user.skills ? JSON.parse(user.skills) : [],
      preferences: user.preferences ? JSON.parse(user.preferences) : {}
    };
  }

  /**
   * Calculate profile completion status
   */
  private calculateProfileCompletion(profile: StudentProfile): ProfileCompletionStatus {
    const requiredFields = {
      'Basic Information': ['name', 'email', 'phone'],
      'Academic Details': ['department', 'current_semester', 'cgpa', 'graduation_year'],
      'Professional Profile': ['resume', 'cover_letter', 'skills'],
      'Online Presence': ['linkedin_url'],
      'Optional': ['github_url', 'profile_picture']
    };
    
    const missingFields: string[] = [];
    const completedSections: string[] = [];
    let totalFields = 0;
    let completedFields = 0;
    
    Object.entries(requiredFields).forEach(([section, fields]) => {
      let sectionComplete = true;
      
      fields.forEach(field => {
        totalFields++;
        const value = (profile as any)[field];
        
        if (value && value.toString().trim() !== '') {
          // Special handling for arrays
          if (field === 'skills' && Array.isArray(value) && value.length > 0) {
            completedFields++;
          } else if (field !== 'skills') {
            completedFields++;
          } else {
            missingFields.push(field);
            sectionComplete = false;
          }
        } else {
          missingFields.push(field);
          if (section !== 'Optional') {
            sectionComplete = false;
          }
        }
      });
      
      if (sectionComplete || section === 'Optional') {
        completedSections.push(section);
      }
    });
    
    const percentage = Math.round((completedFields / totalFields) * 100);
    
    const recommendations = [];
    if (missingFields.includes('resume')) {
      recommendations.push('Upload your resume to increase visibility to employers');
    }
    if (missingFields.includes('cover_letter')) {
      recommendations.push('Add a compelling cover letter to stand out');
    }
    if (missingFields.includes('skills') || (profile.skills && profile.skills.length < 5)) {
      recommendations.push('Add more relevant skills to improve matching');
    }
    if (missingFields.includes('linkedin_url')) {
      recommendations.push('Add your LinkedIn profile to enhance professional presence');
    }
    
    return {
      percentage,
      missing_fields: missingFields,
      completed_sections: completedSections,
      recommendations
    };
  }

  /**
   * Calculate employability score
   */
  private async calculateEmployabilityScore(userId: number): Promise<EmployabilityMetrics> {
    try {
      const profile = await this.getBasicProfile(userId);
      
      // Get application statistics
      const appStats = this.db.prepare(`
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN status IN ('OFFERED', 'OFFER_ACCEPTED') THEN 1 END) as successful_applications,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_internships
        FROM applications WHERE student_id = ?
      `).get(userId) as any;
      
      // Get feedback ratings
      const feedbackStats = this.db.prepare(`
        SELECT AVG(rating) as avg_rating, COUNT(*) as feedback_count
        FROM feedback f
        JOIN applications a ON f.application_id = a.id
        WHERE a.student_id = ?
      `).get(userId) as any;
      
      // Get badge points
      const badgeStats = await this.badgeManager.getUserBadgeStats(userId);
      
      // Calculate individual factors (0-100 scale)
      const factors = {
        profile_completion: this.calculateProfileCompletion(profile).percentage,
        skills_relevance: this.calculateSkillsRelevance(profile.skills),
        application_success_rate: this.calculateSuccessRate(appStats),
        feedback_ratings: this.calculateFeedbackScore(feedbackStats),
        badge_points: Math.min(100, (badgeStats.total_points / 500) * 100) // Max 500 points = 100%
      };
      
      // Weighted average for overall score
      const weights = {
        profile_completion: 0.25,
        skills_relevance: 0.25,
        application_success_rate: 0.20,
        feedback_ratings: 0.20,
        badge_points: 0.10
      };
      
      const score = Object.entries(factors).reduce((sum, [key, value]) => {
        return sum + (value * weights[key as keyof typeof weights]);
      }, 0);
      
      // Determine industry readiness
      let industry_readiness: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
      if (score >= 90) industry_readiness = 'EXPERT';
      else if (score >= 75) industry_readiness = 'ADVANCED';
      else if (score >= 60) industry_readiness = 'INTERMEDIATE';
      else industry_readiness = 'BEGINNER';
      
      // Generate recommendations
      const recommendations = this.generateEmployabilityRecommendations(factors, appStats);
      
      return {
        score: Math.round(score),
        factors,
        recommendations,
        industry_readiness
      };
    } catch (error) {
      console.error('Error calculating employability score:', error);
      return {
        score: 0,
        factors: {
          profile_completion: 0,
          skills_relevance: 0,
          application_success_rate: 0,
          feedback_ratings: 0,
          badge_points: 0
        },
        recommendations: ['Complete your profile to get personalized recommendations'],
        industry_readiness: 'BEGINNER'
      };
    }
  }

  /**
   * Calculate skills relevance based on current industry trends
   */
  private calculateSkillsRelevance(skills: string[]): number {
    if (!skills || skills.length === 0) return 0;
    
    const trendingSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'SQL',
      'AWS', 'Docker', 'Machine Learning', 'Data Science',
      'TypeScript', 'Angular', 'Vue.js', 'MongoDB', 'PostgreSQL',
      'DevOps', 'Kubernetes', 'CI/CD', 'Git', 'HTML', 'CSS'
    ];
    
    const relevantSkills = skills.filter(skill => 
      trendingSkills.some(trending => 
        skill.toLowerCase().includes(trending.toLowerCase()) ||
        trending.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    const relevancePercentage = (relevantSkills.length / Math.max(skills.length, 10)) * 100;
    return Math.min(100, relevancePercentage);
  }

  /**
   * Calculate application success rate
   */
  private calculateSuccessRate(appStats: any): number {
    if (!appStats.total_applications || appStats.total_applications === 0) return 0;
    
    const successRate = (appStats.successful_applications / appStats.total_applications) * 100;
    return Math.min(100, successRate);
  }

  /**
   * Calculate feedback score
   */
  private calculateFeedbackScore(feedbackStats: any): number {
    if (!feedbackStats.feedback_count || feedbackStats.feedback_count === 0) return 0;
    
    const normalizedRating = ((feedbackStats.avg_rating - 1) / 4) * 100; // Convert 1-5 to 0-100
    return Math.max(0, Math.min(100, normalizedRating));
  }

  /**
   * Generate personalized recommendations
   */
  private generateEmployabilityRecommendations(factors: any, appStats: any): string[] {
    const recommendations: string[] = [];
    
    if (factors.profile_completion < 80) {
      recommendations.push('Complete your profile to increase visibility to employers');
    }
    
    if (factors.skills_relevance < 60) {
      recommendations.push('Add more industry-relevant skills like JavaScript, Python, or cloud technologies');
    }
    
    if (appStats.total_applications === 0) {
      recommendations.push('Start applying to internships to gain experience');
    } else if (factors.application_success_rate < 30) {
      recommendations.push('Improve your application strategy - consider customizing applications for each role');
    }
    
    if (factors.feedback_ratings < 70 && appStats.completed_internships > 0) {
      recommendations.push('Focus on improving performance based on previous feedback');
    }
    
    if (factors.badge_points < 50) {
      recommendations.push('Earn more badges by completing profiles, applying to internships, and gaining skills');
    }
    
    return recommendations;
  }

  /**
   * Update employability score in database
   */
  private async updateEmployabilityScore(userId: number): Promise<void> {
    try {
      const metrics = await this.calculateEmployabilityScore(userId);
      
      this.db.prepare(
        'UPDATE users SET employability_score = ?, updated_at = ? WHERE id = ?'
      ).run(metrics.score, new Date().toISOString(), userId);
    } catch (error) {
      console.error('Error updating employability score:', error);
    }
  }

  /**
   * Get profile statistics
   */
  private async getProfileStatistics(userId: number): Promise<any> {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.status = 'APPLIED' THEN 1 END) as pending_applications,
        COUNT(CASE WHEN a.status IN ('OFFERED', 'OFFER_ACCEPTED') THEN 1 END) as received_offers,
        COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completed_internships,
        COUNT(CASE WHEN a.status = 'INTERVIEWED' THEN 1 END) as interviews_attended
      FROM applications a
      WHERE a.student_id = ?
    `).get(userId);
    
    return stats;
  }

  /**
   * Get profile visibility analytics
   */
  async getProfileVisibility(userId: number): Promise<{
    views: number;
    employer_interests: number;
    recommendation_matches: number;
    profile_strength: 'WEAK' | 'AVERAGE' | 'STRONG' | 'EXCELLENT';
  }> {
    // This would track profile views and employer interest
    // For now, return calculated metrics
    const completion = this.calculateProfileCompletion(await this.getBasicProfile(userId));
    const employability = await this.calculateEmployabilityScore(userId);
    
    let profile_strength: 'WEAK' | 'AVERAGE' | 'STRONG' | 'EXCELLENT';
    const score = (completion.percentage + employability.score) / 2;
    
    if (score >= 85) profile_strength = 'EXCELLENT';
    else if (score >= 70) profile_strength = 'STRONG';
    else if (score >= 50) profile_strength = 'AVERAGE';
    else profile_strength = 'WEAK';
    
    return {
      views: Math.floor(Math.random() * 50) + 10, // Simulated for now
      employer_interests: Math.floor(score / 20), // Based on profile strength
      recommendation_matches: Math.floor(employability.score / 10),
      profile_strength
    };
  }

  /**
   * Get department leaderboard
   */
  async getDepartmentLeaderboard(department: string, limit: number = 10): Promise<any[]> {
    return this.db.prepare(`
      SELECT 
        u.id, u.name, u.employability_score,
        COUNT(ub.id) as badge_count,
        COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completed_internships
      FROM users u
      LEFT JOIN user_badges ub ON u.id = ub.user_id
      LEFT JOIN applications a ON u.id = a.student_id
      WHERE u.role = 'STUDENT' AND u.department = ?
      GROUP BY u.id, u.name, u.employability_score
      ORDER BY u.employability_score DESC, badge_count DESC
      LIMIT ?
    `).all(department, limit);
  }

  /**
   * Get certificates for user profile
   */
  async getUserCertificates(userId: number): Promise<any[]> {
    return await CertificateGenerator.getUserCertificates(userId);
  }
}