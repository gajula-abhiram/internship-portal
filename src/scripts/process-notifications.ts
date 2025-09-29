#!/usr/bin/env node

/**
 * Script to process scheduled notifications
 * This script should be run periodically (e.g., every 15 minutes) to process due notifications
 */

import { NotificationScheduler } from '../lib/notification-scheduler';

async function run() {
  try {
    console.log('🔄 Starting notification processing...');
    
    // Process all scheduled notifications
    await NotificationScheduler.processAllScheduledNotifications();
    
    console.log('✅ Notification processing completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error processing notifications:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  run();
}

export default run;