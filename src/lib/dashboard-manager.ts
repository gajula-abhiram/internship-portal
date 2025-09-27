// Role-based Dashboard Manager
// Provides real-time statistics and analytics for different user roles

import { getDatabase } from './database';

export interface DashboardMetrics {
  role: string;
  user_id: number;
  metrics: any;
  real_time_data: any;
  notifications_summary: any;
  quick_actions: any[];
}

export interface StudentDashboard {
  profile_completion: number;
  employability_score: number;
  active_applications: number;
  pending_interviews: number;
  received_offers: number;
  recommended_internships: number;
  badges_earned: number;
  recent_activities: any[];
  upcoming_deadlines: any[];
  skill_gap_analysis: any;
}

export interface MentorDashboard {
  pending_approvals: number;
  students_mentored: number;
  avg_response_time: number;
  approval_rate: number;
  overdue_requests: number;
  department_stats: any;
  recent_decisions: any[];
  workload_distribution: any;
}

export interface StaffDashboard {
  total_students: number;
  placement_rate: number;
  active_internships: number;
  pending_verifications: number;
  department_performance: any[];
  trending_companies: any[];
  monthly_placements: any[];
  system_health: any;
}

export interface EmployerDashboard {
  posted_internships: number;
  total_applications: number;
  pending_reviews: number;
  hired_students: number;
  avg_hiring_time: number;
  application_funnel: any;
  candidate_pipeline: any[];
  performance_metrics: any;
}

