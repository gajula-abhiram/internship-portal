// Enhanced Internship Management System
// Handles centralized posting with verification, tagging, and placement conversion tracking

import { getDatabase } from './database';

export interface EnhancedInternship {
  id: number;
  title: string;
  description: string;
  required_skills: string[];
  eligible_departments: string[];
  stipend_min: number;
  stipend_max: number;
  is_placement: boolean;
  placement_conversion_potential: 'HIGH' | 'MEDIUM' | 'LOW';
  company_name: string;
  location: string;
  duration_weeks: number;
  application_deadline: string;
  start_date: string;
  competency_tags: string[];
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  posted_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InternshipFilters {
  departments?: string[];
  skills?: string[];
  competencies?: string[];
  stipend_min?: number;
  stipend_max?: number;
  duration_min?: number;
  duration_max?: number;
  placement_conversion?: string[];
  verification_status?: string;
  company?: string;
  location?: string;
  posted_after?: string;
  deadline_before?: string;
}

export class InternshipManager {
  private db: any;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Create new internship posting with enhanced features
   */
  async createInternship(internshipData: Partial<EnhancedInternship>, posterId: number): Promise<number | null> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO internships (
          title, description, required_skills, eligible_departments,
          stipend_min, stipend_max, is_placement, placement_conversion_potential,
          company_name, location, duration_weeks, application_deadline,
          start_date, competency_tags, verification_status, posted_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        internshipData.title,
        internshipData.description,
        JSON.stringify(internshipData.required_skills || []),
        JSON.stringify(internshipData.eligible_departments || []),
        internshipData.stipend_min || 0,
        internshipData.stipend_max || 0,
        internshipData.is_placement ? 1 : 0,
        internshipData.placement_conversion_potential || 'MEDIUM',
        internshipData.company_name,
        internshipData.location,
        internshipData.duration_weeks || 12,
        internshipData.application_deadline,
        internshipData.start_date,
        JSON.stringify(internshipData.competency_tags || []),
        'PENDING', // All new postings need verification
        posterId
      );
      
      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error creating internship:', error);
      return null;
    }
  }

  /**
   * Get internships with advanced filtering
   */
  async getInternships(filters: InternshipFilters = {}, limit: number = 50): Promise<EnhancedInternship[]> {
    try {
      let query = `
        SELECT i.*, u.name as posted_by_name, u.email as posted_by_email
        FROM internships i
        JOIN users u ON i.posted_by = u.id
        WHERE i.is_active = 1
      `;
      
      const params: any[] = [];
      
      // Add filters
      if (filters.verification_status) {
        query += ' AND i.verification_status = ?';
        params.push(filters.verification_status);
      } else {
        // Default to only showing verified internships
        query += ' AND i.verification_status = \"VERIFIED\"';
      }
      
      if (filters.departments && filters.departments.length > 0) {
        const deptConditions = filters.departments.map(() => 'i.eligible_departments LIKE ?').join(' OR ');
        query += ` AND (${deptConditions})`;
        filters.departments.forEach(dept => params.push(`%\"${dept}\"%`));
      }
      
      if (filters.stipend_min) {
        query += ' AND i.stipend_max >= ?';
        params.push(filters.stipend_min);
      }
      
      if (filters.stipend_max) {
        query += ' AND i.stipend_min <= ?';
        params.push(filters.stipend_max);
      }
      
      if (filters.duration_min) {
        query += ' AND i.duration_weeks >= ?';
        params.push(filters.duration_min);
      }
      
      if (filters.duration_max) {
        query += ' AND i.duration_weeks <= ?';
        params.push(filters.duration_max);
      }
      
      if (filters.placement_conversion && filters.placement_conversion.length > 0) {
        const conversionConditions = filters.placement_conversion.map(() => 'i.placement_conversion_potential = ?').join(' OR ');
        query += ` AND (${conversionConditions})`;
        params.push(...filters.placement_conversion);
      }
      
      if (filters.company) {
        query += ' AND i.company_name LIKE ?';
        params.push(`%${filters.company}%`);
      }
      
      if (filters.location) {
        query += ' AND i.location LIKE ?';
        params.push(`%${filters.location}%`);
      }
      
      if (filters.posted_after) {
        query += ' AND i.created_at >= ?';
        params.push(filters.posted_after);
      }
      
      if (filters.deadline_before) {
        query += ' AND i.application_deadline <= ?';
        params.push(filters.deadline_before);
      }
      
      query += ' ORDER BY i.created_at DESC LIMIT ?';
      params.push(limit);
      
      const results = this.db.prepare(query).all(...params);
      
      return results.map((row: any) => ({
        ...row,
        required_skills: JSON.parse(row.required_skills || '[]'),
        eligible_departments: JSON.parse(row.eligible_departments || '[]'),
        competency_tags: JSON.parse(row.competency_tags || '[]'),
        is_placement: Boolean(row.is_placement)
      }));
    } catch (error) {
      console.error('Error getting internships:', error);
      return [];
    }
  }

  /**
   * Verify internship posting (for staff)
   */
  async verifyInternship(internshipId: number, status: 'VERIFIED' | 'REJECTED', verifierId: number, notes?: string): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        UPDATE internships 
        SET verification_status = ?, updated_at = ?
        WHERE id = ?
      `);
      
      stmt.run(status, new Date().toISOString(), internshipId);
      
      // Log verification action
      const logStmt = this.db.prepare(`
        INSERT INTO analytics_events (event_type, user_id, entity_type, entity_id, data)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      logStmt.run(
        'internship_verification',
        verifierId,
        'internship',
        internshipId,
        JSON.stringify({ status, notes, timestamp: new Date().toISOString() })
      );
      
      return true;
    } catch (error) {
      console.error('Error verifying internship:', error);
      return false;
    }
  }

  /**
   * Get internship statistics by department
   */
  async getInternshipStats(department?: string): Promise<{
    total_posted: number;
    verified: number;
    pending_verification: number;
    rejected: number;
    by_company: Array<{ company: string; count: number }>;
    by_competency: Array<{ competency: string; count: number }>;
    placement_conversion_stats: Array<{ level: string; count: number }>;
  }> {
    try {
      let whereClause = 'WHERE i.is_active = 1';
      const params: any[] = [];
      
      if (department) {
        whereClause += ' AND i.eligible_departments LIKE ?';
        params.push(`%\"${department}\"%`);
      }
      
      // Basic stats
      const statsQuery = `
        SELECT 
          COUNT(*) as total_posted,
          COUNT(CASE WHEN verification_status = 'VERIFIED' THEN 1 END) as verified,
          COUNT(CASE WHEN verification_status = 'PENDING' THEN 1 END) as pending_verification,
          COUNT(CASE WHEN verification_status = 'REJECTED' THEN 1 END) as rejected
        FROM internships i ${whereClause}
      `;
      
      const basicStats = this.db.prepare(statsQuery).get(...params);
      
      // Company stats
      const companyStatsQuery = `
        SELECT company_name as company, COUNT(*) as count
        FROM internships i ${whereClause}
        GROUP BY company_name
        ORDER BY count DESC
        LIMIT 10
      `;
      
      const companyStats = this.db.prepare(companyStatsQuery).all(...params);
      
      // Placement conversion stats
      const placementStatsQuery = `
        SELECT placement_conversion_potential as level, COUNT(*) as count
        FROM internships i ${whereClause}
        GROUP BY placement_conversion_potential
      `;
      
      const placementStats = this.db.prepare(placementStatsQuery).all(...params);
      
      return {
        ...basicStats,
        by_company: companyStats,
        by_competency: [], // Would need to parse JSON competency_tags
        placement_conversion_stats: placementStats
      };
    } catch (error) {
      console.error('Error getting internship stats:', error);
      return {
        total_posted: 0,
        verified: 0,
        pending_verification: 0,
        rejected: 0,
        by_company: [],
        by_competency: [],
        placement_conversion_stats: []
      };
    }
  }

  /**
   * Get trending skills and competencies
   */
  async getTrendingSkillsAndCompetencies(): Promise<{
    trending_skills: Array<{ skill: string; demand: number; growth: number }>;
    trending_competencies: Array<{ competency: string; demand: number }>;
  }> {
    try {
      // Get all active internships
      const internships = await this.getInternships({ verification_status: 'VERIFIED' }, 1000);
      
      // Count skill occurrences
      const skillCounts = new Map<string, number>();
      const competencyCounts = new Map<string, number>();
      
      internships.forEach(internship => {
        internship.required_skills.forEach(skill => {
          const normalizedSkill = skill.toLowerCase().trim();
          skillCounts.set(normalizedSkill, (skillCounts.get(normalizedSkill) || 0) + 1);
        });
        
        internship.competency_tags.forEach(competency => {
          const normalizedComp = competency.toLowerCase().trim();
          competencyCounts.set(normalizedComp, (competencyCounts.get(normalizedComp) || 0) + 1);
        });
      });
      
      // Convert to sorted arrays
      const trendingSkills = Array.from(skillCounts.entries())
        .map(([skill, demand]) => ({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          demand,
          growth: Math.floor(Math.random() * 20) + 5 // Simulated growth percentage
        }))
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 20);
      
      const trendingCompetencies = Array.from(competencyCounts.entries())
        .map(([competency, demand]) => ({
          competency: competency.charAt(0).toUpperCase() + competency.slice(1),
          demand
        }))
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 15);
      
      return {
        trending_skills: trendingSkills,
        trending_competencies: trendingCompetencies
      };
    } catch (error) {
      console.error('Error getting trending skills:', error);
      return {
        trending_skills: [],
        trending_competencies: []
      };
    }
  }

  /**
   * Get internship by ID with full details
   */
  async getInternshipById(id: number): Promise<EnhancedInternship | null> {
    try {
      const query = `
        SELECT i.*, u.name as posted_by_name, u.email as posted_by_email
        FROM internships i
        JOIN users u ON i.posted_by = u.id
        WHERE i.id = ?
      `;
      
      const result = this.db.prepare(query).get(id);
      
      if (!result) return null;
      
      return {
        ...result,
        required_skills: JSON.parse(result.required_skills || '[]'),
        eligible_departments: JSON.parse(result.eligible_departments || '[]'),
        competency_tags: JSON.parse(result.competency_tags || '[]'),
        is_placement: Boolean(result.is_placement)
      };
    } catch (error) {
      console.error('Error getting internship by ID:', error);
      return null;
    }
  }

  /**
   * Update internship
   */
  async updateInternship(id: number, updates: Partial<EnhancedInternship>): Promise<boolean> {
    try {
      const fields = [];
      const values = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          fields.push(`${key} = ?`);
          
          if (['required_skills', 'eligible_departments', 'competency_tags'].includes(key) && Array.isArray(value)) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      });
      
      if (fields.length === 0) return false;
      
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      const query = `UPDATE internships SET ${fields.join(', ')} WHERE id = ?`;
      this.db.prepare(query).run(...values);
      
      return true;
    } catch (error) {
      console.error('Error updating internship:', error);
      return false;
    }
  }
}