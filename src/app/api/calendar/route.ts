import { NextRequest } from 'next/server';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';
import { ApplicationTracker } from '@/lib/application-tracker';

let calendarService: any = null;
let applicationTracker: any = null;

// Initialize services with dynamic imports
const initializeServices = async () => {
  if (!calendarService || !applicationTracker) {
    try {
      const { CalendarService } = await import('@/lib/calendar-service');
      const { ApplicationTracker: AppTracker } = await import('@/lib/application-tracker');
      calendarService = new CalendarService();
      applicationTracker = new AppTracker();
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw new Error('Failed to initialize calendar services');
    }
  }
};

/**
 * GET /api/calendar?start_date={date}&end_date={date}
 * Get calendar events for user
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    await initializeServices();
    
    const user = req.user!;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return ApiResponse.error('Start date and end date are required', 400);
    }

    const events = await calendarService.getUserEvents(user.id, startDate, endDate);
    
    return ApiResponse.success(events);
  } catch (error) {
    console.error('Get calendar events error:', error);
    return ApiResponse.serverError('Failed to fetch calendar events');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);

/**
 * POST /api/calendar
 * Create or manage calendar events
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    await initializeServices();
    
    const body = await req.json();
    const { action, data } = body;
    const user = req.user!;

    switch (action) {
      case 'create_event':
        if (!data.title || !data.start_datetime || !data.end_datetime) {
          return ApiResponse.error('Title, start datetime, and end datetime are required', 400);
        }

        const event = await calendarService.createEvent({
          title: data.title,
          description: data.description,
          event_type: data.event_type || 'OTHER',
          start_datetime: data.start_datetime,
          end_datetime: data.end_datetime,
          organizer_id: data.organizer_id || user.id,
          participants: data.participants || [user.id],
          location: data.location,
          meeting_url: data.meeting_url,
          status: data.status || 'SCHEDULED'
        });

        if (event) {
          return ApiResponse.success({ 
            message: 'Event created successfully',
            event
          }, 201);
        } else {
          return ApiResponse.error('Failed to create event', 500);
        }

      case 'check_conflicts':
        if (!data.start_datetime || !data.end_datetime) {
          return ApiResponse.error('Start datetime and end datetime are required', 400);
        }

        const conflictCheck = await calendarService.checkForConflicts(
          user.id,
          data.start_datetime,
          data.end_datetime,
          data.exclude_event_id
        );

        return ApiResponse.success(conflictCheck);

      case 'sync_interview':
        if (!data.application_id || !data.interview_id || !data.scheduled_datetime) {
          return ApiResponse.error('Application ID, interview ID, and scheduled datetime are required', 400);
        }

        // Get interview details
        const interviews: any[] = await applicationTracker.getInterviews(data.application_id);
        const interview = interviews.find((i: any) => i.id === data.interview_id);
        
        if (!interview) {
          return ApiResponse.notFound('Interview not found');
        }

        // Sync with calendar
        const calendarEvent = await calendarService.syncInterviewWithCalendar(
          interview.id!, // Use the actual database ID
          data.application_id,
          interview.student_id,
          interview.interviewer_id,
          data.scheduled_datetime,
          interview.duration_minutes
        );

        if (calendarEvent) {
          return ApiResponse.success({ 
            message: 'Interview synced with calendar successfully',
            calendar_event: calendarEvent
          });
        } else {
          return ApiResponse.error('Failed to sync interview with calendar', 500);
        }

      case 'create_academic_event':
        if (!data.title || !data.start_datetime || !data.end_datetime) {
          return ApiResponse.error('Title, start datetime, and end datetime are required', 400);
        }

        const academicEvent = await calendarService.createAcademicEvent({
          title: data.title,
          description: data.description,
          event_type: data.event_type || 'ACADEMIC',
          start_datetime: data.start_datetime,
          end_datetime: data.end_datetime,
          organizer_id: data.organizer_id || user.id,
          participants: data.participants,
          location: data.location,
          status: data.status || 'SCHEDULED'
        });

        if (academicEvent) {
          return ApiResponse.success({ 
            message: 'Academic event created successfully',
            event: academicEvent
          }, 201);
        } else {
          return ApiResponse.error('Failed to create academic event', 500);
        }

      default:
        return ApiResponse.error('Invalid action', 400);
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    return ApiResponse.serverError('Failed to process calendar request');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);