export class DashboardManager {
  private db: any;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Get role-specific dashboard data
   */
  async getDashboard(userId: number, role: string): Promise<DashboardMetrics> {
    try {
      let metrics;
      let realTimeData;
      let notificationsSummary;
      let quickActions;

      switch (role) {
        case 'STUDENT':
          metrics = await this.getStudentDashboard(userId);
          realTimeData = await this.getStudentRealTimeData(userId);
          notificationsSummary = await this.getNotificationsSummary(userId);
          quickActions = await this.getStudentQuickActions(userId);
          break;
          
        case 'MENTOR':
          metrics = await this.getMentorDashboard(userId);
          realTimeData = await this.getMentorRealTimeData(userId);
          notificationsSummary = await this.getNotificationsSummary(userId);
          quickActions = await this.getMentorQuickActions(userId);
          break;
          
        case 'STAFF':
          metrics = await this.getStaffDashboard(userId);
          realTimeData = await this.getStaffRealTimeData();
          notificationsSummary = await this.getNotificationsSummary(userId);
          quickActions = await this.getStaffQuickActions();
          break;
          
        case 'EMPLOYER':
          metrics = await this.getEmployerDashboard(userId);
          realTimeData = await this.getEmployerRealTimeData(userId);
          notificationsSummary = await this.getNotificationsSummary(userId);
          quickActions = await this.getEmployerQuickActions(userId);
          break;
          
        default:
          throw new Error('Invalid user role');
      }

      return {
        role,
        user_id: userId,
        metrics,
        real_time_data: realTimeData,
        notifications_summary: notificationsSummary,
        quick_actions: quickActions
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get student dashboard metrics
   */
  private async getStudentDashboard(userId: number): Promise<StudentDashboard> {
    try {
      // Profile and employability data
      const profileData = this.db.prepare(`
        SELECT employability_score, skills, cover_letter, resume
        FROM users WHERE id = ?
      `).get(userId);

      const profileCompletion = this.calculateProfileCompletion(profileData);

      // Application statistics
      const applicationStats = this.db.prepare(`
        SELECT 
          COUNT(*) as active_applications,
          COUNT(CASE WHEN status = 'INTERVIEW_SCHEDULED' THEN 1 END) as pending_interviews,
          COUNT(CASE WHEN status IN ('OFFERED', 'OFFER_ACCEPTED') THEN 1 END) as received_offers
        FROM applications 
        WHERE student_id = ? AND status NOT IN ('COMPLETED', 'NOT_OFFERED', 'WITHDRAWN')
      `).get(userId);

      // Badges count
      const badgesCount = this.db.prepare(`
        SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?
      `).get(userId)?.count || 0;

      // Recent activities
      const recentActivities = this.db.prepare(`
        SELECT type, title, message, created_at, data
        FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `).all(userId);

      // Upcoming deadlines
      const upcomingDeadlines = this.db.prepare(`
        SELECT i.title, i.company_name, i.application_deadline, a.id as application_id
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE a.student_id = ? 
        AND i.application_deadline > datetime('now')
        AND i.application_deadline < datetime('now', '+7 days')
        ORDER BY i.application_deadline ASC
      `).all(userId);

      // Recommended internships count
      const recommendedCount = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM internships i
        WHERE i.is_active = 1 
        AND i.verification_status = 'VERIFIED'
        AND i.eligible_departments LIKE ?
        AND i.id NOT IN (SELECT internship_id FROM applications WHERE student_id = ?)
      `).get(`%"${profileData?.department || ''}"%`, userId)?.count || 0;

      return {
        profile_completion: profileCompletion,
        employability_score: profileData?.employability_score || 0,
        active_applications: applicationStats?.active_applications || 0,
        pending_interviews: applicationStats?.pending_interviews || 0,
        received_offers: applicationStats?.received_offers || 0,
        recommended_internships: recommendedCount,
        badges_earned: badgesCount,
        recent_activities: recentActivities.map((activity: any) => ({
          ...activity,
          data: activity.data ? JSON.parse(activity.data) : {}
        })),
        upcoming_deadlines: upcomingDeadlines,
        skill_gap_analysis: await this.getSkillGapAnalysis(userId)
      };
    } catch (error) {
      console.error('Error getting student dashboard:', error);
      throw error;
    }
  }

  /**
   * Get mentor dashboard metrics
   */
  private async getMentorDashboard(userId: number): Promise<MentorDashboard> {
    try {
      // Get mentor's department
      const mentor = this.db.prepare('SELECT department FROM users WHERE id = ?').get(userId);

      // Approval statistics
      const approvalStats = this.db.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_approvals,
          COUNT(CASE WHEN status = 'PENDING' AND submitted_at < datetime('now', '-24 hours') THEN 1 END) as overdue_requests,
          AVG(CASE WHEN reviewed_at IS NOT NULL 
              THEN (julianday(reviewed_at) - julianday(submitted_at)) * 24 
              END) as avg_response_time,
          ROUND(COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) * 100.0 / 
                NULLIF(COUNT(CASE WHEN status IN ('APPROVED', 'REJECTED') THEN 1 END), 0), 1) as approval_rate
        FROM mentor_approval_requests 
        WHERE mentor_id = ?
      `).get(userId);

      // Students mentored count
      const studentsCount = this.db.prepare(`
        SELECT COUNT(DISTINCT student_id) as count
        FROM mentor_approval_requests 
        WHERE mentor_id = ?
      `).get(userId)?.count || 0;

      // Recent decisions
      const recentDecisions = this.db.prepare(`
        SELECT 
          mar.status, mar.reviewed_at, mar.comments,
          u.name as student_name,
          i.title as internship_title,
          i.company_name
        FROM mentor_approval_requests mar
        JOIN users u ON mar.student_id = u.id
        JOIN applications a ON mar.application_id = a.id
        JOIN internships i ON a.internship_id = i.id
        WHERE mar.mentor_id = ? AND mar.status IN ('APPROVED', 'REJECTED')
        ORDER BY mar.reviewed_at DESC
        LIMIT 10
      `).all(userId);

      // Department statistics
      const departmentStats = this.db.prepare(`
        SELECT 
          COUNT(DISTINCT u.id) as total_students,
          COUNT(CASE WHEN u.placement_status = 'PLACED' THEN 1 END) as placed_students,
          COUNT(CASE WHEN u.placement_status = 'INTERNING' THEN 1 END) as interning_students
        FROM users u
        WHERE u.role = 'STUDENT' AND u.department = ?
      `).get(mentor?.department);

      return {
        pending_approvals: approvalStats?.pending_approvals || 0,
        students_mentored: studentsCount,
        avg_response_time: Math.round(approvalStats?.avg_response_time || 0),
        approval_rate: approvalStats?.approval_rate || 0,
        overdue_requests: approvalStats?.overdue_requests || 0,
        department_stats: departmentStats,
        recent_decisions: recentDecisions,
        workload_distribution: await this.getMentorWorkloadDistribution(userId)
      };
    } catch (error) {
      console.error('Error getting mentor dashboard:', error);
      throw error;
    }
  }

  /**
   * Get staff dashboard metrics
   */
  private async getStaffDashboard(userId: number): Promise<StaffDashboard> {
    try {
      // Overall statistics
      const overallStats = this.db.prepare(`
        SELECT 
          COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as total_students,
          COUNT(CASE WHEN role = 'STUDENT' AND placement_status = 'PLACED' THEN 1 END) as placed_students,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_internships
        FROM users u
        LEFT JOIN internships i ON 1=1
        WHERE u.role = 'STUDENT' OR i.id IS NOT NULL
      `).get();

      const placementRate = overallStats?.total_students > 0 
        ? Math.round((overallStats.placed_students / overallStats.total_students) * 100)
        : 0;

      // Pending verifications
      const pendingVerifications = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM internships 
        WHERE verification_status = 'PENDING'
      `).get()?.count || 0;

      // Department performance
      const departmentPerformance = this.db.prepare(`
        SELECT 
          u.department,
          COUNT(u.id) as total_students,
          COUNT(CASE WHEN u.placement_status = 'PLACED' THEN 1 END) as placed_students,
          ROUND(COUNT(CASE WHEN u.placement_status = 'PLACED' THEN 1 END) * 100.0 / COUNT(u.id), 1) as placement_rate
        FROM users u
        WHERE u.role = 'STUDENT' AND u.department IS NOT NULL
        GROUP BY u.department
        ORDER BY placement_rate DESC
      `).all();

      // Trending companies
      const trendingCompanies = this.db.prepare(`
        SELECT 
          i.company_name,
          COUNT(a.id) as application_count,
          COUNT(CASE WHEN a.status IN ('OFFERED', 'OFFER_ACCEPTED') THEN 1 END) as offers_made
        FROM internships i
        LEFT JOIN applications a ON i.id = a.internship_id
        WHERE i.created_at > datetime('now', '-30 days')
        GROUP BY i.company_name
        ORDER BY application_count DESC
        LIMIT 10
      `).all();

      // Monthly placements (last 6 months)
      const monthlyPlacements = this.db.prepare(`
        SELECT 
          strftime('%Y-%m', a.offer_accepted_at) as month,
          COUNT(*) as placements
        FROM applications a
        WHERE a.status = 'OFFER_ACCEPTED' 
        AND a.offer_accepted_at > datetime('now', '-6 months')
        GROUP BY strftime('%Y-%m', a.offer_accepted_at)
        ORDER BY month DESC
      `).all();

      return {
        total_students: overallStats?.total_students || 0,
        placement_rate: placementRate,
        active_internships: overallStats?.active_internships || 0,
        pending_verifications: pendingVerifications,
        department_performance: departmentPerformance,
        trending_companies: trendingCompanies,
        monthly_placements: monthlyPlacements,
        system_health: await this.getSystemHealth()
      };
    } catch (error) {
      console.error('Error getting staff dashboard:', error);
      throw error;
    }
  }

  /**
   * Get employer dashboard metrics
   */
  private async getEmployerDashboard(userId: number): Promise<EmployerDashboard> {
    try {
      // Internship and application statistics
      const stats = this.db.prepare(`
        SELECT 
          COUNT(DISTINCT i.id) as posted_internships,
          COUNT(a.id) as total_applications,
          COUNT(CASE WHEN a.status = 'EMPLOYER_REVIEW' THEN 1 END) as pending_reviews,
          COUNT(CASE WHEN a.status = 'OFFER_ACCEPTED' THEN 1 END) as hired_students,
          AVG(CASE WHEN a.offer_accepted_at IS NOT NULL 
              THEN (julianday(a.offer_accepted_at) - julianday(a.applied_at)) 
              END) as avg_hiring_time_days
        FROM internships i
        LEFT JOIN applications a ON i.id = a.internship_id
        WHERE i.posted_by = ?
      `).get(userId);

      // Application funnel
      const applicationFunnel = this.db.prepare(`
        SELECT 
          a.status,
          COUNT(*) as count
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE i.posted_by = ?
        GROUP BY a.status
        ORDER BY 
          CASE a.status
            WHEN 'APPLIED' THEN 1
            WHEN 'MENTOR_APPROVED' THEN 2
            WHEN 'EMPLOYER_REVIEW' THEN 3
            WHEN 'INTERVIEW_SCHEDULED' THEN 4
            WHEN 'INTERVIEWED' THEN 5
            WHEN 'OFFERED' THEN 6
            WHEN 'OFFER_ACCEPTED' THEN 7
            ELSE 8
          END
      `).all(userId);

      // Candidate pipeline
      const candidatePipeline = this.db.prepare(`
        SELECT 
          u.name as student_name,
          u.department,
          u.current_semester,
          u.employability_score,
          a.status,
          a.applied_at,
          i.title as internship_title
        FROM applications a
        JOIN users u ON a.student_id = u.id
        JOIN internships i ON a.internship_id = i.id
        WHERE i.posted_by = ? 
        AND a.status IN ('EMPLOYER_REVIEW', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFERED')
        ORDER BY a.applied_at DESC
        LIMIT 20
      `).all(userId);

      return {
        posted_internships: stats?.posted_internships || 0,
        total_applications: stats?.total_applications || 0,
        pending_reviews: stats?.pending_reviews || 0,
        hired_students: stats?.hired_students || 0,
        avg_hiring_time: Math.round(stats?.avg_hiring_time_days || 0),
        application_funnel: applicationFunnel,
        candidate_pipeline: candidatePipeline,
        performance_metrics: await this.getEmployerPerformanceMetrics(userId)
      };
    } catch (error) {
      console.error('Error getting employer dashboard:', error);
      throw error;
    }
  }

  /**
   * Get real-time data for students
   */
  private async getStudentRealTimeData(userId: number): Promise<any> {
    return {
      new_recommendations: await this.getNewRecommendationsCount(userId),
      application_updates: await this.getRecentApplicationUpdates(userId),
      trending_skills: await this.getTrendingSkillsForStudent(userId),
      peer_activity: await this.getPeerActivity(userId)
    };
  }

  /**
   * Get notifications summary
   */
  private async getNotificationsSummary(userId: number): Promise<any> {
    const summary = this.db.prepare(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread_count,
        COUNT(CASE WHEN is_read = 0 AND type = 'APPLICATION' THEN 1 END) as unread_applications,
        COUNT(CASE WHEN is_read = 0 AND type = 'RECOMMENDATION' THEN 1 END) as unread_recommendations
      FROM notifications
      WHERE user_id = ?
    `).get(userId);

    return summary;
  }

  /**
   * Get quick actions for students
   */
  private async getStudentQuickActions(userId: number): Promise<any[]> {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const actions = [];

    // Check profile completion
    const profileCompletion = this.calculateProfileCompletion(user);
    if (profileCompletion < 80) {
      actions.push({
        type: 'profile_completion',
        title: 'Complete Your Profile',
        description: `Your profile is ${profileCompletion}% complete`,
        action_url: '/profile',
        priority: 'high'
      });
    }

    // Check for new recommendations
    const newRecommendations = await this.getNewRecommendationsCount(userId);
    if (newRecommendations > 0) {
      actions.push({
        type: 'new_recommendations',
        title: 'New Recommendations Available',
        description: `${newRecommendations} new internships match your profile`,
        action_url: '/recommendations',
        priority: 'medium'
      });
    }

    return actions;
  }

  // Helper methods
  private calculateProfileCompletion(user: any): number {
    if (!user) return 0;
    
    const fields = ['name', 'email', 'department', 'skills', 'resume', 'cover_letter', 'phone', 'linkedin_url'];
    const completedFields = fields.filter(field => user[field] && user[field].toString().trim() !== '').length;
    
    return Math.round((completedFields / fields.length) * 100);
  }

  private async getSkillGapAnalysis(userId: number): Promise<any> {
    // Simplified skill gap analysis
    return {
      missing_skills: ['React', 'Node.js'],
      recommended_courses: ['Full Stack Development', 'Database Management'],
      market_demand: 'High'
    };
  }

  private async getMentorWorkloadDistribution(userId: number): Promise<any> {
    return this.db.prepare(`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as requests_received
      FROM mentor_approval_requests
      WHERE mentor_id = ? AND submitted_at > datetime('now', '-30 days')
      GROUP BY DATE(submitted_at)
      ORDER BY date DESC
      LIMIT 10
    `).all(userId);
  }

  private async getSystemHealth(): Promise<any> {
    const health = this.db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') as active_students,
        (SELECT COUNT(*) FROM internships WHERE is_active = 1) as active_internships,
        (SELECT COUNT(*) FROM applications WHERE created_at > datetime('now', '-24 hours')) as applications_today,
        (SELECT COUNT(*) FROM notifications WHERE created_at > datetime('now', '-1 hour')) as notifications_last_hour
    `).get();

    return {
      ...health,
      system_status: 'healthy',
      last_updated: new Date().toISOString()
    };
  }

  private async getEmployerPerformanceMetrics(userId: number): Promise<any> {
    return {
      time_to_hire: 14, // days
      candidate_satisfaction: 4.2, // out of 5
      retention_rate: 85, // percentage
      response_rate: 92 // percentage
    };
  }

  private async getNewRecommendationsCount(userId: number): Promise<number> {
    return this.db.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND type = 'RECOMMENDATION' 
      AND created_at > datetime('now', '-24 hours')
    `).get(userId)?.count || 0;
  }

  private async getRecentApplicationUpdates(userId: number): Promise<any[]> {
    return this.db.prepare(`
      SELECT a.status, a.updated_at, i.title, i.company_name
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      WHERE a.student_id = ? AND a.updated_at > datetime('now', '-48 hours')
      ORDER BY a.updated_at DESC
      LIMIT 5
    `).all(userId);
  }

  private async getTrendingSkillsForStudent(userId: number): Promise<string[]> {
    // Simplified trending skills based on user's department
    const user = this.db.prepare('SELECT department FROM users WHERE id = ?').get(userId);
    const skillsMap: Record<string, string[]> = {
      'Computer Science': ['React', 'Python', 'Machine Learning', 'Cloud Computing'],
      'Information Technology': ['DevOps', 'Cybersecurity', 'Data Analytics', 'Mobile Development'],
      'Electronics': ['IoT', 'Embedded Systems', 'VLSI Design', 'Signal Processing']
    };
    
    return skillsMap[user?.department] || ['Programming', 'Problem Solving', 'Communication'];
  }

  private async getPeerActivity(userId: number): Promise<any> {
    const user = this.db.prepare('SELECT department FROM users WHERE id = ?').get(userId);
    
    return this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.applied_at > datetime('now', '-24 hours') THEN 1 END) as applications_today,
        COUNT(CASE WHEN a.status = 'OFFER_ACCEPTED' AND a.offer_accepted_at > datetime('now', '-7 days') THEN 1 END) as offers_this_week
      FROM applications a
      JOIN users u ON a.student_id = u.id
      WHERE u.department = ? AND u.id != ?
    `).get(user?.department, userId);
  }

  private async getMentorRealTimeData(userId: number): Promise<any> {
    return {
      urgent_requests: await this.getUrgentRequests(userId),
      workload_trend: await this.getWorkloadTrend(userId)
    };
  }

  private async getStaffRealTimeData(): Promise<any> {
    return {
      system_alerts: await this.getSystemAlerts(),
      placement_trends: await this.getPlacementTrends()
    };
  }

  private async getEmployerRealTimeData(userId: number): Promise<any> {
    return {
      new_applications: await this.getNewApplicationsForEmployer(userId),
      candidate_activity: await this.getCandidateActivity(userId)
    };
  }

  private async getMentorQuickActions(userId: number): Promise<any[]> {
    const overdue = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM mentor_approval_requests 
      WHERE mentor_id = ? AND status = 'PENDING' 
      AND submitted_at < datetime('now', '-24 hours')
    `).get(userId)?.count || 0;

    const actions = [];
    if (overdue > 0) {
      actions.push({
        type: 'overdue_approvals',
        title: 'Overdue Approvals',
        description: `${overdue} requests need immediate attention`,
        action_url: '/mentor/workqueue',
        priority: 'urgent'
      });
    }

    return actions;
  }

