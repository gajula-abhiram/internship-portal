# Cross-Department Internship Notifications & Automatic Certificate Upload

This document explains the implementation of cross-department internship notifications and automatic certificate upload to student profiles.

## Features Implemented

### 1. Automatic Certificate Upload to Student Profiles

When a student completes an internship, the system now automatically:
- Generates a completion certificate
- Uploads the certificate to the student's profile
- Updates the student's employability record
- Notifies the student about the certificate availability

#### Key Components:
- **CertificateGenerator.ts**: Enhanced to automatically upload certificates to user profiles
- **ProfileManager.ts**: Integrated with certificate system to display user certificates
- **Database**: Added `user_certificates` table to store certificate references

### 2. Cross-Department Internship Notifications

Students are now notified about internship opportunities in other departments through:
- Automated notifications when new internships are posted
- Email alerts with details about cross-department opportunities
- Dashboard integration to view opportunities from other departments

#### Key Components:
- **CrossDepartmentNotificationService.ts**: New service to handle cross-department notifications
- **NotificationService.ts**: Extended to support cross-department notification types
- **EmailService.ts**: Added email template for cross-department opportunities
- **NotificationScheduler.ts**: Integrated cross-department notifications into scheduled tasks

## Technical Implementation

### Certificate Upload Process

1. When an internship is marked as completed, the system generates a certificate
2. The certificate is automatically uploaded to the student's profile
3. A reference to the certificate is stored in the `user_certificates` table
4. The student receives a notification about their new certificate
5. The certificate is visible in the student's profile

### Cross-Department Notification Process

1. The system periodically checks for new internships in departments other than the student's
2. Students who haven't applied to these internships are notified
3. Notifications include details about the opportunities
4. Students can view all cross-department opportunities through the dashboard

## Database Changes

### New Table: user_certificates
```sql
CREATE TABLE IF NOT EXISTS user_certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  certificate_url TEXT NOT NULL,
  certificate_id TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### Enhanced notifications table
Added support for 'CROSS_DEPARTMENT' notification type.

## API Endpoints

### Notification Processing
- `POST /api/notifications/scheduled/process` - Process all scheduled notifications
- `GET /api/notifications/scheduled/trigger` - Manually trigger notification processing

### Cross-Department Opportunities
- `GET /api/notifications/cross-department` - Get cross-department opportunities for a student

## Email Templates

### Cross-Department Opportunities
A new email template notifies students about internships in other departments with:
- List of recommended opportunities
- Details about each internship
- Direct link to view all opportunities

## Integration Points

### Profile Manager
- Displays user certificates in student profiles
- Checks for cross-department opportunities when viewing profiles

### Notification System
- Sends cross-department notifications to students
- Supports new notification types and email templates

### Certificate Generator
- Automatically uploads certificates to user profiles
- Notifies students when certificates are ready

## Setup Instructions

1. Ensure the database is updated with the new `user_certificates` table
2. Configure SMTP settings for email notifications
3. Set up cron jobs to run notification processing periodically:
   ```bash
   */30 * * * * cd /path/to/your/app && npm run process-notifications
   ```

## Testing

To test the implementation:

1. Complete an internship for a student
2. Verify the certificate is automatically uploaded to their profile
3. Check that the student receives a notification about their certificate
4. Post an internship in a department different from a student's department
5. Verify the student receives a cross-department notification

## Future Enhancements

1. Add filtering options for cross-department notifications
2. Implement recommendation algorithms for better cross-department matching
3. Add analytics for cross-department application success rates
4. Enhance certificate viewing capabilities in student profiles