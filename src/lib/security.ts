// Advanced Security Features
// Implements comprehensive security measures for production deployment

import crypto from 'crypto';

export interface SecurityConfig {
  enableAuditLogging: boolean;
  enableCSRFProtection: boolean;
  enableSessionManagement: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number; // in minutes
  enableTwoFactorAuth: boolean;
}

export interface AuditLog {
  id: string;
  userId: number;
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  metadata?: any;
}

export interface SecurityEvent {
  type: 'FAILED_LOGIN' | 'SUSPICIOUS_ACTIVITY' | 'DATA_ACCESS' | 'PERMISSION_VIOLATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: number;
  ip: string;
  timestamp: string;
}

export interface SessionData {
  userId: number;
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  ip: string;
  userAgent: string;
  isActive: boolean;
}

export class SecurityManager {
  private static config: SecurityConfig = {
    enableAuditLogging: true,
    enableCSRFProtection: true,
    enableSessionManagement: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    enableTwoFactorAuth: false
  };

  private static auditLogs: AuditLog[] = [];
  private static securityEvents: SecurityEvent[] = [];
  private static activeSessions: Map<string, SessionData> = new Map();
  private static loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  /**
   * Initialize security middleware
   */
  static initialize(config?: Partial<SecurityConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    console.log('🔐 Security manager initialized with config:', this.config);
    
    // Start cleanup processes
    this.startSessionCleanup();
    this.startAuditLogCleanup();
  }

