// Live Placement Heatmap Manager
// Real-time department-wise placement statistics and visualization data

import { getDatabase } from './database';

export interface DepartmentStats {
  department: string;
  total_students: number;
  placed_students: number;
  interning_students: number;
  available_students: number;
  placement_percentage: number;
  intern_percentage: number;
  heat_score: number; // 0-100 for heatmap visualization
  trend: 'up' | 'down' | 'stable';
  recent_placements: number; // last 30 days
}

export interface PlacementHeatmapData {
  departments: DepartmentStats[];
  overall_stats: {
    total_students: number;
    total_placed: number;
    total_interning: number;
    overall_placement_rate: number;
    active_companies: number;
    trending_skills: string[];
  };
  time_series: Array<{
    date: string;
    placements: number;
    internships: number;
  }>;
  company_distribution: Array<{
    company: string;
    placements: number;
    departments: string[];
  }>;
  skill_demand: Array<{
    skill: string;
    demand_score: number;
    growth_rate: number;
  }>;
  real_time_updates: {
    last_updated: string;
    recent_activities: Array<{
      type: 'placement' | 'internship' | 'application';
      student_name: string;
      company: string;
      department: string;
      timestamp: string;
    }>;
  };
}

export class PlacementHeatmapManager {
  private db: any;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Get comprehensive placement heatmap data
   */
  async getPlacementHeatmap(): Promise<PlacementHeatmapData> {
    try {
      const departments = await this.getDepartmentStats();
      const overallStats = await this.getOverallStats();
      const timeSeries = await this.getTimeSeriesData();
      const companyDistribution = await this.getCompanyDistribution();
      const skillDemand = await this.getSkillDemand();
      const realTimeUpdates = await this.getRealTimeUpdates();

      return {
        departments,
        overall_stats: overallStats,
        time_series: timeSeries,
        company_distribution: companyDistribution,
        skill_demand: skillDemand,
        real_time_updates: realTimeUpdates
      };
    } catch (error) {
      console.error('Error getting placement heatmap data:', error);
      throw error;
    }
  }

  /**
   * Get department-wise statistics for heatmap
   */
  async getDepartmentStats(): Promise<DepartmentStats[]> {
    try {
      const departmentData = this.db.prepare(`
        SELECT 
          u.department,
          COUNT(u.id) as total_students,
          COUNT(CASE WHEN u.placement_status = 'PLACED' THEN 1 END) as placed_students,
          COUNT(CASE WHEN u.placement_status = 'INTERNING' THEN 1 END) as interning_students,
          COUNT(CASE WHEN u.placement_status = 'AVAILABLE' THEN 1 END) as available_students
        FROM users u
        WHERE u.role = 'STUDENT' AND u.department IS NOT NULL
        GROUP BY u.department
        ORDER BY u.department
      `).all();

      // Get recent placements (last 30 days) for each department
      const recentPlacementsData = this.db.prepare(`
        SELECT 
          u.department,
          COUNT(a.id) as recent_placements
        FROM applications a
        JOIN users u ON a.student_id = u.id
        WHERE a.status = 'OFFER_ACCEPTED' 
        AND a.offer_accepted_at > datetime('now', '-30 days')
        AND u.department IS NOT NULL
        GROUP BY u.department
      `).all();

      // Get historical data for trend calculation
      const historicalData = await this.getHistoricalDepartmentData();

      const recentPlacementsMap = new Map(
        recentPlacementsData.map((item: any) => [item.department, item.recent_placements])
      );

      return departmentData.map((dept: any) => {
        const placementPercentage = dept.total_students > 0 
          ? Math.round((dept.placed_students / dept.total_students) * 100) 
          : 0;
        
        const internPercentage = dept.total_students > 0 
          ? Math.round((dept.interning_students / dept.total_students) * 100) 
          : 0;

        // Calculate heat score (combination of placement rate and recent activity)
        const recentPlacements = recentPlacementsMap.get(dept.department) || 0;
        const activityScore = Math.min(50, Number(recentPlacements) * 10); // Max 50 points for activity
        const heatScore = Math.min(100, placementPercentage + activityScore);

        // Calculate trend
        const trend = this.calculateTrend(dept.department, historicalData);

        return {
          department: dept.department,
          total_students: dept.total_students,
          placed_students: dept.placed_students,
          interning_students: dept.interning_students,
          available_students: dept.available_students,
          placement_percentage: placementPercentage,
          intern_percentage: internPercentage,
          heat_score: heatScore,
          trend,
          recent_placements: recentPlacements
        };
      });
    } catch (error) {
      console.error('Error getting department stats:', error);
      return [];
    }
  }

