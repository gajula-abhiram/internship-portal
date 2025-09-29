// Calendar Integration Service
// Syncs application/internship timelines with exam and college event calendars
// Implements event-aware scheduling to avoid conflicts

export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  event_type: 'INTERVIEW' | 'EXAM' | 'ACADEMIC' | 'DEADLINE' | 'PLACEMENT' | 'OTHER';
  start_datetime: string; // ISO date string
  end_datetime: string; // ISO date string
  organizer_id?: number;
  participants?: number[]; // Array of user IDs
  location?: string;
  meeting_url?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  created_at?: string;
}

export interface ConflictCheckResult {
  has_conflicts: boolean;
  conflicts: CalendarEvent[];
  suggested_times: string[];
}

export class CalendarService {
  private db: any;
  private queries: any;

  constructor() {
    // Use dynamic imports to avoid issues with Next.js build process
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      const { getDatabase, getDbQueries } = await import('./database');
      this.db = getDatabase();
      this.queries = getDbQueries();
      
      // Wait for database initialization in serverless environments
      if (this.db === undefined) {
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 200));
        this.db = getDatabase();
        this.queries = getDbQueries();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      this.db = null;
      this.queries = null;
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'created_at'>): Promise<CalendarEvent | null> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const result = this.queries.createCalendarEvent.run(
          eventData.title,
          eventData.description || null,
          eventData.event_type,
          eventData.start_datetime,
          eventData.end_datetime,
          eventData.organizer_id || null,
          eventData.participants ? JSON.stringify(eventData.participants) : null,
          eventData.location || null,
          eventData.meeting_url || null,
          eventData.status
        );
        
        return {
          ...eventData,
          id: result.lastInsertRowid as number,
          created_at: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating calendar event in memory database:', error);
        return null;
      }
    }

    // Use SQLite database
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO calendar_events (
          title, description, event_type, start_datetime, end_datetime,
          organizer_id, participants, location, meeting_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        eventData.title,
        eventData.description || null,
        eventData.event_type,
        eventData.start_datetime,
        eventData.end_datetime,
        eventData.organizer_id || null,
        eventData.participants ? JSON.stringify(eventData.participants) : null,
        eventData.location || null,
        eventData.meeting_url || null,
        eventData.status
      );
      
      return {
        ...eventData,
        id: result.lastInsertRowid as number,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  /**
   * Get events for a user within a date range
   */
  async getUserEvents(userId: number, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const events = this.queries.getCalendarEventsByUser.all(userId, startDate, endDate);
        return events.map((event: any) => ({
          ...event,
          participants: Array.isArray(event.participants) ? event.participants : []
        }));
      } catch (error) {
        console.error('Error fetching user events from memory database:', error);
        return [];
      }
    }

    // Use SQLite database
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM calendar_events
        WHERE (
          organizer_id = ? 
          OR participants LIKE ? 
          OR participants LIKE ?
        )
        AND start_datetime >= ? 
        AND end_datetime <= ?
        ORDER BY start_datetime ASC
      `);
      
      // Query for events where user is organizer or participant
      const events = stmt.all(
        userId,
        `%[${userId}]%`, // Direct match in array
        `%${userId},%`,  // Match at beginning of array
        startDate,
        endDate
      );
      
      return events.map((event: any) => ({
        ...event,
        participants: event.participants ? JSON.parse(event.participants) : []
      }));
    } catch (error) {
      console.error('Error fetching user events:', error);
      return [];
    }
  }

  /**
   * Get all events for a specific date
   */
  async getEventsForDate(date: string, userId?: number): Promise<CalendarEvent[]> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const events = this.queries.getCalendarEventsForDate.all(date, userId);
        return events.map((event: any) => ({
          ...event,
          participants: Array.isArray(event.participants) ? event.participants : []
        }));
      } catch (error) {
        console.error('Error fetching events for date from memory database:', error);
        return [];
      }
    }

    // Use SQLite database
    if (!this.db) return [];

    try {
      let stmt;
      let params: any[];
      
      if (userId) {
        stmt = this.db.prepare(`
          SELECT * FROM calendar_events
          WHERE DATE(start_datetime) = DATE(?)
          AND (
            organizer_id = ? 
            OR participants LIKE ? 
            OR participants LIKE ?
          )
          ORDER BY start_datetime ASC
        `);
        
        params = [
          date,
          userId,
          `%[${userId}]%`,
          `%${userId},%`
        ];
      } else {
        stmt = this.db.prepare(`
          SELECT * FROM calendar_events
          WHERE DATE(start_datetime) = DATE(?)
          ORDER BY start_datetime ASC
        `);
        
        params = [date];
      }
      
      const events = stmt.all(...params);
      
      return events.map((event: any) => ({
        ...event,
        participants: event.participants ? JSON.parse(event.participants) : []
      }));
    } catch (error) {
      console.error('Error fetching events for date:', error);
      return [];
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async checkForConflicts(
    userId: number,
    startDateTime: string,
    endDateTime: string,
    excludeEventId?: number
  ): Promise<ConflictCheckResult> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const conflicts = this.queries.getCalendarEventsWithConflicts.all(
          userId,
          startDateTime,
          endDateTime,
          excludeEventId
        );
        
        const formattedConflicts = conflicts.map((event: any) => ({
          ...event,
          participants: Array.isArray(event.participants) ? event.participants : []
        }));
        
        // Generate suggested times if conflicts exist
        let suggestedTimes: string[] = [];
        if (formattedConflicts.length > 0) {
          suggestedTimes = this.generateSuggestedTimes(
            startDateTime,
            endDateTime,
            formattedConflicts
          );
        }
        
        return {
          has_conflicts: formattedConflicts.length > 0,
          conflicts: formattedConflicts,
          suggested_times: suggestedTimes
        };
      } catch (error) {
        console.error('Error checking for conflicts in memory database:', error);
        return {
          has_conflicts: false,
          conflicts: [],
          suggested_times: []
        };
      }
    }

    // Use SQLite database
    if (!this.db) {
      return {
        has_conflicts: false,
        conflicts: [],
        suggested_times: []
      };
    }

    try {
      // Get overlapping events
      let conflictQuery;
      let conflictParams: any[];
      
      if (excludeEventId) {
        conflictQuery = this.db.prepare(`
          SELECT * FROM calendar_events
          WHERE (
            organizer_id = ? 
            OR participants LIKE ? 
            OR participants LIKE ?
          )
          AND id != ?
          AND (
            (start_datetime < ? AND end_datetime > ?) OR
            (start_datetime < ? AND end_datetime > ?) OR
            (start_datetime >= ? AND end_datetime <= ?)
          )
        `);
        
        conflictParams = [
          userId,
          `%[${userId}]%`,
          `%${userId},%`,
          excludeEventId,
          endDateTime,
          startDateTime,
          startDateTime,
          endDateTime,
          startDateTime,
          endDateTime
        ];
      } else {
        conflictQuery = this.db.prepare(`
          SELECT * FROM calendar_events
          WHERE (
            organizer_id = ? 
            OR participants LIKE ? 
            OR participants LIKE ?
          )
          AND (
            (start_datetime < ? AND end_datetime > ?) OR
            (start_datetime < ? AND end_datetime > ?) OR
            (start_datetime >= ? AND end_datetime <= ?)
          )
        `);
        
        conflictParams = [
          userId,
          `%[${userId}]%`,
          `%${userId},%`,
          endDateTime,
          startDateTime,
          startDateTime,
          endDateTime,
          startDateTime,
          endDateTime
        ];
      }
      
      const conflicts = conflictQuery.all(...conflictParams);
      
      const formattedConflicts = conflicts.map((event: any) => ({
        ...event,
        participants: event.participants ? JSON.parse(event.participants) : []
      }));
      
      // Generate suggested times if conflicts exist
      let suggestedTimes: string[] = [];
      if (formattedConflicts.length > 0) {
        suggestedTimes = this.generateSuggestedTimes(
          startDateTime,
          endDateTime,
          formattedConflicts
        );
      }
      
      return {
        has_conflicts: formattedConflicts.length > 0,
        conflicts: formattedConflicts,
        suggested_times: suggestedTimes
      };
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return {
        has_conflicts: false,
        conflicts: [],
        suggested_times: []
      };
    }
  }

  /**
   * Generate suggested alternative times when conflicts exist
   */
  private generateSuggestedTimes(
    originalStart: string,
    originalEnd: string,
    conflicts: CalendarEvent[]
  ): string[] {
    const originalStartDt = new Date(originalStart);
    const originalEndDt = new Date(originalEnd);
    const duration = originalEndDt.getTime() - originalStartDt.getTime();
    
    const suggestions: string[] = [];
    
    // Try 1 hour before the original time
    const beforeStart = new Date(originalStartDt.getTime() - 3600000);
    const beforeEnd = new Date(beforeStart.getTime() + duration);
    suggestions.push(`${beforeStart.toISOString()} to ${beforeEnd.toISOString()}`);
    
    // Try 1 hour after the original time
    const afterStart = new Date(originalEndDt.getTime() + 3600000);
    const afterEnd = new Date(afterStart.getTime() + duration);
    suggestions.push(`${afterStart.toISOString()} to ${afterEnd.toISOString()}`);
    
    // Try next day at same time
    const nextDayStart = new Date(originalStartDt);
    nextDayStart.setDate(nextDayStart.getDate() + 1);
    const nextDayEnd = new Date(nextDayStart.getTime() + duration);
    suggestions.push(`${nextDayStart.toISOString()} to ${nextDayEnd.toISOString()}`);
    
    return suggestions;
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: number, eventData: Partial<CalendarEvent>): Promise<boolean> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const existingEvent = this.queries.getCalendarEventById.get(eventId);
        if (!existingEvent) return false;
        
        const updatedEvent = {
          ...existingEvent,
          ...eventData
        };
        
        const result = this.queries.updateCalendarEvent.run(
          eventId,
          updatedEvent.title,
          updatedEvent.description,
          updatedEvent.event_type,
          updatedEvent.start_datetime,
          updatedEvent.end_datetime,
          updatedEvent.organizer_id,
          updatedEvent.participants ? JSON.stringify(updatedEvent.participants) : null,
          updatedEvent.location,
          updatedEvent.meeting_url,
          updatedEvent.status
        );
        
        return result.changes > 0;
      } catch (error) {
        console.error('Error updating calendar event in memory database:', error);
        return false;
      }
    }

    // Use SQLite database
    if (!this.db) return false;

    try {
      const fields = [];
      const values = [];
      
      // Build dynamic update query
      if (eventData.title !== undefined) {
        fields.push('title = ?');
        values.push(eventData.title);
      }
      
      if (eventData.description !== undefined) {
        fields.push('description = ?');
        values.push(eventData.description);
      }
      
      if (eventData.event_type !== undefined) {
        fields.push('event_type = ?');
        values.push(eventData.event_type);
      }
      
      if (eventData.start_datetime !== undefined) {
        fields.push('start_datetime = ?');
        values.push(eventData.start_datetime);
      }
      
      if (eventData.end_datetime !== undefined) {
        fields.push('end_datetime = ?');
        values.push(eventData.end_datetime);
      }
      
      if (eventData.organizer_id !== undefined) {
        fields.push('organizer_id = ?');
        values.push(eventData.organizer_id);
      }
      
      if (eventData.participants !== undefined) {
        fields.push('participants = ?');
        values.push(JSON.stringify(eventData.participants));
      }
      
      if (eventData.location !== undefined) {
        fields.push('location = ?');
        values.push(eventData.location);
      }
      
      if (eventData.meeting_url !== undefined) {
        fields.push('meeting_url = ?');
        values.push(eventData.meeting_url);
      }
      
      if (eventData.status !== undefined) {
        fields.push('status = ?');
        values.push(eventData.status);
      }
      
      if (fields.length === 0) return false;
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      
      const query = `
        UPDATE calendar_events 
        SET ${fields.join(', ')}
        WHERE id = ?
      `;
      
      values.push(eventId);
      
      const stmt = this.db.prepare(query);
      stmt.run(...values);
      
      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: number): Promise<boolean> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const result = this.queries.deleteCalendarEvent.run(eventId);
        return result.changes > 0;
      } catch (error) {
        console.error('Error deleting calendar event from memory database:', error);
        return false;
      }
    }

    // Use SQLite database
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare('DELETE FROM calendar_events WHERE id = ?');
      stmt.run(eventId);
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  /**
   * Get upcoming events for a user
   */
  async getUpcomingEvents(userId: number, limit: number = 10): Promise<CalendarEvent[]> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const events = this.queries.getUpcomingCalendarEvents.all(userId, limit);
        return events.map((event: any) => ({
          ...event,
          participants: Array.isArray(event.participants) ? event.participants : []
        }));
      } catch (error) {
        console.error('Error fetching upcoming events from memory database:', error);
        return [];
      }
    }

    // Use SQLite database
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM calendar_events
        WHERE (
          organizer_id = ? 
          OR participants LIKE ? 
          OR participants LIKE ?
        )
        AND start_datetime >= datetime('now')
        ORDER BY start_datetime ASC
        LIMIT ?
      `);
      
      const events = stmt.all(
        userId,
        `%[${userId}]%`,
        `%${userId},%`,
        limit
      );
      
      return events.map((event: any) => ({
        ...event,
        participants: event.participants ? JSON.parse(event.participants) : []
      }));
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }

  /**
   * Sync interview schedules with calendar events
   */
  async syncInterviewWithCalendar(
    interviewId: number,
    applicationId: number,
    studentId: number,
    interviewerId: number,
    scheduledDateTime: string,
    durationMinutes: number = 60
  ): Promise<CalendarEvent | null> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        // Calculate end time
        const startDt = new Date(scheduledDateTime);
        const endDt = new Date(startDt.getTime() + durationMinutes * 60000);
        
        // Create calendar event for the interview
        const calendarEvent = await this.createEvent({
          title: 'Internship Interview',
          description: 'Scheduled interview for internship application',
          event_type: 'INTERVIEW',
          start_datetime: startDt.toISOString(),
          end_datetime: endDt.toISOString(),
          organizer_id: interviewerId,
          participants: [studentId, interviewerId],
          status: 'SCHEDULED'
        });
        
        return calendarEvent;
      } catch (error) {
        console.error('Error syncing interview with calendar in memory database:', error);
        return null;
      }
    }

    // Use SQLite database
    if (!this.db) return null;

    try {
      // Calculate end time
      const startDt = new Date(scheduledDateTime);
      const endDt = new Date(startDt.getTime() + durationMinutes * 60000);
      
      // Create calendar event for the interview
      const calendarEvent = await this.createEvent({
        title: 'Internship Interview',
        description: 'Scheduled interview for internship application',
        event_type: 'INTERVIEW',
        start_datetime: startDt.toISOString(),
        end_datetime: endDt.toISOString(),
        organizer_id: interviewerId,
        participants: [studentId, interviewerId],
        status: 'SCHEDULED'
      });
      
      return calendarEvent;
    } catch (error) {
      console.error('Error syncing interview with calendar:', error);
      return null;
    }
  }

  /**
   * Sync application timelines with calendar events
   */
  async syncApplicationTimeline(applicationId: number, studentId: number): Promise<boolean> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        // For memory database, we'll skip this functionality as it requires
        // joining with other tables which is complex to implement in memory
        console.log('Skipping application timeline sync in memory database (not implemented)');
        return true;
      } catch (error) {
        console.error('Error syncing application timeline in memory database:', error);
        return false;
      }
    }

    // Use SQLite database
    if (!this.db) return false;

    try {
      // Get application details
      const appStmt = this.db.prepare(`
        SELECT a.*, i.title as internship_title, i.application_deadline, i.start_date
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        WHERE a.id = ?
      `);
      
      const application = appStmt.get(applicationId);
      
      if (!application) return false;
      
      // Create deadline event if not exists
      if (application.application_deadline) {
        const deadlineEvents = this.db.prepare(`
          SELECT * FROM calendar_events 
          WHERE title LIKE ? AND start_datetime = ? AND event_type = 'DEADLINE'
        `).all(`Application Deadline: ${application.internship_title}`, application.application_deadline);
        
        if (deadlineEvents.length === 0) {
          await this.createEvent({
            title: `Application Deadline: ${application.internship_title}`,
            description: `Deadline for ${application.internship_title} application`,
            event_type: 'DEADLINE',
            start_datetime: application.application_deadline,
            end_datetime: new Date(new Date(application.application_deadline).getTime() + 3600000).toISOString(), // 1 hour duration
            participants: [studentId],
            status: 'SCHEDULED'
          });
        }
      }
      
      // Create start date event if not exists
      if (application.start_date) {
        const startEvents = this.db.prepare(`
          SELECT * FROM calendar_events 
          WHERE title LIKE ? AND start_datetime = ? AND event_type = 'PLACEMENT'
        `).all(`Internship Start: ${application.internship_title}`, application.start_date);
        
        if (startEvents.length === 0) {
          await this.createEvent({
            title: `Internship Start: ${application.internship_title}`,
            description: `Start date for ${application.internship_title}`,
            event_type: 'PLACEMENT',
            start_datetime: application.start_date,
            end_datetime: new Date(new Date(application.start_date).getTime() + 8 * 3600000).toISOString(), // 8 hours duration
            participants: [studentId],
            status: 'SCHEDULED'
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing application timeline:', error);
      return false;
    }
  }

  /**
   * Get exam schedule conflicts for a user
   */
  async getExamConflicts(userId: number, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const events = this.queries.getCalendarEventsByType.all(userId, 'EXAM', startDate, endDate);
        return events.map((event: any) => ({
          ...event,
          participants: Array.isArray(event.participants) ? event.participants : []
        }));
      } catch (error) {
        console.error('Error fetching exam conflicts from memory database:', error);
        return [];
      }
    }

    // Use SQLite database
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM calendar_events
        WHERE (
          organizer_id = ? 
          OR participants LIKE ? 
          OR participants LIKE ?
        )
        AND event_type = 'EXAM'
        AND start_datetime >= ? 
        AND end_datetime <= ?
        ORDER BY start_datetime ASC
      `);
      
      const exams = stmt.all(
        userId,
        `%[${userId}]%`,
        `%${userId},%`,
        startDate,
        endDate
      );
      
      return exams.map((exam: any) => ({
        ...exam,
        participants: exam.participants ? JSON.parse(exam.participants) : []
      }));
    } catch (error) {
      console.error('Error fetching exam conflicts:', error);
      return [];
    }
  }

  /**
   * Create academic calendar events (exams, classes, etc.)
   */
  async createAcademicEvent(eventData: Omit<CalendarEvent, 'id' | 'created_at'>): Promise<CalendarEvent | null> {
    // Set event type to academic if not specified
    const academicEventData = {
      ...eventData,
      event_type: eventData.event_type || 'ACADEMIC'
    };
    
    return await this.createEvent(academicEventData);
  }

  /**
   * Get all academic events for a user
   */
  async getAcademicEvents(userId: number, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const events = this.queries.getCalendarEventsByType.all(userId, 'ACADEMIC', startDate, endDate);
        return events.map((event: any) => ({
          ...event,
          participants: Array.isArray(event.participants) ? event.participants : []
        }));
      } catch (error) {
        console.error('Error fetching academic events from memory database:', error);
        return [];
      }
    }

    // Use SQLite database
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM calendar_events
        WHERE (
          organizer_id = ? 
          OR participants LIKE ? 
          OR participants LIKE ?
        )
        AND event_type IN ('EXAM', 'ACADEMIC')
        AND start_datetime >= ? 
        AND end_datetime <= ?
        ORDER BY start_datetime ASC
      `);
      
      const events = stmt.all(
        userId,
        `%[${userId}]%`,
        `%${userId},%`,
        startDate,
        endDate
      );
      
      return events.map((event: any) => ({
        ...event,
        participants: event.participants ? JSON.parse(event.participants) : []
      }));
    } catch (error) {
      console.error('Error fetching academic events:', error);
      return [];
    }
  }

  /**
   * Check for event-aware scheduling conflicts
   */
  async checkEventAwareConflicts(
    userId: number,
    startDateTime: string,
    endDateTime: string,
    eventType: 'INTERVIEW' | 'MEETING' | 'OTHER' = 'INTERVIEW'
  ): Promise<ConflictCheckResult> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database queries if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        const conflicts = this.queries.getCalendarEventsWithConflicts.all(
          userId,
          startDateTime,
          endDateTime
        );
        
        const formattedConflicts = conflicts.map((event: any) => ({
          ...event,
          participants: Array.isArray(event.participants) ? event.participants : []
        }));
        
        // Categorize conflicts by priority
        const highPriorityConflicts = formattedConflicts.filter(
          (event: CalendarEvent) => event.event_type === 'EXAM'
        );
        
        const mediumPriorityConflicts = formattedConflicts.filter(
          (event: CalendarEvent) => event.event_type === 'ACADEMIC' || event.event_type === 'DEADLINE'
        );
        
        const lowPriorityConflicts = formattedConflicts.filter(
          (event: CalendarEvent) => event.event_type === 'INTERVIEW' || event.event_type === 'PLACEMENT' || event.event_type === 'OTHER'
        );
        
        // Generate suggested times based on conflict priority
        let suggestedTimes: string[] = [];
        if (formattedConflicts.length > 0) {
          suggestedTimes = this.generateEventAwareSuggestions(
            startDateTime,
            endDateTime,
            highPriorityConflicts,
            mediumPriorityConflicts
          );
        }
        
        return {
          has_conflicts: formattedConflicts.length > 0,
          conflicts: formattedConflicts,
          suggested_times: suggestedTimes
        };
      } catch (error) {
        console.error('Error checking for event-aware conflicts in memory database:', error);
        return {
          has_conflicts: false,
          conflicts: [],
          suggested_times: []
        };
      }
    }

    // Use SQLite database
    if (!this.db) {
      return {
        has_conflicts: false,
        conflicts: [],
        suggested_times: []
      };
    }

    try {
      // Get all overlapping events
      const conflicts = this.db.prepare(`
        SELECT * FROM calendar_events
        WHERE (
          organizer_id = ? 
          OR participants LIKE ? 
          OR participants LIKE ?
        )
        AND (
          (start_datetime < ? AND end_datetime > ?) OR
          (start_datetime < ? AND end_datetime > ?) OR
          (start_datetime >= ? AND end_datetime <= ?)
        )
      `).all(
        userId,
        `%[${userId}]%`,
        `%${userId},%`,
        endDateTime,
        startDateTime,
        startDateTime,
        endDateTime,
        startDateTime,
        endDateTime
      );
      
      const formattedConflicts = conflicts.map((event: any) => ({
        ...event,
        participants: event.participants ? JSON.parse(event.participants) : []
      }));
      
      // Categorize conflicts by priority
      const highPriorityConflicts = formattedConflicts.filter(
        (event: CalendarEvent) => event.event_type === 'EXAM'
      );
      
      const mediumPriorityConflicts = formattedConflicts.filter(
        (event: CalendarEvent) => event.event_type === 'ACADEMIC' || event.event_type === 'DEADLINE'
      );
      
      const lowPriorityConflicts = formattedConflicts.filter(
        (event: CalendarEvent) => event.event_type === 'INTERVIEW' || event.event_type === 'PLACEMENT' || event.event_type === 'OTHER'
      );
      
      // Generate suggested times based on conflict priority
      let suggestedTimes: string[] = [];
      if (formattedConflicts.length > 0) {
        suggestedTimes = this.generateEventAwareSuggestions(
          startDateTime,
          endDateTime,
          highPriorityConflicts,
          mediumPriorityConflicts
        );
      }
      
      return {
        has_conflicts: formattedConflicts.length > 0,
        conflicts: formattedConflicts,
        suggested_times: suggestedTimes
      };
    } catch (error) {
      console.error('Error checking for event-aware conflicts:', error);
      return {
        has_conflicts: false,
        conflicts: [],
        suggested_times: []
      };
    }
  }

  /**
   * Generate event-aware suggested alternative times
   */
  private generateEventAwareSuggestions(
    originalStart: string,
    originalEnd: string,
    highPriorityConflicts: CalendarEvent[],
    mediumPriorityConflicts: CalendarEvent[]
  ): string[] {
    const originalStartDt = new Date(originalStart);
    const originalEndDt = new Date(originalEnd);
    const duration = originalEndDt.getTime() - originalStartDt.getTime();
    
    const suggestions: string[] = [];
    
    // Try 1 hour before the original time (if no high priority conflicts)
    if (highPriorityConflicts.length === 0) {
      const beforeStart = new Date(originalStartDt.getTime() - 3600000);
      const beforeEnd = new Date(beforeStart.getTime() + duration);
      suggestions.push(`${beforeStart.toISOString()} to ${beforeEnd.toISOString()}`);
    }
    
    // Try 1 hour after the original time (if no high priority conflicts)
    if (highPriorityConflicts.length === 0) {
      const afterStart = new Date(originalEndDt.getTime() + 3600000);
      const afterEnd = new Date(afterStart.getTime() + duration);
      suggestions.push(`${afterStart.toISOString()} to ${afterEnd.toISOString()}`);
    }
    
    // Try next day at same time (if no medium or high priority conflicts)
    if (highPriorityConflicts.length === 0 && mediumPriorityConflicts.length === 0) {
      const nextDayStart = new Date(originalStartDt);
      nextDayStart.setDate(nextDayStart.getDate() + 1);
      const nextDayEnd = new Date(nextDayStart.getTime() + duration);
      suggestions.push(`${nextDayStart.toISOString()} to ${nextDayEnd.toISOString()}`);
    }
    
    // Try next business day (avoiding weekends)
    const nextBusinessDayStart = new Date(originalStartDt);
    nextBusinessDayStart.setDate(nextBusinessDayStart.getDate() + 1);
    // Skip weekends
    if (nextBusinessDayStart.getDay() === 0) { // Sunday
      nextBusinessDayStart.setDate(nextBusinessDayStart.getDate() + 1);
    } else if (nextBusinessDayStart.getDay() === 6) { // Saturday
      nextBusinessDayStart.setDate(nextBusinessDayStart.getDate() + 2);
    }
    
    const nextBusinessDayEnd = new Date(nextBusinessDayStart.getTime() + duration);
    suggestions.push(`${nextBusinessDayStart.toISOString()} to ${nextBusinessDayEnd.toISOString()}`);
    
    return suggestions;
  }

  /**
   * Find optimal time slots avoiding academic conflicts
   */
  async findOptimalTimeSlots(
    userId: number,
    startDate: string,
    endDate: string,
    durationMinutes: number = 60
  ): Promise<{start_datetime: string, end_datetime: string, conflicts: CalendarEvent[]}[]> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        // Get all academic events for the user in the date range
        const academicEvents = await this.getAcademicEvents(userId, startDate, endDate);
        
        // Generate time slots (9 AM to 5 PM, every hour)
        const timeSlots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Skip weekends
          if (d.getDay() === 0 || d.getDay() === 6) continue;
          
          // Generate hourly slots from 9 AM to 5 PM
          for (let hour = 9; hour < 17; hour++) {
            const slotStart = new Date(d);
            slotStart.setHours(hour, 0, 0, 0);
            
            const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
            
            // Check for conflicts with academic events
            const conflicts = academicEvents.filter(event => {
              const eventStart = new Date(event.start_datetime);
              const eventEnd = new Date(event.end_datetime);
              
              return (
                (slotStart < eventEnd && slotEnd > eventStart) ||
                (slotStart >= eventStart && slotEnd <= eventEnd)
              );
            });
            
            timeSlots.push({
              start_datetime: slotStart.toISOString(),
              end_datetime: slotEnd.toISOString(),
              conflicts: conflicts
            });
          }
        }
        
        // Sort by number of conflicts (least conflicts first)
        return timeSlots.sort((a, b) => a.conflicts.length - b.conflicts.length);
      } catch (error) {
        console.error('Error finding optimal time slots in memory database:', error);
        return [];
      }
    }

    // Use SQLite database
    if (!this.db) return [];

    try {
      // Get all academic events for the user in the date range
      const academicEvents = await this.getAcademicEvents(userId, startDate, endDate);
      
      // Generate time slots (9 AM to 5 PM, every hour)
      const timeSlots = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        // Skip weekends
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        
        // Generate hourly slots from 9 AM to 5 PM
        for (let hour = 9; hour < 17; hour++) {
          const slotStart = new Date(d);
          slotStart.setHours(hour, 0, 0, 0);
          
          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
          
          // Check for conflicts with academic events
          const conflicts = academicEvents.filter(event => {
            const eventStart = new Date(event.start_datetime);
            const eventEnd = new Date(event.end_datetime);
            
            return (
              (slotStart < eventEnd && slotEnd > eventStart) ||
              (slotStart >= eventStart && slotEnd <= eventEnd)
            );
          });
          
          timeSlots.push({
            start_datetime: slotStart.toISOString(),
            end_datetime: slotEnd.toISOString(),
            conflicts: conflicts
          });
        }
      }
      
      // Sort by number of conflicts (least conflicts first)
      return timeSlots.sort((a, b) => a.conflicts.length - b.conflicts.length);
    } catch (error) {
      console.error('Error finding optimal time slots:', error);
      return [];
    }
  }

  /**
   * Reschedule event to avoid conflicts
   */
  async rescheduleEventToAvoidConflicts(
    eventId: number,
    userId: number
  ): Promise<{success: boolean, new_event?: CalendarEvent, message?: string}> {
    // Wait for database initialization
    if (this.db === undefined || this.queries === undefined) {
      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use memory database if db is null (Vercel environment)
    if ((!this.db && this.queries) || (this.db === null && this.queries)) {
      try {
        // Get the event to reschedule
        const event = this.queries.getCalendarEventById.get(eventId);
        
        if (!event) {
          return { success: false, message: 'Event not found' };
        }
        
        // Parse participants
        const participants = Array.isArray(event.participants) ? event.participants : [];
        
        // Check if user is organizer or participant
        if (event.organizer_id !== userId && !participants.includes(userId)) {
          return { success: false, message: 'User not authorized to reschedule this event' };
        }
        
        // Get academic events for the next week
        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week from now
        
        // Find optimal time slots
        const optimalSlots = await this.findOptimalTimeSlots(
          userId, 
          startDate, 
          endDate, 
          Math.floor((new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()) / 60000)
        );
        
        // Find first slot with no conflicts
        const conflictFreeSlot = optimalSlots.find(slot => slot.conflicts.length === 0);
        
        if (!conflictFreeSlot) {
          return { success: false, message: 'No conflict-free time slots found within the next week' };
        }
        
        // Update the event with new time
        const updateSuccess = await this.updateEvent(eventId, {
          start_datetime: conflictFreeSlot.start_datetime,
          end_datetime: conflictFreeSlot.end_datetime,
          status: 'RESCHEDULED'
        });
        
        if (updateSuccess) {
          // Return updated event
          const updatedEvent = this.queries.getCalendarEventById.get(eventId);
          
          return {
            success: true,
            new_event: {
              ...updatedEvent,
              participants: Array.isArray(updatedEvent.participants) ? updatedEvent.participants : []
            }
          };
        } else {
          return { success: false, message: 'Failed to update event' };
        }
      } catch (error) {
        console.error('Error rescheduling event in memory database:', error);
        return { success: false, message: 'Error occurred while rescheduling event' };
      }
    }

    // Use SQLite database
    if (!this.db) {
      return { success: false, message: 'Database connection failed' };
    }

    try {
      // Get the event to reschedule
      const eventStmt = this.db.prepare('SELECT * FROM calendar_events WHERE id = ?');
      const event = eventStmt.get(eventId);
      
      if (!event) {
        return { success: false, message: 'Event not found' };
      }
      
      // Parse participants
      const participants = event.participants ? JSON.parse(event.participants) : [];
      
      // Check if user is organizer or participant
      if (event.organizer_id !== userId && !participants.includes(userId)) {
        return { success: false, message: 'User not authorized to reschedule this event' };
      }
      
      // Get academic events for the next week
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week from now
      
      // Find optimal time slots
      const optimalSlots = await this.findOptimalTimeSlots(
        userId, 
        startDate, 
        endDate, 
        Math.floor((new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()) / 60000)
      );
      
      // Find first slot with no conflicts
      const conflictFreeSlot = optimalSlots.find(slot => slot.conflicts.length === 0);
      
      if (!conflictFreeSlot) {
        return { success: false, message: 'No conflict-free time slots found within the next week' };
      }
      
      // Update the event with new time
      const updateSuccess = await this.updateEvent(eventId, {
        start_datetime: conflictFreeSlot.start_datetime,
        end_datetime: conflictFreeSlot.end_datetime,
        status: 'RESCHEDULED'
      });
      
      if (updateSuccess) {
        // Return updated event
        const updatedEventStmt = this.db.prepare('SELECT * FROM calendar_events WHERE id = ?');
        const updatedEvent = updatedEventStmt.get(eventId);
        
        return {
          success: true,
          new_event: {
            ...updatedEvent,
            participants: updatedEvent.participants ? JSON.parse(updatedEvent.participants) : []
          }
        };
      } else {
        return { success: false, message: 'Failed to update event' };
      }
    } catch (error) {
      console.error('Error rescheduling event:', error);
      return { success: false, message: 'Error occurred while rescheduling event' };
    }
  }
}