  /**
   * Log audit event
   */
  static async logAudit(auditData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enableAuditLogging) return;

    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...auditData
    };

    this.auditLogs.push(auditLog);
    
    // In production, store in database
    console.log('📝 Audit logged:', auditLog.action, 'by user', auditLog.userId);
    
    // Trigger security monitoring if needed
    if (!auditData.success) {
      await this.handleSecurityEvent({
        type: 'FAILED_LOGIN',
        severity: 'MEDIUM',
        description: `Failed ${auditData.action} attempt`,
        userId: auditData.userId,
        ip: auditData.ip,
        timestamp: auditLog.timestamp
      });
    }
  }

  /**
   * Handle security events
   */
  static async handleSecurityEvent(event: SecurityEvent): Promise<void> {
    this.securityEvents.push(event);
    
    console.log(`🚨 Security event [${event.severity}]:`, event.description);
    
    // Auto-response based on severity
    switch (event.severity) {
      case 'CRITICAL':
        await this.triggerIncidentResponse(event);
        break;
      case 'HIGH':
        await this.notifySecurityTeam(event);
        break;
      case 'MEDIUM':
        await this.logSecurityAlert(event);
        break;
    }
    
    // Check for patterns (multiple failed logins, etc.)
    await this.analyzeSecurityPatterns(event);
  }

  /**
   * Check login attempts and rate limiting
   */
  static checkLoginAttempts(ip: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: Date } {
    const attempts = this.loginAttempts.get(ip);
    const now = new Date();
    
    if (!attempts) {
      return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
    }
    
    // Reset attempts if last attempt was more than 15 minutes ago
    if (now.getTime() - attempts.lastAttempt.getTime() > 15 * 60 * 1000) {
      this.loginAttempts.delete(ip);
      return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
    }
    
    if (attempts.count >= this.config.maxLoginAttempts) {
      const lockedUntil = new Date(attempts.lastAttempt.getTime() + 15 * 60 * 1000);
      return { 
        allowed: false, 
        remainingAttempts: 0,
        lockedUntil 
      };
    }
    
    return { 
      allowed: true, 
      remainingAttempts: this.config.maxLoginAttempts - attempts.count 
    };
  }

  /**
   * Record login attempt
   */
  static recordLoginAttempt(ip: string, success: boolean): void {
    if (success) {
      this.loginAttempts.delete(ip);
      return;
    }
    
    const attempts = this.loginAttempts.get(ip) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    
    this.loginAttempts.set(ip, attempts);
    
    // Log security event for failed login
    this.handleSecurityEvent({
      type: 'FAILED_LOGIN',
      severity: attempts.count >= this.config.maxLoginAttempts ? 'HIGH' : 'MEDIUM',
      description: `Failed login attempt #${attempts.count} from IP ${ip}`,
      ip,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Create secure session
   */
  static createSession(userId: number, ip: string, userAgent: string): string {
    if (!this.config.enableSessionManagement) {
      return crypto.randomUUID(); // Fallback session ID
    }
    
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const sessionData: SessionData = {
      userId,
      sessionId,
      createdAt: now,
      lastActivity: now,
      ip,
      userAgent,
      isActive: true
    };
    
    this.activeSessions.set(sessionId, sessionData);
    
    console.log('🔑 Session created for user', userId, 'from', ip);
    
    return sessionId;
  }

  /**
   * Validate session
   */
  static validateSession(sessionId: string, ip: string): { valid: boolean; userId?: number; reason?: string } {
    if (!this.config.enableSessionManagement) {
      return { valid: true }; // Fallback when session management is disabled
    }
    
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }
    
    if (!session.isActive) {
      return { valid: false, reason: 'Session inactive' };
    }
    
    // Check session timeout
    const lastActivity = new Date(session.lastActivity);
    const now = new Date();
    const timeoutMs = this.config.sessionTimeout * 60 * 1000;
    
    if (now.getTime() - lastActivity.getTime() > timeoutMs) {
      this.invalidateSession(sessionId);
      return { valid: false, reason: 'Session expired' };
    }
    
    // Check IP address (optional strict mode)
    if (process.env.STRICT_IP_VALIDATION === 'true' && session.ip !== ip) {
      this.handleSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        description: `Session used from different IP. Original: ${session.ip}, Current: ${ip}`,
        userId: session.userId,
        ip,
        timestamp: new Date().toISOString()
      });
      
      this.invalidateSession(sessionId);
      return { valid: false, reason: 'IP address mismatch' };
    }
    
    // Update last activity
    session.lastActivity = now.toISOString();
    this.activeSessions.set(sessionId, session);
    
    return { valid: true, userId: session.userId };
  }

  /**
   * Invalidate session
   */
  static invalidateSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.set(sessionId, session);
      console.log('🔒 Session invalidated:', sessionId);
    }
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    if (!this.config.enableCSRFProtection) return '';
    
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!this.config.enableCSRFProtection) return true;
    
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expectedToken, 'hex')
    );
  }

  /**
   * Sanitize input data
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Check permissions
   */
  static hasPermission(userRole: string, requiredPermissions: string[]): boolean {
    const rolePermissions = {
      'STUDENT': ['view_internships', 'apply_internship', 'view_own_applications', 'update_own_profile'],
      'STAFF': ['manage_internships', 'view_all_applications', 'view_analytics', 'manage_users', 'generate_reports'],
      'MENTOR': ['approve_applications', 'view_department_applications', 'view_own_profile'],
      'EMPLOYER': ['give_feedback', 'view_hosted_internships', 'view_own_profile', 'post_internships']
    };
    
    const userPermissions = rolePermissions[userRole as keyof typeof rolePermissions] || [];
    
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Get security dashboard data
   */
  static getSecurityDashboard(): {
    activeSessions: number;
    recentSecurityEvents: SecurityEvent[];
    failedLoginAttempts: number;
    auditLogCount: number;
  } {
    const activeSessionCount = Array.from(this.activeSessions.values())
      .filter(session => session.isActive).length;
    
    const recentEvents = this.securityEvents
      .filter(event => {
        const eventTime = new Date(event.timestamp);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return eventTime > dayAgo;
      })
      .slice(-10);
    
    const failedLogins = Array.from(this.loginAttempts.values())
      .reduce((sum, attempt) => sum + attempt.count, 0);
    
    return {
      activeSessions: activeSessionCount,
      recentSecurityEvents: recentEvents,
      failedLoginAttempts: failedLogins,
      auditLogCount: this.auditLogs.length
    };
  }

  /**
   * Private helper methods
   */
  private static async triggerIncidentResponse(event: SecurityEvent): Promise<void> {
    console.log('🚨 CRITICAL SECURITY INCIDENT:', event.description);
    // In production: notify security team, trigger automated responses
  }

  private static async notifySecurityTeam(event: SecurityEvent): Promise<void> {
    console.log('⚠️ Security team notification:', event.description);
    // In production: send alerts to security team
  }

  private static async logSecurityAlert(event: SecurityEvent): Promise<void> {
    console.log('📢 Security alert logged:', event.description);
    // In production: log to security monitoring system
  }

  private static async analyzeSecurityPatterns(event: SecurityEvent): Promise<void> {
    // Look for patterns in recent events
    const recentEvents = this.securityEvents
      .filter(e => new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000))
      .filter(e => e.ip === event.ip);
    
    if (recentEvents.length >= 5) {
      await this.handleSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        description: `Multiple security events from IP ${event.ip} in the last hour`,
        ip: event.ip,
        timestamp: new Date().toISOString()
      });
    }
  }

  private static startSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      const timeoutMs = this.config.sessionTimeout * 60 * 1000;
      
      for (const [sessionId, session] of this.activeSessions.entries()) {
        const lastActivity = new Date(session.lastActivity);
        
        if (now.getTime() - lastActivity.getTime() > timeoutMs) {
          this.invalidateSession(sessionId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  private static startAuditLogCleanup(): void {
    setInterval(() => {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      
      this.auditLogs = this.auditLogs.filter(log => 
        new Date(log.timestamp) > cutoff
      );
      
      this.securityEvents = this.securityEvents.filter(event => 
        new Date(event.timestamp) > cutoff
      );
    }, 24 * 60 * 60 * 1000); // Check daily
  }
}

// Data privacy utilities
export class DataPrivacyManager {
  
  /**
   * Anonymize personal data
   */
  static anonymizeData(data: any, fields: string[]): any {
    const anonymized = { ...data };
    
    for (const field of fields) {
      if (anonymized[field]) {
        if (typeof anonymized[field] === 'string') {
          if (field.includes('email')) {
            anonymized[field] = this.anonymizeEmail(anonymized[field]);
          } else if (field.includes('phone')) {
            anonymized[field] = this.anonymizePhone(anonymized[field]);
          } else {
            anonymized[field] = this.anonymizeString(anonymized[field]);
          }
        }
      }
    }
    
    return anonymized;
  }
  
  /**
   * Check GDPR compliance
   */
  static checkGDPRCompliance(dataType: string, purpose: string): {
    compliant: boolean;
    requirements: string[];
    actions: string[];
  } {
    // Mock GDPR compliance check
    return {
      compliant: true,
      requirements: [
        'Data subject consent obtained',
        'Lawful basis for processing established',
        'Data minimization principle applied'
      ],
      actions: [
        'Regular data audit scheduled',
        'Data retention policy enforced',
        'Subject access rights implemented'
      ]
    };
  }
  
  private static anonymizeEmail(email: string): string {
    const [local, domain] = email.split('@');
    const anonymizedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${anonymizedLocal}@${domain}`;
  }
  
  private static anonymizePhone(phone: string): string {
    return phone.replace(/\d(?=\d{4})/g, '*');
  }
  
  private static anonymizeString(str: string): string {
    if (str.length <= 2) return '*'.repeat(str.length);
    return str.charAt(0) + '*'.repeat(str.length - 2) + str.charAt(str.length - 1);
  }
}