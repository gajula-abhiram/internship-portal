# Calendar Integration Documentation

## Overview

The Calendar Integration feature synchronizes application/interview timelines with exam and college event calendars, providing event-aware scheduling to avoid conflicts. This feature ensures that internship interviews and other events are scheduled in a way that doesn't conflict with academic commitments.

## Features

1. **Event Synchronization**
   - Sync application deadlines with calendar events
   - Sync interview schedules with calendar events
   - Sync internship start dates with calendar events

2. **Conflict Detection**
   - Detect scheduling conflicts with academic events
   - Prioritize conflicts based on event type
   - Provide suggested alternative time slots

3. **Event-Aware Scheduling**
   - Avoid scheduling interviews during exams
   - Avoid scheduling during academic events
   - Suggest optimal time slots based on user availability

4. **Academic Calendar Integration**
   - Support for exam schedules
   - Support for class schedules
   - Support for academic deadlines

## Architecture

### Components

1. **CalendarService** - Core service for calendar operations
2. **CalendarIntegration Component** - Frontend UI for calendar management
3. **useCalendar Hook** - React hook for calendar operations
4. **InterviewScheduler** - Enhanced interview scheduling with conflict detection
5. **ApplicationTracker** - Enhanced application tracking with calendar sync

### Data Model

The calendar events are stored in the `calendar_events` table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('INTERVIEW', 'EXAM', 'ACADEMIC', 'DEADLINE', 'PLACEMENT')),
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  organizer_id INTEGER,
  participants TEXT, -- JSON array of user IDs
  location TEXT,
  meeting_url TEXT,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);
```

## API Endpoints

### GET /api/calendar
Fetch calendar events for a user within a date range.

**Parameters:**
- `start_date` (required) - Start date in ISO format
- `end_date` (required) - End date in ISO format

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Internship Interview",
      "description": "Scheduled interview for internship application",
      "event_type": "INTERVIEW",
      "start_datetime": "2023-06-15T10:00:00Z",
      "end_datetime": "2023-06-15T11:00:00Z",
      "organizer_id": 2,
      "participants": [1, 2],
      "location": "Room 101",
      "meeting_url": null,
      "status": "SCHEDULED",
      "created_at": "2023-06-01T09:00:00Z"
    }
  ]
}
```

### POST /api/calendar
Create or manage calendar events.

**Actions:**
1. `create_event` - Create a new calendar event
2. `check_conflicts` - Check for scheduling conflicts
3. `sync_interview` - Sync interview with calendar
4. `create_academic_event` - Create academic calendar event

**Example Request:**
```json
{
  "action": "create_event",
  "data": {
    "title": "Final Exam",
    "description": "Final exam for Computer Science",
    "event_type": "EXAM",
    "start_datetime": "2023-06-20T09:00:00Z",
    "end_datetime": "2023-06-20T12:00:00Z",
    "participants": [1, 2, 3],
    "location": "Exam Hall A",
    "status": "SCHEDULED"
  }
}
```

## Frontend Components

### CalendarIntegration Component
A comprehensive UI for managing calendar events with conflict detection and optimal slot suggestions.

### useCalendar Hook
A React hook that provides calendar operations:

```typescript
const {
  events,           // Array of calendar events
  loading,          // Loading state
  error,            // Error message
  fetchEvents,      // Function to fetch events
  createEvent,      // Function to create events
  checkForConflicts, // Function to check conflicts
  syncInterviewWithCalendar, // Function to sync interviews
  syncApplicationTimeline,   // Function to sync application timelines
  findOptimalTimeSlots       // Function to find optimal slots
} = useCalendar(userId);
```

## Integration with Other Services

### Interview Scheduling
The InterviewScheduler now integrates with the CalendarService to:
- Check for conflicts before scheduling interviews
- Provide conflict-aware time slot suggestions
- Sync interviews with calendar events automatically

### Application Tracking
The ApplicationTracker integrates with the CalendarService to:
- Sync application deadlines with calendar events
- Sync internship start dates with calendar events
- Provide timeline visualization in the calendar

## Conflict Detection Logic

The system categorizes conflicts by priority:
1. **High Priority**: Exams
2. **Medium Priority**: Academic events and deadlines
3. **Low Priority**: Interviews, meetings, and other events

When conflicts are detected, the system provides suggested alternative time slots based on the conflict priority.

## Implementation Details

### Conflict Checking Algorithm
The conflict checking algorithm uses datetime overlap detection:

```sql
(start_datetime < ? AND end_datetime > ?) OR
(start_datetime < ? AND end_datetime > ?) OR
(start_datetime >= ? AND end_datetime <= ?)
```

### Optimal Slot Finding
The system generates time slots and filters them based on conflict count, prioritizing slots with fewer conflicts.

### Event Synchronization
When interviews or applications are scheduled, they are automatically synchronized with the calendar events table.

## Usage Examples

### Creating an Academic Event
```typescript
const calendarService = new CalendarService();
await calendarService.createAcademicEvent({
  title: "Midterm Exam",
  description: "Midterm exam for Database Systems",
  event_type: "EXAM",
  start_datetime: "2023-06-15T09:00:00Z",
  end_datetime: "2023-06-15T11:00:00Z",
  participants: [1, 2, 3, 4, 5],
  location: "Exam Hall B",
  status: "SCHEDULED"
});
```

### Checking for Conflicts
```typescript
const conflictCheck = await calendarService.checkForConflicts(
  userId,
  "2023-06-15T10:00:00Z",
  "2023-06-15T11:00:00Z"
);

if (conflictCheck.has_conflicts) {
  console.log("Conflicts found:", conflictCheck.conflicts);
  console.log("Suggested times:", conflictCheck.suggested_times);
}
```

### Finding Optimal Time Slots
```typescript
const optimalSlots = await calendarService.findOptimalTimeSlots(
  userId,
  "2023-06-01T00:00:00Z",
  "2023-06-30T23:59:59Z",
  60 // 60 minute duration
);

const conflictFreeSlots = optimalSlots.filter(slot => slot.conflicts.length === 0);
```

## Future Enhancements

1. **Calendar Import/Export** - Support for importing/exporting calendar events in standard formats (iCal, etc.)
2. **Recurring Events** - Support for recurring academic events (classes, office hours)
3. **Advanced Conflict Resolution** - More sophisticated conflict resolution algorithms
4. **Integration with External Calendars** - Sync with Google Calendar, Outlook, etc.
5. **Mobile Notifications** - Push notifications for calendar events
6. **Resource Booking** - Integration with room booking systems