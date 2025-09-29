import { useState, useEffect } from 'react';

interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  event_type: 'INTERVIEW' | 'EXAM' | 'ACADEMIC' | 'DEADLINE' | 'PLACEMENT' | 'OTHER';
  start_datetime: string;
  end_datetime: string;
  organizer_id?: number;
  participants?: number[];
  location?: string;
  meeting_url?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  created_at?: string;
}

interface ConflictCheckResult {
  has_conflicts: boolean;
  conflicts: CalendarEvent[];
  suggested_times: string[];
}

export const useCalendar = (userId: number) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarService, setCalendarService] = useState<any>(null);

  useEffect(() => {
    // Dynamically import CalendarService to avoid issues with Next.js build process
    const loadCalendarService = async () => {
      try {
        const { CalendarService } = await import('@/lib/calendar-service');
        setCalendarService(new CalendarService());
      } catch (err) {
        console.error('Failed to load CalendarService:', err);
        setError('Failed to initialize calendar service');
      }
    };

    loadCalendarService();
  }, []);

  const fetchEvents = async (startDate: string, endDate: string) => {
    if (!calendarService) return;
    
    setLoading(true);
    setError(null);
    try {
      const userEvents = await calendarService.getUserEvents(userId, startDate, endDate);
      setEvents(userEvents);
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<CalendarEvent, 'id' | 'created_at'>) => {
    if (!calendarService) return { success: false, error: 'Calendar service not initialized' };
    
    try {
      const event = await calendarService.createEvent(eventData);
      if (event) {
        return { success: true, event };
      } else {
        return { success: false, error: 'Failed to create event' };
      }
    } catch (err) {
      console.error('Error creating event:', err);
      return { success: false, error: 'Error creating event' };
    }
  };

  const checkForConflicts = async (
    startDateTime: string,
    endDateTime: string,
    excludeEventId?: number
  ): Promise<ConflictCheckResult> => {
    if (!calendarService) {
      return {
        has_conflicts: false,
        conflicts: [],
        suggested_times: []
      };
    }
    
    try {
      return await calendarService.checkForConflicts(userId, startDateTime, endDateTime, excludeEventId);
    } catch (err) {
      console.error('Error checking conflicts:', err);
      return {
        has_conflicts: false,
        conflicts: [],
        suggested_times: []
      };
    }
  };

  const syncInterviewWithCalendar = async (
    interviewId: number,
    applicationId: number,
    studentId: number,
    interviewerId: number,
    scheduledDateTime: string,
    durationMinutes: number = 60
  ) => {
    if (!calendarService) return { success: false, error: 'Calendar service not initialized' };
    
    try {
      const calendarEvent = await calendarService.syncInterviewWithCalendar(
        interviewId,
        applicationId,
        studentId,
        interviewerId,
        scheduledDateTime,
        durationMinutes
      );
      
      if (calendarEvent) {
        return { success: true, calendarEvent };
      } else {
        return { success: false, error: 'Failed to sync interview with calendar' };
      }
    } catch (err) {
      console.error('Error syncing interview with calendar:', err);
      return { success: false, error: 'Error syncing interview with calendar' };
    }
  };

  const syncApplicationTimeline = async (applicationId: number, studentId: number) => {
    if (!calendarService) return { success: false, error: 'Calendar service not initialized' };
    
    try {
      const success = await calendarService.syncApplicationTimeline(applicationId, studentId);
      return { success };
    } catch (err) {
      console.error('Error syncing application timeline:', err);
      return { success: false, error: 'Error syncing application timeline' };
    }
  };

  const findOptimalTimeSlots = async (
    startDate: string,
    endDate: string,
    durationMinutes: number = 60
  ) => {
    if (!calendarService) return [];
    
    try {
      const slots = await calendarService.findOptimalTimeSlots(userId, startDate, endDate, durationMinutes);
      return slots;
    } catch (err) {
      console.error('Error finding optimal time slots:', err);
      return [];
    }
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    checkForConflicts,
    syncInterviewWithCalendar,
    syncApplicationTimeline,
    findOptimalTimeSlots
  };
};