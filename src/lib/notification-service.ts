// Real-time Notification Service
// Provides real-time updates for application status changes

import { NotificationService } from './notification-system';

export interface ApplicationUpdate {
  application_id: number;
  status: string;
  message: string;
  timestamp: string;
  type: 'status_change' | 'tracking_update' | 'interview_scheduled' | 'offer_extended';
}

export class RealTimeNotificationService {
  private static subscribers: Map<number, Array<(update: ApplicationUpdate) => void>> = new Map();
  private static pollingInterval: NodeJS.Timeout | null = null;

  /**
   * Subscribe to real-time application updates
   */
  static subscribe(userId: number, callback: (update: ApplicationUpdate) => void): void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, []);
    }
    
    this.subscribers.get(userId)!.push(callback);
    
    // Start polling if not already started
    if (!this.pollingInterval) {
      this.startPolling();
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  static unsubscribe(userId: number, callback: (update: ApplicationUpdate) => void): void {
    const userSubscribers = this.subscribers.get(userId);
    if (userSubscribers) {
      const index = userSubscribers.indexOf(callback);
      if (index > -1) {
        userSubscribers.splice(index, 1);
      }
      
      // Clean up if no more subscribers for this user
      if (userSubscribers.length === 0) {
        this.subscribers.delete(userId);
      }
    }
    
    // Stop polling if no more subscribers
    if (this.subscribers.size === 0 && this.pollingInterval) {
      this.stopPolling();
    }
  }

  /**
   * Start polling for updates
   */
  private static startPolling(): void {
    // Poll every 10 seconds for updates
    this.pollingInterval = setInterval(() => {
      this.checkForUpdates();
    }, 10000);
  }

  /**
   * Stop polling for updates
   */
  private static stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Check for application updates and notify subscribers
   */
  private static async checkForUpdates(): Promise<void> {
    try {
      // In a real implementation, this would check for actual updates
      // For now, we'll simulate this with mock data
      
      // This is a placeholder - in a real implementation, you would:
      // 1. Check database for recent application status changes
      // 2. Compare with previous state
      // 3. Notify subscribers of changes
      
      // Simulate checking for updates
      console.log('Checking for application updates...');
      
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  /**
   * Notify subscribers of an application update
   */
  static notifySubscribers(userId: number, update: ApplicationUpdate): void {
    const userSubscribers = this.subscribers.get(userId);
    if (userSubscribers) {
      userSubscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error notifying subscriber:', error);
        }
      });
    }
  }

  /**
   * Send real-time notification for application status change
   */
  static async sendApplicationStatusUpdate(
    userId: number,
    applicationId: number,
    status: string,
    message: string
  ): Promise<void> {
    const update: ApplicationUpdate = {
      application_id: applicationId,
      status,
      message,
      timestamp: new Date().toISOString(),
      type: 'status_change'
    };

    // Notify real-time subscribers
    this.notifySubscribers(userId, update);

    // Also send traditional notification
    await NotificationService.sendNotification({
      recipient_id: userId,
      recipient_role: 'STUDENT', // This would be dynamic in a real implementation
      type: 'APPLICATION_SUBMITTED', // This would be dynamic based on the actual update
      title: 'Application Status Update',
      message: message,
      data: { application_id: applicationId, status },
      action_url: `/applications/${applicationId}`
    });
  }

  /**
   * Send real-time notification for tracking step update
   */
  static async sendTrackingUpdate(
    userId: number,
    applicationId: number,
    step: string,
    status: string,
    message: string
  ): Promise<void> {
    const update: ApplicationUpdate = {
      application_id: applicationId,
      status,
      message,
      timestamp: new Date().toISOString(),
      type: 'tracking_update'
    };

    // Notify real-time subscribers
    this.notifySubscribers(userId, update);

    // Also send traditional notification
    await NotificationService.sendNotification({
      recipient_id: userId,
      recipient_role: 'STUDENT', // This would be dynamic in a real implementation
      type: 'APPLICATION_SUBMITTED', // This would be dynamic based on the actual update
      title: `Tracking Update: ${step}`,
      message: message,
      data: { application_id: applicationId, step, status },
      action_url: `/applications/${applicationId}`
    });
  }

  /**
   * Send real-time notification for interview scheduling
   */
  static async sendInterviewScheduled(
    userId: number,
    applicationId: number,
    interviewDetails: any,
    message: string
  ): Promise<void> {
    const update: ApplicationUpdate = {
      application_id: applicationId,
      status: 'INTERVIEW_SCHEDULED',
      message,
      timestamp: new Date().toISOString(),
      type: 'interview_scheduled'
    };

    // Notify real-time subscribers
    this.notifySubscribers(userId, update);

    // Also send traditional notification
    await NotificationService.notifyInterviewScheduled(
      userId,
      'Internship Position', // This would be dynamic in a real implementation
      interviewDetails
    );
  }

  /**
   * Send real-time notification for offer extension
   */
  static async sendOfferExtended(
    userId: number,
    applicationId: number,
    offerDetails: any,
    message: string
  ): Promise<void> {
    const update: ApplicationUpdate = {
      application_id: applicationId,
      status: 'OFFER_EXTENDED',
      message,
      timestamp: new Date().toISOString(),
      type: 'offer_extended'
    };

    // Notify real-time subscribers
    this.notifySubscribers(userId, update);

    // Also send traditional notification
    await NotificationService.notifyOfferReceived(
      userId,
      'Internship Position', // This would be dynamic in a real implementation
      offerDetails
    );
  }
}