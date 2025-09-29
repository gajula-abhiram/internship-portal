// Certificate Generation System
// Implements "certificate generation and automatically updating the student's employability record"

import { getDatabase } from './database';
import { NotificationService } from './notification-system';

export interface CertificateData {
  student_name: string;
  student_id: string;
  student_username: string;
  internship_title: string;
  company_name: string;
  supervisor_name: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  performance_rating: number;
  skills_demonstrated: string[];
  completion_date: string;
  certificate_id: string;
}

export interface EmployabilityRecord {
  student_id: number;
  internships_completed: number;
  total_duration_weeks: number;
  average_rating: number;
  skills_acquired: string[];
  certifications: string[];
  placement_ready_score: number;
  last_updated: string;
}

export class CertificateGenerator {
  
  /**
   * Generate internship completion certificate
   */
  static async generateCertificate(data: CertificateData): Promise<{
    certificate_url: string;
    certificate_id: string;
    qr_code_url: string;
  }> {
    try {
      // Generate unique certificate ID
      const certificateId = this.generateCertificateId(data);
      
      // Create certificate content
      const certificateContent = this.createCertificateContent(data, certificateId);
      
      // In production, this would:
      // 1. Generate PDF using libraries like puppeteer, jsPDF, or PDFKit
      // 2. Upload to cloud storage (AWS S3, Google Cloud Storage)
      // 3. Generate QR code for verification
      // 4. Store certificate record in database
      
      const certificateUrl = await this.generatePDF(certificateContent, certificateId);
      const qrCodeUrl = await this.generateVerificationQR(certificateId);
      
      // Store certificate record
      await this.storeCertificateRecord(data, certificateId);
      
      // Update student's employability record
      await this.updateEmployabilityRecord(parseInt(data.student_id), data);
      
      // Automatically upload certificate to student's profile
      await this.uploadCertificateToProfile(parseInt(data.student_id), certificateUrl, certificateId);
      
      // Notify student about certificate availability
      await NotificationService.notifyCertificateGenerated(
        parseInt(data.student_id), 
        data.internship_title, 
        certificateUrl
      );
      
      return {
        certificate_url: certificateUrl,
        certificate_id: certificateId,
        qr_code_url: qrCodeUrl
      };
      
    } catch (error) {
      console.error('Certificate generation failed:', error);
      throw new Error('Failed to generate certificate');
    }
  }
  
  /**
   * Update student's employability record
   */
  static async updateEmployabilityRecord(studentId: number, certificateData: CertificateData): Promise<EmployabilityRecord> {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    try {
      // Get existing record or create new one
      const existingRecord = await this.getEmployabilityRecord(studentId);
      
      const updatedRecord: EmployabilityRecord = {
        student_id: studentId,
        internships_completed: (existingRecord?.internships_completed || 0) + 1,
        total_duration_weeks: (existingRecord?.total_duration_weeks || 0) + certificateData.duration_weeks,
        average_rating: this.calculateAverageRating(existingRecord, certificateData.performance_rating),
        skills_acquired: this.mergeSkills(existingRecord?.skills_acquired || [], certificateData.skills_demonstrated),
        certifications: [...(existingRecord?.certifications || []), certificateData.certificate_id],
        placement_ready_score: 0, // Will be calculated
        last_updated: new Date().toISOString()
      };
      
      // Calculate placement readiness score
      updatedRecord.placement_ready_score = this.calculatePlacementReadinessScore(updatedRecord);
      
      // Store updated record
      await this.storeEmployabilityRecord(updatedRecord);
      
      return updatedRecord;
    } catch (error) {
      console.error('Error updating employability record:', error);
      throw new Error('Failed to update employability record');
    }
  }
  
