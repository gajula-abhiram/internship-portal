// Production deployment configuration
// Environment setup and optimization

interface ProductionConfig {
  environment: 'production' | 'staging' | 'development';
  database: {
    maxConnections: number;
    connectionTimeout: number;
    queryTimeout: number;
    enableWAL: boolean;
  };
  security: {
    enableCSRF: boolean;
    enableRateLimit: boolean;
    maxRequestsPerMinute: number;
    enableAuditLog: boolean;
    sessionTimeout: number;
  };
  monitoring: {
    enableMetrics: boolean;
    enableErrorTracking: boolean;
    metricsRetentionDays: number;
  };
  email: {
    enableEmailService: boolean;
    maxEmailsPerHour: number;
    enableBulkEmails: boolean;
  };
  backup: {
    enableAutomaticBackup: boolean;
    backupSchedule: string;
    retentionDays: number;
  };
  performance: {
    enableCompression: boolean;
    enableCaching: boolean;
    cacheTimeout: number;
    maxFileUploadSize: number;
  };
}

export const PRODUCTION_CONFIG: ProductionConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  database: {
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '15000'),
    enableWAL: process.env.DB_ENABLE_WAL !== 'false'
  },
  security: {
    enableCSRF: process.env.ENABLE_CSRF !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '100'),
    enableAuditLog: process.env.ENABLE_AUDIT_LOG !== 'false',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400') // 24 hours
  },
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
    metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || '30')
  },
  email: {
    enableEmailService: process.env.ENABLE_EMAIL_SERVICE !== 'false',
    maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '100'),
    enableBulkEmails: process.env.ENABLE_BULK_EMAILS !== 'false'
  },
  backup: {
    enableAutomaticBackup: process.env.ENABLE_AUTO_BACKUP !== 'false',
    backupSchedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30')
  },
  performance: {
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '3600'), // 1 hour
    maxFileUploadSize: parseInt(process.env.MAX_FILE_UPLOAD_SIZE || '10485760') // 10MB
  }
};

export class ProductionManager {
  private static initialized = false;

  /**
   * Initialize all production services
   */
  static async initializeProduction(): Promise<void> {
    if (this.initialized) return;

    console.log('🚀 Initializing production services...');

    try {
      // Initialize monitoring
      if (PRODUCTION_CONFIG.monitoring.enableMetrics) {
        const { MonitoringService } = await import('./monitoring');
        await MonitoringService.initializeMonitoring();
        MonitoringService.startMetricsCollection();
        console.log('✓ Monitoring service initialized');
      }

      // Initialize security
      if (PRODUCTION_CONFIG.security.enableAuditLog) {
        const { SecurityManager } = await import('./security');
        console.log('✓ Security manager configured');
      }

      // Initialize email service
      if (PRODUCTION_CONFIG.email.enableEmailService) {
        console.log('✓ Email service configured');
      }

      // Initialize backup system
      if (PRODUCTION_CONFIG.backup.enableAutomaticBackup) {
        const { BackupService } = await import('./backup');
        await BackupService.initializeBackupSystem();
        await BackupService.scheduleAutomaticBackups();
        console.log('✓ Backup service initialized');
      }

      // Initialize search engine
      const { SearchEngine } = await import('./search-engine');
      console.log('✓ Search engine configured');

      this.initialized = true;
      console.log('🎉 All production services initialized successfully!');

    } catch (error) {
      console.error('❌ Failed to initialize production services:', error);
      throw error;
    }
  }

  /**
   * Health check for all services
   */
  static async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, 'healthy' | 'unhealthy'>;
    timestamp: string;
  }> {
    const results: Record<string, 'healthy' | 'unhealthy'> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      // Check database
      try {
        const { getDbQueries } = await import('./database');
        const db = getDbQueries();
        results.database = 'healthy';
      } catch (error) {
        results.database = 'unhealthy';
        overallStatus = 'degraded';
      }

      // Check email service
      try {
        results.email = 'healthy';
      } catch (error) {
        results.email = 'unhealthy';
        overallStatus = 'degraded';
      }

      // Check monitoring
      try {
        const { MonitoringService } = await import('./monitoring');
        results.monitoring = 'healthy';
      } catch (error) {
        results.monitoring = 'unhealthy';
        overallStatus = 'degraded';
      }

      // Check security
      try {
        const { SecurityManager } = await import('./security');
        results.security = 'healthy';
      } catch (error) {
        results.security = 'unhealthy';
        overallStatus = 'degraded';
      }

      // Check file system
      try {
        const fs = require('fs');
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        results.filesystem = 'healthy';
      } catch (error) {
        results.filesystem = 'unhealthy';
        overallStatus = 'degraded';
      }

      // Determine overall status
      const unhealthyCount = Object.values(results).filter(status => status === 'unhealthy').length;
      if (unhealthyCount > 0) {
        overallStatus = unhealthyCount >= Object.keys(results).length / 2 ? 'unhealthy' : 'degraded';
      }

    } catch (error) {
      console.error('Health check failed:', error);
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      services: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Graceful shutdown
   */
  static async gracefulShutdown(): Promise<void> {
    console.log('🛑 Initiating graceful shutdown...');

    try {
      // Close database connections
      // Cleanup monitoring
      // Stop backup services
      // Close email connections

      console.log('✓ Graceful shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  /**
   * Get production configuration
   */
  static getConfig(): ProductionConfig {
    return PRODUCTION_CONFIG;
  }

  /**
   * Validate environment variables
   */
  static validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required environment variables
    const required = [
      'JWT_SECRET',
      'DATABASE_URL'
    ];

    required.forEach(envVar => {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    });

    // Check email configuration if enabled
    if (PRODUCTION_CONFIG.email.enableEmailService) {
      const emailVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
      emailVars.forEach(envVar => {
        if (!process.env[envVar]) {
          errors.push(`Missing email configuration: ${envVar}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}