  /**
   * Get overall placement statistics
   */
  async getOverallStats(): Promise<any> {
    try {
      const stats = this.db.prepare(`
        SELECT 
          COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as total_students,
          COUNT(CASE WHEN role = 'STUDENT' AND placement_status = 'PLACED' THEN 1 END) as total_placed,
          COUNT(CASE WHEN role = 'STUDENT' AND placement_status = 'INTERNING' THEN 1 END) as total_interning
        FROM users
      `).get();

      const activeCompanies = this.db.prepare(`
        SELECT COUNT(DISTINCT company_name) as count
        FROM internships
        WHERE is_active = 1 AND verification_status = 'VERIFIED'
      `).get()?.count || 0;

      const trendingSkills = await this.getTrendingSkills();

      const overallPlacementRate = stats.total_students > 0 
        ? Math.round((stats.total_placed / stats.total_students) * 100) 
        : 0;

      return {
        total_students: stats.total_students || 0,
        total_placed: stats.total_placed || 0,
        total_interning: stats.total_interning || 0,
        overall_placement_rate: overallPlacementRate,
        active_companies: activeCompanies,
        trending_skills: trendingSkills
      };
    } catch (error) {
      console.error('Error getting overall stats:', error);
      return {
        total_students: 0,
        total_placed: 0,
        total_interning: 0,
        overall_placement_rate: 0,
        active_companies: 0,
        trending_skills: []
      };
    }
  }

  /**
   * Get time series data for placement trends
   */
  async getTimeSeriesData(): Promise<Array<{ date: string; placements: number; internships: number; }>> {
    try {
      const data = this.db.prepare(`
        SELECT 
          DATE(a.offer_accepted_at) as date,
          COUNT(CASE WHEN i.is_placement = 1 THEN 1 END) as placements,
          COUNT(CASE WHEN i.is_placement = 0 THEN 1 END) as internships
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE a.status = 'OFFER_ACCEPTED' 
        AND a.offer_accepted_at > datetime('now', '-90 days')
        GROUP BY DATE(a.offer_accepted_at)
        ORDER BY date ASC
      `).all();

      return data.map((item: any) => ({
        date: item.date,
        placements: item.placements || 0,
        internships: item.internships || 0
      }));
    } catch (error) {
      console.error('Error getting time series data:', error);
      return [];
    }
  }

  /**
   * Get company-wise placement distribution
   */
  async getCompanyDistribution(): Promise<Array<{ company: string; placements: number; departments: string[]; }>> {
    try {
      const companyData = this.db.prepare(`
        SELECT 
          i.company_name as company,
          COUNT(a.id) as placements,
          GROUP_CONCAT(DISTINCT u.department) as departments
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        WHERE a.status = 'OFFER_ACCEPTED'
        AND a.offer_accepted_at > datetime('now', '-180 days')
        GROUP BY i.company_name
        HAVING placements > 0
        ORDER BY placements DESC
        LIMIT 20
      `).all();

      return companyData.map((item: any) => ({
        company: item.company,
        placements: item.placements,
        departments: item.departments ? item.departments.split(',') : []
      }));
    } catch (error) {
      console.error('Error getting company distribution:', error);
      return [];
    }
  }