  /**
   * Automatically upload certificate to student's profile
   */
  static async uploadCertificateToProfile(studentId: number, certificateUrl: string, certificateId: string): Promise<void> {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    try {
      // Create certificates table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_certificates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          certificate_url TEXT NOT NULL,
          certificate_id TEXT NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);
      
      // Insert certificate into user's profile
      const insert = db.prepare(`
        INSERT INTO user_certificates (user_id, certificate_url, certificate_id)
        VALUES (?, ?, ?)
      `);
      
      insert.run(studentId, certificateUrl, certificateId);
      
      console.log(`💾 Certificate ${certificateId} uploaded to profile for user ${studentId}`);
    } catch (error) {
      console.error('Error uploading certificate to profile:', error);
      throw error;
    }
  }
  
  /**
   * Get user's certificates
   */
  static async getUserCertificates(userId: number): Promise<Array<{certificate_url: string, certificate_id: string, uploaded_at: string}>> {
    const db = getDatabase();
    if (!db) {
      return [];
    }
    
    try {
      const query = db.prepare(`
        SELECT certificate_url, certificate_id, uploaded_at 
        FROM user_certificates 
        WHERE user_id = ? 
        ORDER BY uploaded_at DESC
      `);
      
      return query.all(userId) as any[];
    } catch (error) {
      console.error('Error getting user certificates:', error);
      return [];
    }
  }
  
  /**
   * Verify certificate authenticity
   */
  static async verifyCertificate(certificateId: string): Promise<{
    valid: boolean;
    certificate_data?: CertificateData;
    verification_date: string;
  }> {
    try {
      // In production, query database for certificate record
      const certificateRecord = await this.getCertificateRecord(certificateId);
      
      return {
        valid: !!certificateRecord,
        certificate_data: certificateRecord || undefined,
        verification_date: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        valid: false,
        verification_date: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get placement readiness report for student
   */
  static async getPlacementReadinessReport(studentId: number): Promise<{
    overall_score: number;
    readiness_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PLACEMENT_READY';
    strengths: string[];
    areas_for_improvement: string[];
    recommendations: string[];
    completion_percentage: number;
  }> {
    const record = await this.getEmployabilityRecord(studentId);
    
    if (!record) {
      return {
        overall_score: 0,
        readiness_level: 'BEGINNER',
        strengths: [],
        areas_for_improvement: ['Complete at least one internship', 'Update profile with skills'],
        recommendations: ['Apply for beginner-level internships', 'Complete skill development courses'],
        completion_percentage: 0
      };
    }
    
    const score = record.placement_ready_score;
    const level = score >= 80 ? 'PLACEMENT_READY' : 
                 score >= 60 ? 'ADVANCED' : 
                 score >= 40 ? 'INTERMEDIATE' : 'BEGINNER';
    
    return {
      overall_score: score,
      readiness_level: level,
      strengths: this.identifyStrengths(record),
      areas_for_improvement: this.identifyImprovementAreas(record),
      recommendations: this.generateRecommendations(record),
      completion_percentage: Math.min(100, (record.internships_completed / 2) * 100) // 2 internships = 100%
    };
  }
  
  // Helper methods
  
  private static generateCertificateId(data: CertificateData): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `CERT-${timestamp}-${random}`.toUpperCase();
  }
  
  private static createCertificateContent(data: CertificateData, certificateId: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; background: #f5f5f5; }
          .certificate { background: white; border: 8px solid #1e40af; padding: 60px; margin: 0 auto; max-width: 800px; text-align: center; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { color: #1e40af; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
          .title { font-size: 36px; color: #dc2626; font-weight: bold; margin: 30px 0; }
          .recipient { font-size: 24px; color: #1f2937; margin: 20px 0; }
          .details { font-size: 18px; color: #374151; line-height: 1.6; margin: 30px 0; }
          .signature { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-block { text-align: center; }
          .signature-line { border-top: 2px solid #000; margin-top: 40px; padding-top: 5px; width: 200px; }
          .cert-id { position: absolute; bottom: 20px; right: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">RAJASTHAN TECHNICAL UNIVERSITY</div>
          <div class="header">INTERNSHIP & PLACEMENT PORTAL</div>
          
          <div class="title">CERTIFICATE OF COMPLETION</div>
          
          <div style="font-size: 18px; margin: 30px 0;">This is to certify that</div>
          
          <div class="recipient">${data.student_name}</div>
          <div style="font-size: 16px; color: #6b7280;">Student ID: ${data.student_id}</div>
          <div style="font-size: 16px; color: #6b7280;">Username: ${data.student_username}</div>
          
          <div class="details">
            has successfully completed the internship program<br/>
            <strong>"${data.internship_title}"</strong><br/>
            at <strong>${data.company_name}</strong><br/>
            from ${data.start_date} to ${data.end_date}<br/>
            (Duration: ${data.duration_weeks} weeks)
            <br/><br/>
            Performance Rating: <strong>${data.performance_rating}/5</strong><br/>
            Supervised by: <strong>${data.supervisor_name}</strong>
          </div>
          
          <div style="font-size: 16px; margin-top: 30px;">
            <strong>Skills Demonstrated:</strong><br/>
            ${data.skills_demonstrated.join(', ')}
          </div>
          
          <div style="margin-top: 40px; font-size: 16px;">
            Date of Completion: <strong>${data.completion_date}</strong>
          </div>
          
          <div class="signature">
            <div class="signature-block">
              <div class="signature-line">Supervisor</div>
            </div>
            <div class="signature-block">
              <div class="signature-line">Placement Cell</div>
            </div>
            <div class="signature-block">
              <div class="signature-line">University Seal</div>
            </div>
          </div>
          
          <div class="cert-id">Certificate ID: ${certificateId}</div>
        </div>
      </body>
      </html>
    `;
  }
  
  private static async generatePDF(content: string, certificateId: string): Promise<string> {
    // Mock implementation - in production, use puppeteer or similar
    console.log('📄 Generated PDF certificate:', certificateId);
    return `/certificates/${certificateId}.pdf`;
  }
  
  private static async generateVerificationQR(certificateId: string): Promise<string> {
    // Mock implementation - in production, use qr-code library
    const verificationUrl = `https://portal.university.edu/verify-certificate/${certificateId}`;
    console.log('🔍 Generated QR code for:', verificationUrl);
    return `/qr-codes/${certificateId}.png`;
  }
  
  private static async storeCertificateRecord(data: CertificateData, certificateId: string): Promise<void> {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    try {
      // Create certificates table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS certificates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          certificate_id TEXT UNIQUE NOT NULL,
          student_id INTEGER NOT NULL,
          student_username TEXT NOT NULL,
          internship_title TEXT NOT NULL,
          company_name TEXT NOT NULL,
          supervisor_name TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          duration_weeks INTEGER NOT NULL,
          performance_rating REAL NOT NULL,
          skills_demonstrated TEXT NOT NULL, -- JSON array
          completion_date TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES users(id)
        )
      `);
      
      // Insert certificate record
      const insert = db.prepare(`
        INSERT INTO certificates (
          certificate_id, student_id, student_username, internship_title, company_name,
          supervisor_name, start_date, end_date, duration_weeks, performance_rating,
          skills_demonstrated, completion_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insert.run(
        certificateId,
        data.student_id,
        data.student_username,
        data.internship_title,
        data.company_name,
        data.supervisor_name,
        data.start_date,
        data.end_date,
        data.duration_weeks,
        data.performance_rating,
        JSON.stringify(data.skills_demonstrated),
        data.completion_date
      );
      
      console.log('💾 Stored certificate record:', certificateId);
    } catch (error) {
      console.error('Error storing certificate record:', error);
      throw error;
    }
  }
  
  private static async getCertificateRecord(certificateId: string): Promise<CertificateData | null> {
    const db = getDatabase();
    if (!db) {
      return null;
    }
    
    try {
      const query = db.prepare('SELECT * FROM certificates WHERE certificate_id = ?');
      const record = query.get(certificateId) as any;
      
      if (!record) {
        return null;
      }
      
      return {
        student_name: record.student_name,
        student_id: record.student_id,
        student_username: record.student_username,
        internship_title: record.internship_title,
        company_name: record.company_name,
        supervisor_name: record.supervisor_name,
        start_date: record.start_date,
        end_date: record.end_date,
        duration_weeks: record.duration_weeks,
        performance_rating: record.performance_rating,
        skills_demonstrated: JSON.parse(record.skills_demonstrated),
        completion_date: record.completion_date,
        certificate_id: record.certificate_id
      };
    } catch (error) {
      console.error('Error getting certificate record:', error);
      return null;
    }
  }
  
  private static async getEmployabilityRecord(studentId: number): Promise<EmployabilityRecord | null> {
    const db = getDatabase();
    if (!db) {
      return null;
    }
    
    try {
      // Create employability_records table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS employability_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER UNIQUE NOT NULL,
          internships_completed INTEGER DEFAULT 0,
          total_duration_weeks INTEGER DEFAULT 0,
          average_rating REAL DEFAULT 0,
          skills_acquired TEXT, -- JSON array
          certifications TEXT, -- JSON array
          placement_ready_score INTEGER DEFAULT 0,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES users(id)
        )
      `);
      
      const query = db.prepare('SELECT * FROM employability_records WHERE student_id = ?');
      const record = query.get(studentId) as EmployabilityRecord | undefined;
      
      return record || null;
    } catch (error) {
      console.error('Error getting employability record:', error);
      return null;
    }
  }
  
  private static async storeEmployabilityRecord(record: EmployabilityRecord): Promise<void> {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    try {
      const upsert = db.prepare(`
        INSERT INTO employability_records (
          student_id, internships_completed, total_duration_weeks, average_rating,
          skills_acquired, certifications, placement_ready_score, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id) DO UPDATE SET
          internships_completed = excluded.internships_completed,
          total_duration_weeks = excluded.total_duration_weeks,
          average_rating = excluded.average_rating,
          skills_acquired = excluded.skills_acquired,
          certifications = excluded.certifications,
          placement_ready_score = excluded.placement_ready_score,
          last_updated = excluded.last_updated
      `);
      
      upsert.run(
        record.student_id,
        record.internships_completed,
        record.total_duration_weeks,
        record.average_rating,
        JSON.stringify(record.skills_acquired),
        JSON.stringify(record.certifications),
        record.placement_ready_score,
        record.last_updated
      );
      
      console.log('💾 Updated employability record for student:', record.student_id);
    } catch (error) {
      console.error('Error storing employability record:', error);
      throw error;
    }
  }
  
  private static calculateAverageRating(existingRecord: EmployabilityRecord | null, newRating: number): number {
    if (!existingRecord) return newRating;
    
    const totalInternships = existingRecord.internships_completed + 1;
    const currentTotal = existingRecord.average_rating * existingRecord.internships_completed;
    return Math.round(((currentTotal + newRating) / totalInternships) * 100) / 100;
  }
  
  private static mergeSkills(existingSkills: string[], newSkills: string[]): string[] {
    const allSkills = [...existingSkills, ...newSkills];
    return [...new Set(allSkills.map(skill => skill.toLowerCase()))];
  }
  
  private static calculatePlacementReadinessScore(record: EmployabilityRecord): number {
    let score = 0;
    
    // Internship experience (40 points)
    score += Math.min(40, record.internships_completed * 20);
    
    // Performance rating (30 points)
    score += (record.average_rating / 5) * 30;
    
    // Skills diversity (20 points)
    score += Math.min(20, record.skills_acquired.length * 2);
    
    // Duration of experience (10 points)
    score += Math.min(10, record.total_duration_weeks / 4);
    
    return Math.round(score);
  }
  
  private static identifyStrengths(record: EmployabilityRecord): string[] {
    const strengths = [];
    
    if (record.internships_completed >= 2) {
      strengths.push('Multiple internship experience');
    }
    
    if (record.average_rating >= 4) {
      strengths.push('Excellent performance record');
    }
    
    if (record.skills_acquired.length >= 8) {
      strengths.push('Diverse skill set');
    }
    
    if (record.total_duration_weeks >= 20) {
      strengths.push('Substantial work experience');
    }
    
    return strengths;
  }
  
  private static identifyImprovementAreas(record: EmployabilityRecord): string[] {
    const areas = [];
    
    if (record.internships_completed < 2) {
      areas.push('Gain more internship experience');
    }
    
    if (record.average_rating < 3.5) {
      areas.push('Improve performance ratings');
    }
    
    if (record.skills_acquired.length < 5) {
      areas.push('Develop more technical skills');
    }
    
    return areas;
  }
  
  private static generateRecommendations(record: EmployabilityRecord): string[] {
    const recommendations = [];
    
    if (record.placement_ready_score < 60) {
      recommendations.push('Complete at least one more internship');
      recommendations.push('Focus on improving performance ratings');
    }
    
    if (record.skills_acquired.length < 8) {
      recommendations.push('Learn trending technologies in your field');
      recommendations.push('Complete online certifications');
    }
    
    recommendations.push('Update your resume with latest achievements');
    recommendations.push('Practice interview skills');
    
    return recommendations;
  }
}