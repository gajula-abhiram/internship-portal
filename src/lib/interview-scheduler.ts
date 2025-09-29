// Enhanced Interview Scheduling System with Calendar Sync
// Implements "interview calendars synchronise with academic timetables"
// Full calendar integration with conflict detection and automated scheduling

export interface InterviewSlot {
  id: string;
  application_id: number;
  interviewer_id: number;
  student_id: number;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  mode: 'ONLINE' | 'OFFLINE' | 'PHONE';
  meeting_link?: string;
  location?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  created_at: string;
}

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description: string;
  attendees: string[];
  location?: string;
  meeting_link?: string;
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
  conflictReason?: string;
}

export class InterviewScheduler {
  
  /**
   * Get available time slots for interviewer
   */
  static async getAvailableSlots(
    interviewerId: number, 
    startDate: string, 
    endDate: string,
    duration: number = 60
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Initialize calendar service with dynamic import
    let calendarService: any = null;
    try {
      const { CalendarService } = await import('./calendar-service');
      calendarService = new CalendarService();
    } catch (error) {
      console.error('Failed to initialize calendar service:', error);
      throw new Error('Failed to initialize calendar service');
    }
    
    // Generate slots for each day
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      
      // Generate hourly slots from 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = new Date(d);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);
        
        // Check for conflicts using calendar service
        const conflictCheck = await calendarService.checkForConflicts(
          interviewerId,
          slotStart.toISOString(),
          slotEnd.toISOString()
        );
        
        const timeSlot: TimeSlot = {
          date: d.toISOString().split('T')[0],
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: !conflictCheck.has_conflicts
        };
        
        if (conflictCheck.has_conflicts) {
          timeSlot.conflictReason = InterviewScheduler.getConflictReasonFromEvents(conflictCheck.conflicts);
        }
        
        slots.push(timeSlot);
      }
    }
    
    return slots;
  }
  
  /**
   * Schedule interview
   */
  static async scheduleInterview(
    applicationId: number,
    interviewerId: number,
    studentId: number,
    dateTime: string,
    mode: 'ONLINE' | 'OFFLINE' | 'PHONE',
    duration: number = 60,
    notes?: string
  ): Promise<InterviewSlot> {
    const interviewId = InterviewScheduler.generateInterviewId();
    const scheduledDate = new Date(dateTime);
    
    // Initialize calendar service with dynamic import
    let calendarService: any = null;
    try {
      const { CalendarService } = await import('./calendar-service');
      calendarService = new CalendarService();
    } catch (error) {
      console.error('Failed to initialize calendar service:', error);
      throw new Error('Failed to initialize calendar service');
    }
    
    // Validate slot availability using calendar service
    const conflictCheck = await calendarService.checkForConflicts(
      interviewerId,
      scheduledDate.toISOString(),
      new Date(scheduledDate.getTime() + duration * 60000).toISOString()
    );
    
    if (conflictCheck.has_conflicts) {
      throw new Error(`Selected time slot has conflicts: ${InterviewScheduler.getConflictReasonFromEvents(conflictCheck.conflicts)}`);
    }
    
    const interview: InterviewSlot = {
      id: interviewId,
      application_id: applicationId,
      interviewer_id: interviewerId,
      student_id: studentId,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      scheduled_time: scheduledDate.toTimeString().split(' ')[0].substring(0, 5),
      duration_minutes: duration,
      mode,
      status: 'SCHEDULED',
      notes,
      created_at: new Date().toISOString()
    };
    
    // Generate meeting link for online interviews
    if (mode === 'ONLINE') {
      interview.meeting_link = await InterviewScheduler.generateMeetingLink(interview);
    }
    
    // Store interview in database (mock)
    await InterviewScheduler.storeInterview(interview);
    
    // Send calendar invites
    await InterviewScheduler.sendCalendarInvites(interview);
    
    // Send notifications
    await InterviewScheduler.sendInterviewNotifications(interview);
    
    return interview;
  }
  
  /**
   * Update interview status
   */
  static async updateInterviewStatus(
    interviewId: string, 
    status: InterviewSlot['status'],
    notes?: string
  ): Promise<void> {
    console.log(`Updated interview ${interviewId} status to ${status}`);
    
    // In production:
    // - Update database
    // - Send notifications to all parties
    // - Update calendar events
  }
  
  /**
   * Get conflict reason from conflicting events
   */
  private static getConflictReasonFromEvents(conflicts: any[]): string {
    if (conflicts.length === 0) return '';
    
    // Check for high priority conflicts first (exams, classes)
    const examConflict = conflicts.find(event => event.event_type === 'EXAM');
    if (examConflict) return `Exam scheduled: ${examConflict.title}`;
    
    const academicConflict = conflicts.find(event => event.event_type === 'ACADEMIC');
    if (academicConflict) return `Academic event: ${academicConflict.title}`;
    
    // Return first conflict
    return `Conflict with: ${conflicts[0].title}`;
  }
  
  /**
   * Generate unique interview ID
   */
  private static generateInterviewId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `INT-${timestamp}-${random}`.toUpperCase();
  }
  
  /**
   * Generate meeting link for online interviews
   */
  private static async generateMeetingLink(interview: InterviewSlot): Promise<string> {
    // In production, integrate with:
    // - Google Meet API
    // - Zoom API
    // - Microsoft Teams API
    
    // For now, generate a mock meeting link
    return `https://meet.example.com/${interview.id}`;
  }
  
  /**
   * Store interview in database (mock implementation)
   */
  private static async storeInterview(interview: InterviewSlot): Promise<void> {
    // In production, store in database
    console.log('Storing interview:', interview);
  }
  
  /**
   * Send calendar invites to participants
   */
  private static async sendCalendarInvites(interview: InterviewSlot): Promise<void> {
    // In production, send calendar invites via:
    // - Google Calendar API
    // - Outlook Calendar API
    // - iCalendar attachments
    
    console.log('Sending calendar invites for interview:', interview.id);
  }
  
  /**
   * Send interview notifications to participants
   */
  private static async sendInterviewNotifications(interview: InterviewSlot): Promise<void> {
    // In production, send notifications via:
    // - Email
    // - SMS
    // - In-app notifications
    
    console.log('Sending interview notifications for interview:', interview.id);
  }
  
  /**
   * Reschedule interview to avoid conflicts
   */
  static async rescheduleToAvoidConflicts(
    interviewId: string,
    applicationId: number,
    studentId: number,
    interviewerId: number
  ): Promise<{success: boolean, new_datetime?: string, message?: string}> {
    // Initialize calendar service with dynamic import
    let calendarService: any = null;
    try {
      const { CalendarService } = await import('./calendar-service');
      calendarService = new CalendarService();
    } catch (error) {
      console.error('Failed to initialize calendar service:', error);
      return { success: false, message: 'Failed to initialize calendar service' };
    }
    
    try {
      // Use calendar service to find optimal time slots
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days
      
      const optimalSlots = await calendarService.findOptimalTimeSlots(
        interviewerId,
        startDate,
        endDate,
        60 // Default 60 minutes
      );
      
      // Find first slot with no conflicts
      const conflictFreeSlot = optimalSlots.find((slot: any) => slot.conflicts.length === 0);
      
      if (!conflictFreeSlot) {
        return { success: false, message: 'No conflict-free time slots found within the next week' };
      }
      
      // Schedule interview at new time
      const newInterview = await InterviewScheduler.scheduleInterview(
        applicationId,
        interviewerId,
        studentId,
        conflictFreeSlot.start_datetime,
        'ONLINE', // Default to online
        60, // Default 60 minutes
        'Rescheduled to avoid conflicts'
      );
      
      return {
        success: true,
        new_datetime: newInterview.scheduled_date + ' ' + newInterview.scheduled_time,
        message: 'Interview successfully rescheduled'
      };
    } catch (error) {
      console.error('Error rescheduling interview:', error);
      return { success: false, message: 'Error occurred while rescheduling interview' };
    }
  }
  
  /**
   * Get upcoming interviews for a user
   */
  static async getUpcomingInterviews(
    userId: number,
    limit: number = 10
  ): Promise<InterviewSlot[]> {
    // Initialize calendar service with dynamic import
    let calendarService: any = null;
    try {
      const { CalendarService } = await import('./calendar-service');
      calendarService = new CalendarService();
    } catch (error) {
      console.error('Failed to initialize calendar service:', error);
      return [];
    }
    
    try {
      // Get upcoming calendar events of type INTERVIEW
      const upcomingEvents = await calendarService.getUpcomingEvents(userId, limit);
      
      const interviewEvents = upcomingEvents.filter((event: any) => event.event_type === 'INTERVIEW');
      
      // Convert to InterviewSlot format
      return interviewEvents.map((event: any) => {
        const startDt = new Date(event.start_datetime);
        return {
          id: `event-${event.id}`,
          application_id: 0, // Not available from calendar event
          interviewer_id: event.organizer_id || 0,
          student_id: event.participants?.[0] || 0,
          scheduled_date: startDt.toISOString().split('T')[0],
          scheduled_time: startDt.toTimeString().split(' ')[0].substring(0, 5),
          duration_minutes: Math.floor((new Date(event.end_datetime).getTime() - startDt.getTime()) / 60000),
          mode: event.meeting_url ? 'ONLINE' : 'OFFLINE',
          meeting_link: event.meeting_url,
          location: event.location,
          status: event.status as InterviewSlot['status'],
          notes: event.description,
          created_at: event.created_at || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error fetching upcoming interviews:', error);
      return [];
    }
  }
}