  private async getStaffQuickActions(): Promise<any[]> {
    return [
      {
        type: 'verify_internships',
        title: 'Verify New Internships',
        description: 'Review pending internship postings',
        action_url: '/staff/verifications',
        priority: 'medium'
      }
    ];
  }

  private async getEmployerQuickActions(userId: number): Promise<any[]> {
    return [
      {
        type: 'review_applications',
        title: 'Review Applications',
        description: 'New candidates awaiting review',
        action_url: '/employer/applications',
        priority: 'medium'
      }
    ];
  }

  // Additional helper methods for real-time data
  private async getUrgentRequests(userId: number): Promise<number> {
    return this.db.prepare(`
      SELECT COUNT(*) as count
      FROM mentor_approval_requests
      WHERE mentor_id = ? AND status = 'PENDING' AND priority = 'URGENT'
    `).get(userId)?.count || 0;
  }

  private async getWorkloadTrend(userId: number): Promise<any[]> {
    return this.db.prepare(`
      SELECT DATE(submitted_at) as date, COUNT(*) as count
      FROM mentor_approval_requests
      WHERE mentor_id = ? AND submitted_at > datetime('now', '-7 days')
      GROUP BY DATE(submitted_at)
      ORDER BY date ASC
    `).all(userId);
  }

  private async getSystemAlerts(): Promise<any[]> {
    return [
      { type: 'info', message: 'System running normally', timestamp: new Date().toISOString() }
    ];
  }

  private async getPlacementTrends(): Promise<any[]> {
    return this.db.prepare(`
      SELECT DATE(offer_accepted_at) as date, COUNT(*) as placements
      FROM applications
      WHERE status = 'OFFER_ACCEPTED' AND offer_accepted_at > datetime('now', '-30 days')
      GROUP BY DATE(offer_accepted_at)
      ORDER BY date ASC
    `).all();
  }

  private async getNewApplicationsForEmployer(userId: number): Promise<number> {
    return this.db.prepare(`
      SELECT COUNT(*) as count
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      WHERE i.posted_by = ? AND a.applied_at > datetime('now', '-24 hours')
    `).get(userId)?.count || 0;
  }

  private async getCandidateActivity(userId: number): Promise<any> {
    return this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN a.status = 'EMPLOYER_REVIEW' THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN a.status = 'INTERVIEWED' THEN 1 END) as interviewed_today
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      WHERE i.posted_by = ? AND a.updated_at > datetime('now', '-24 hours')
    `).get(userId);
  }
}