  /**
   * Get skill demand analytics
   */
  async getSkillDemand(): Promise<Array<{ skill: string; demand_score: number; growth_rate: number; }>> {
    try {
      // Get current skill demand (last 30 days)
      const currentDemand = await this.getSkillDemandForPeriod(30);
      
      // Get previous period demand (30-60 days ago)
      const previousDemand = await this.getSkillDemandForPeriod(30, 60);

      const skillDemandMap = new Map(currentDemand.map(item => [item.skill, item.demand]));
      const previousDemandMap = new Map(previousDemand.map(item => [item.skill, item.demand]));

      const skillDemand = Array.from(skillDemandMap.entries()).map(([skill, currentDemand]) => {
        const previousDemand = previousDemandMap.get(skill) || 0;
        const growthRate = previousDemand > 0 
          ? Math.round(((currentDemand - previousDemand) / previousDemand) * 100)
          : currentDemand > 0 ? 100 : 0;

        return {
          skill,
          demand_score: currentDemand,
          growth_rate: growthRate
        };
      });

      return skillDemand
        .sort((a, b) => b.demand_score - a.demand_score)
        .slice(0, 15);
    } catch (error) {
      console.error('Error getting skill demand:', error);
      return [];
    }
  }

  /**
   * Get real-time updates
   */
  async getRealTimeUpdates(): Promise<any> {
    try {
      const recentActivities = this.db.prepare(`
        SELECT 
          'placement' as type,
          u.name as student_name,
          i.company_name as company,
          u.department,
          a.offer_accepted_at as timestamp
        FROM applications a
        JOIN users u ON a.student_id = u.id
        JOIN internships i ON a.internship_id = i.id
        WHERE a.status = 'OFFER_ACCEPTED' 
        AND a.offer_accepted_at > datetime('now', '-24 hours')
        
        UNION ALL
        
        SELECT 
          'internship' as type,
          u.name as student_name,
          i.company_name as company,
          u.department,
          a.applied_at as timestamp
        FROM applications a
        JOIN users u ON a.student_id = u.id
        JOIN internships i ON a.internship_id = i.id
        WHERE a.status = 'MENTOR_APPROVED'
        AND a.applied_at > datetime('now', '-6 hours')
        AND i.is_placement = 0
        
        ORDER BY timestamp DESC
        LIMIT 10
      `).all();

      return {
        last_updated: new Date().toISOString(),
        recent_activities: recentActivities
      };
    } catch (error) {
      console.error('Error getting real-time updates:', error);
      return {
        last_updated: new Date().toISOString(),
        recent_activities: []
      };
    }
  }

  /**
   * Get department-wise detailed analytics
   */
  async getDepartmentAnalytics(department: string): Promise<any> {
    try {
      const stats = this.db.prepare(`
        SELECT 
          COUNT(u.id) as total_students,
          COUNT(CASE WHEN u.placement_status = 'PLACED' THEN 1 END) as placed_students,
          COUNT(CASE WHEN u.placement_status = 'INTERNING' THEN 1 END) as interning_students,
          COUNT(CASE WHEN u.placement_status = 'AVAILABLE' THEN 1 END) as available_students,
          AVG(u.employability_score) as avg_employability,
          AVG(u.cgpa) as avg_cgpa
        FROM users u
        WHERE u.role = 'STUDENT' AND u.department = ?
      `).get(department);

      const topCompanies = this.db.prepare(`
        SELECT 
          i.company_name,
          COUNT(a.id) as placements
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN users u ON a.student_id = u.id
        WHERE u.department = ? AND a.status = 'OFFER_ACCEPTED'
        AND a.offer_accepted_at > datetime('now', '-365 days')
        GROUP BY i.company_name
        ORDER BY placements DESC
        LIMIT 10
      `).all(department);

      const skillsInDemand = this.db.prepare(`
        SELECT 
          skill,
          COUNT(*) as demand_count
        FROM (
          SELECT json_each.value as skill
          FROM internships i, json_each(i.required_skills)
          WHERE json_extract(i.eligible_departments, '$') LIKE ?
          AND i.created_at > datetime('now', '-90 days')
        )
        GROUP BY skill
        ORDER BY demand_count DESC
        LIMIT 10
      `).all(`%"${department}"%`);

      const monthlyTrend = this.db.prepare(`
        SELECT 
          strftime('%Y-%m', a.offer_accepted_at) as month,
          COUNT(*) as placements
        FROM applications a
        JOIN users u ON a.student_id = u.id
        WHERE u.department = ? AND a.status = 'OFFER_ACCEPTED'
        AND a.offer_accepted_at > datetime('now', '-12 months')
        GROUP BY strftime('%Y-%m', a.offer_accepted_at)
        ORDER BY month ASC
      `).all(department);

      return {
        department,
        stats,
        top_companies: topCompanies,
        skills_in_demand: skillsInDemand,
        monthly_trend: monthlyTrend,
        placement_rate: stats.total_students > 0 
          ? Math.round((stats.placed_students / stats.total_students) * 100) 
          : 0
      };
    } catch (error) {
      console.error('Error getting department analytics:', error);
      throw error;
    }
  }

