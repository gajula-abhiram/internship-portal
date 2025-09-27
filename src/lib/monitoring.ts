// Simplified monitoring service for production readiness
// In-memory storage with periodic cleanup

export interface PerformanceMetric {
  id?: number;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  userId?: number;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
}

export interface SystemMetric {
  id?: number;
  metricType: 'cpu' | 'memory' | 'database' | 'api_calls' | 'errors';
  value: number;
  metadata?: string;
  timestamp: Date;
}

export interface ErrorLog {
  id?: number;
  endpoint: string;
  method: string;
  errorMessage: string;
  stackTrace?: string;
  userId?: number;
  requestData?: string;
  timestamp: Date;
}

export class MonitoringService {
  private static performanceMetrics: PerformanceMetric[] = [];
  private static systemMetrics: SystemMetric[] = [];
  private static errorLogs: ErrorLog[] = [];
  private static maxMemoryEntries = 10000;
  private static initialized = false;

  static async initializeMonitoring(): Promise<void> {
    if (this.initialized) return;

    // Start periodic cleanup
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000); // Every hour

    this.initialized = true;
    console.log('Monitoring system initialized (in-memory mode)');
  }

  static async logPerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<void> {
    try {
      const newMetric: PerformanceMetric = {
        id: Date.now() + Math.random(),
        ...metric,
        timestamp: new Date()
      };
      
      this.performanceMetrics.push(newMetric);
      
      // Keep only recent entries
      if (this.performanceMetrics.length > this.maxMemoryEntries) {
        this.performanceMetrics = this.performanceMetrics.slice(-this.maxMemoryEntries);
      }
    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }
  }

  static async logSystemMetric(metric: Omit<SystemMetric, 'id' | 'timestamp'>): Promise<void> {
    try {
      const newMetric: SystemMetric = {
        id: Date.now() + Math.random(),
        ...metric,
        timestamp: new Date()
      };
      
      this.systemMetrics.push(newMetric);
      
      if (this.systemMetrics.length > this.maxMemoryEntries) {
        this.systemMetrics = this.systemMetrics.slice(-this.maxMemoryEntries);
      }
    } catch (error) {
      console.error('Failed to log system metric:', error);
    }
  }

  static async logError(errorLog: Omit<ErrorLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const newError: ErrorLog = {
        id: Date.now() + Math.random(),
        ...errorLog,
        timestamp: new Date()
      };
      
      this.errorLogs.push(newError);
      
      if (this.errorLogs.length > this.maxMemoryEntries) {
        this.errorLogs = this.errorLogs.slice(-this.maxMemoryEntries);
      }
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  static async getPerformanceMetrics(options: {
    startDate?: Date;
    endDate?: Date;
    endpoint?: string;
    limit?: number;
  } = {}): Promise<PerformanceMetric[]> {
    try {
      let filtered = [...this.performanceMetrics];

      if (options.startDate) {
        filtered = filtered.filter(m => m.timestamp >= options.startDate!);
      }

      if (options.endDate) {
        filtered = filtered.filter(m => m.timestamp <= options.endDate!);
      }

      if (options.endpoint) {
        filtered = filtered.filter(m => m.endpoint === options.endpoint);
      }

      // Sort by timestamp desc
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return [];
    }
  }

  static async getSystemMetrics(options: {
    metricType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<SystemMetric[]> {
    try {
      let filtered = [...this.systemMetrics];

      if (options.metricType) {
        filtered = filtered.filter(m => m.metricType === options.metricType);
      }

      if (options.startDate) {
        filtered = filtered.filter(m => m.timestamp >= options.startDate!);
      }

      if (options.endDate) {
        filtered = filtered.filter(m => m.timestamp <= options.endDate!);
      }

      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered;
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return [];
    }
  }

  static async getErrorLogs(options: {
    startDate?: Date;
    endDate?: Date;
    endpoint?: string;
    limit?: number;
  } = {}): Promise<ErrorLog[]> {
    try {
      let filtered = [...this.errorLogs];

      if (options.startDate) {
        filtered = filtered.filter(e => e.timestamp >= options.startDate!);
      }

      if (options.endDate) {
        filtered = filtered.filter(e => e.timestamp <= options.endDate!);
      }

      if (options.endpoint) {
        filtered = filtered.filter(e => e.endpoint === options.endpoint);
      }

      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return filtered;
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  static async getPerformanceAnalytics(): Promise<{
    avgResponseTime: number;
    totalRequests: number;
    errorRate: number;
    slowestEndpoints: Array<{ endpoint: string; avgDuration: number; count: number }>;
    requestsPerHour: Array<{ hour: string; count: number }>;
  }> {
    try {
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const recentMetrics = this.performanceMetrics.filter(m => m.timestamp >= last24Hours);

      // Average response time
      const avgResponseTime = recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0;

      // Total requests
      const totalRequests = recentMetrics.length;

      // Error rate
      const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

      // Slowest endpoints
      const endpointStats = new Map<string, { totalDuration: number; count: number }>();
      recentMetrics.forEach(metric => {
        const current = endpointStats.get(metric.endpoint) || { totalDuration: 0, count: 0 };
        endpointStats.set(metric.endpoint, {
          totalDuration: current.totalDuration + metric.duration,
          count: current.count + 1
        });
      });

      const slowestEndpoints = Array.from(endpointStats.entries())
        .map(([endpoint, stats]) => ({
          endpoint,
          avgDuration: stats.totalDuration / stats.count,
          count: stats.count
        }))
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 10);

      // Requests per hour
      const hourlyStats = new Map<string, number>();
      recentMetrics.forEach(metric => {
        const hour = metric.timestamp.toISOString().substring(0, 13) + ':00:00';
        hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1);
      });

      const requestsPerHour = Array.from(hourlyStats.entries())
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      return {
        avgResponseTime,
        totalRequests,
        errorRate,
        slowestEndpoints,
        requestsPerHour
      };
    } catch (error) {
      console.error('Failed to get performance analytics:', error);
      return {
        avgResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        slowestEndpoints: [],
        requestsPerHour: []
      };
    }
  }

  static async collectSystemMetrics(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Log memory metrics
      await this.logSystemMetric({
        metricType: 'memory',
        value: memoryUsage.heapUsed / 1024 / 1024, // MB
        metadata: JSON.stringify(memoryUsage)
      });

      // Log CPU metrics
      await this.logSystemMetric({
        metricType: 'cpu',
        value: (cpuUsage.user + cpuUsage.system) / 1000000, // seconds
        metadata: JSON.stringify(cpuUsage)
      });

      // Log API calls count
      const lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1);
      const recentCalls = this.performanceMetrics.filter(m => m.timestamp >= lastHour).length;

      await this.logSystemMetric({
        metricType: 'api_calls',
        value: recentCalls,
        metadata: 'last_hour'
      });

    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  static startMetricsCollection(): void {
    // Collect system metrics every 5 minutes
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5 * 60 * 1000);

    console.log('System metrics collection started');
  }

  private static cleanupOldMetrics(): void {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Clean up old performance metrics
      this.performanceMetrics = this.performanceMetrics.filter(
        m => m.timestamp > threeDaysAgo
      );

      // Clean up old system metrics
      this.systemMetrics = this.systemMetrics.filter(
        m => m.timestamp > threeDaysAgo
      );

      // Clean up old error logs
      this.errorLogs = this.errorLogs.filter(
        e => e.timestamp > threeDaysAgo
      );

      console.log('Cleaned up old monitoring data');
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }
}