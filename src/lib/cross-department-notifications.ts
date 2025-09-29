// Cross-Department Internship Notification Service
// Notifies students about internships in other departments

import { getDatabase } from './database';
import { NotificationService } from './notification-system';

export class CrossDepartmentNotificationService {
  
  /**
   * Check for and notify students about internships in other departments
   */
  static async notifyCrossDepartmentInternships(): Promise<void> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Get all active students
      const students = db.prepare(`
        SELECT id, department FROM users WHERE role = 'STUDENT'
      `).all() as any[];
      
      console.log(`🔍 Checking cross-department opportunities for ${students.length} students`);
      
      for (const student of students) {
        await this.checkAndNotifyStudent(student.id, student.department);
      }
      
      console.log('✅ Cross-department notification check completed');
    } catch (error) {
      console.error('Error in cross-department notification service:', error);
    }
  }
  
  /**
   * Check and notify a specific student about internships in other departments
   */
  static async checkAndNotifyStudent(studentId: number, studentDepartment: string): Promise<void> {
    try {
      const db = getDatabase();
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Get recent internships from other departments (last 7 days)
      // that the student hasn't applied to yet
      const crossDepartmentInternships = db.prepare(`
        SELECT 
          i.id,
          i.title,
          i.company_name,
          i.description,
          u.department as company_department,
          i.created_at
        FROM internships i
        JOIN users u ON i.posted_by = u.id
        WHERE i.is_active = 1
        AND i.application_deadline > datetime('now')
        AND u.department != ?
        AND i.created_at >= datetime('now', '-7 days')
        AND i.id NOT IN (
          SELECT internship_id FROM applications WHERE student_id = ?
        )
        ORDER BY i.created_at DESC
        LIMIT 3
      `).all(studentDepartment, studentId) as any[];
      
      // If there are new internships in other departments, notify the student
      if (crossDepartmentInternships.length > 0) {
        console.log(`📧 Notifying student ${studentId} about ${crossDepartmentInternships.length} cross-department opportunities`);
        
        await NotificationService.notifyCrossDepartmentOpportunities(
          studentId, 
          crossDepartmentInternships
        );
      }
    } catch (error) {
      console.error(`Error checking cross-department internships for student ${studentId}:`, error);
    }
  }
  
  /**
   * Get cross-department internships for a specific student
   */
  static async getCrossDepartmentInternships(studentId: number, studentDepartment: string): Promise<any[]> {
    try {
      const db = getDatabase();
      if (!db) {
        return [];
      }
      
      // Get internships from other departments that the student hasn't applied to
      const crossDepartmentInternships = db.prepare(`
        SELECT 
          i.id,
          i.title,
          i.company_name,
          i.description,
          i.stipend_min,
          i.stipend_max,
          i.location,
          i.duration_weeks,
          i.application_deadline,
          i.created_at,
          u.department as company_department,
          u.name as posted_by_name
        FROM internships i
        JOIN users u ON i.posted_by = u.id
        WHERE i.is_active = 1
        AND i.application_deadline > datetime('now')
        AND u.department != ?
        AND i.id NOT IN (
          SELECT internship_id FROM applications WHERE student_id = ?
        )
        ORDER BY i.created_at DESC
        LIMIT 10
      `).all(studentDepartment, studentId) as any[];
      
      return crossDepartmentInternships;
    } catch (error) {
      console.error(`Error getting cross-department internships for student ${studentId}:`, error);
      return [];
    }
  }
  
  /**
   * Get trending cross-department internships across all students
   */
  static async getTrendingCrossDepartmentInternships(): Promise<any[]> {
    try {
      const db = getDatabase();
      if (!db) {
        return [];
      }
      
      // Get the most popular cross-department internships based on views or interest
      const trendingInternships = db.prepare(`
        SELECT 
          i.id,
          i.title,
          i.company_name,
          i.description,
          i.stipend_min,
          i.stipend_max,
          i.location,
          i.duration_weeks,
          i.application_deadline,
          i.created_at,
          u.department as company_department,
          u.name as posted_by_name,
          COUNT(a.id) as application_count
        FROM internships i
        JOIN users u ON i.posted_by = u.id
        LEFT JOIN applications a ON i.id = a.internship_id
        WHERE i.is_active = 1
        AND i.application_deadline > datetime('now')
        AND u.department IN (
          SELECT DISTINCT department FROM users WHERE role = 'STUDENT'
        )
        GROUP BY i.id
        HAVING application_count > 0
        ORDER BY application_count DESC, i.created_at DESC
        LIMIT 10
      `).all() as any[];
      
      return trendingInternships;
    } catch (error) {
      console.error('Error getting trending cross-department internships:', error);
      return [];
    }
  }
}