  /**
   * Get live updates for heatmap refresh
   */
  async getLiveUpdates(lastUpdateTime: string): Promise<any> {
    try {
      const newPlacements = this.db.prepare(`
        SELECT 
          u.department,
          COUNT(*) as new_placements
        FROM applications a
        JOIN users u ON a.student_id = u.id
        WHERE a.status = 'OFFER_ACCEPTED'
        AND a.offer_accepted_at > ?
        GROUP BY u.department
      `).all(lastUpdateTime);

      const newApplications = this.db.prepare(`
        SELECT 
          u.department,
          COUNT(*) as new_applications
        FROM applications a
        JOIN users u ON a.student_id = u.id
        WHERE a.applied_at > ?
        GROUP BY u.department
      `).all(lastUpdateTime);

      return {
        new_placements: newPlacements,
        new_applications: newApplications,
        update_timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting live updates:', error);
      return {
        new_placements: [],
        new_applications: [],
        update_timestamp: new Date().toISOString()
      };
    }
  }

  // Private helper methods

  private async getHistoricalDepartmentData(): Promise<Map<string, any>> {
    const historicalData = this.db.prepare(`
      SELECT 
        u.department,
        strftime('%Y-%m', a.offer_accepted_at) as month,
        COUNT(*) as placements
      FROM applications a
      JOIN users u ON a.student_id = u.id
      WHERE a.status = 'OFFER_ACCEPTED'
      AND a.offer_accepted_at > datetime('now', '-6 months')
      GROUP BY u.department, strftime('%Y-%m', a.offer_accepted_at)
      ORDER BY month DESC
    `).all();

    const departmentMap = new Map();
    historicalData.forEach((item: any) => {
      if (!departmentMap.has(item.department)) {
        departmentMap.set(item.department, []);
      }
      departmentMap.get(item.department).push({
        month: item.month,
        placements: item.placements
      });
    });

    return departmentMap;
  }

  private calculateTrend(department: string, historicalData: Map<string, any>): 'up' | 'down' | 'stable' {
    const deptData = historicalData.get(department);
    if (!deptData || deptData.length < 2) {
      return 'stable';
    }

    const recent = deptData[0]?.placements || 0;
    const previous = deptData[1]?.placements || 0;

    if (recent > previous) return 'up';
    if (recent < previous) return 'down';
    return 'stable';
  }

  private async getTrendingSkills(): Promise<string[]> {
    const skills = this.db.prepare(`
      SELECT 
        skill,
        COUNT(*) as demand_count
      FROM (
        SELECT json_each.value as skill
        FROM internships i, json_each(i.required_skills)
        WHERE i.created_at > datetime('now', '-30 days')
        AND i.is_active = 1
      )
      GROUP BY skill
      ORDER BY demand_count DESC
      LIMIT 5
    `).all();

    return skills.map((item: any) => item.skill);
  }

  private async getSkillDemandForPeriod(days: number, offset: number = 0): Promise<Array<{ skill: string; demand: number; }>> {
    const startDate = offset > 0 ? `datetime('now', '-${days + offset} days')` : `datetime('now', '-${days} days')`;
    const endDate = offset > 0 ? `datetime('now', '-${offset} days')` : 'datetime(\'now\')';

    const skills = this.db.prepare(`
      SELECT 
        skill,
        COUNT(*) as demand
      FROM (
        SELECT json_each.value as skill
        FROM internships i, json_each(i.required_skills)
        WHERE i.created_at > ${startDate}
        AND i.created_at <= ${endDate}
        AND i.is_active = 1
      )
      GROUP BY skill
      ORDER BY demand DESC
    `).all();

    return skills;
  }
}