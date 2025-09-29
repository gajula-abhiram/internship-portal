# Automated Notification System

This document explains how to set up and use the automated notification system for deadlines, interviews, approvals, and feedback.

## Overview

The notification system provides automated email and push notifications for:
- Application deadlines
- Interview schedules
- Approval reminders
- Feedback requests

## Components

### 1. Notification Scheduler
Located at `src/lib/notification-scheduler.ts`, this service handles:
- Scheduling notifications for future delivery
- Processing due notifications
- Scheduling reminders for deadlines, interviews, approvals, and feedback

### 2. Notification Service
Located at `src/lib/notification-system.ts`, this service handles:
- Sending notifications to users
- Email template management
- Notification storage

### 3. Email Service
Located at `src/lib/email-service.ts`, this service handles:
- Email delivery
- Email template rendering
- Bulk email sending

### 4. API Endpoints
- `POST /api/notifications/scheduled/process` - Process all scheduled notifications
- `GET /api/notifications/scheduled/trigger` - Manually trigger notification processing

## Setup

### 1. Environment Variables
Add the following to your `.env` file:
```env
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
CRON_AUTH_TOKEN=your-secret-token-for-cron-jobs
```

### 2. Database Schema
The system uses the existing notifications table with additional fields:
- `scheduled_for` - When the notification should be sent
- `sent_at` - When the notification was actually sent
- `priority` - Priority level (LOW, NORMAL, HIGH, URGENT)

### 3. Cron Job Setup
To process scheduled notifications automatically, set up a cron job to run every 15 minutes:

```bash
# Run every 15 minutes
*/15 * * * * cd /path/to/your/app && npm run process-notifications

# Or call the API endpoint
*/15 * * * * curl -X GET "http://localhost:3000/api/notifications/scheduled/trigger" -H "Authorization: Bearer your-secret-token"
```

## Notification Types

### Deadline Reminders
- Sent 1 day and 1 week before application deadlines
- Priority: NORMAL (1 week), HIGH (1 day)

### Interview Reminders
- Sent 1 day and 1 hour before scheduled interviews
- Priority: NORMAL (1 day), HIGH (1 hour)

### Approval Reminders
- Sent for applications pending mentor approval for more than 24 hours
- Priority: NORMAL

### Feedback Reminders
- Sent for completed internships without feedback after 3 days
- Priority: NORMAL

## Email Templates

The system includes email templates for:
- Deadline reminders
- Interview reminders
- Approval reminders
- Feedback requests

Each template is customizable and includes responsive HTML design.

## Testing

To test the notification system:

1. Manually trigger notification processing:
```bash
npm run process-notifications
```

2. Or call the API endpoint:
```bash
curl -X GET "http://localhost:3000/api/notifications/scheduled/trigger"
```

## Monitoring

The system logs all notification activities:
- Scheduled notifications
- Sent notifications
- Failed notifications

Check your application logs for monitoring information.

## Customization

To customize notification behavior:
1. Modify scheduling logic in `NotificationScheduler`
2. Update email templates in `EmailService`
3. Adjust notification content in `NotificationService`

## Troubleshooting

### No notifications being sent
- Check SMTP configuration
- Verify cron job is running
- Check application logs for errors

### Email delivery issues
- Verify SMTP credentials
- Check email provider restrictions
- Review spam/junk folders

### Database connection errors
- Verify database permissions
- Check database file permissions
- Ensure database is not locked