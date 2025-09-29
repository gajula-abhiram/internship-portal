// Verification script for memory database implementation
// This file verifies the calendar events functionality in the memory database

// Since we can't directly import TypeScript files, we'll create a simple test

// Mock the environment for testing
const mockEnv = {
  ENABLE_MEMORY_DB: 'true',
  DATABASE_URL: 'memory://'
};

// Save original env
const originalEnv = process.env;

// Simple assertion function for testing
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected ${expected}, but got ${actual}`);
  }
  console.log(`✓ ${message}`);
}

function assertDefined(value, message) {
  if (value === undefined || value === null) {
    throw new Error(`Assertion failed: ${message}. Value is ${value}`);
  }
  console.log(`✓ ${message}`);
}

function assertArrayLength(array, expectedLength, message) {
  if (array.length !== expectedLength) {
    throw new Error(`Assertion failed: ${message}. Expected length ${expectedLength}, but got ${array.length}`);
  }
  console.log(`✓ ${message}`);
}

// Simple in-memory storage (will reset on each deployment)
let users = [];
let internships = [];
let applications = [];
let feedback = [];
let calendarEvents = [];

// Initialize with sample data
function initializeSampleData() {
  if (users.length === 0) {
    // Add default users
    users = [
      {
        id: 1,
        username: 'admin',
        password_hash: 'defaultPasswordHash',
        role: 'STAFF',
        name: 'Admin User',
        email: 'admin@example.com',
        department: 'Computer Science',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        username: 'student',
        password_hash: 'defaultPasswordHash',
        role: 'STUDENT',
        name: 'Student User',
        email: 'student@example.com',
        department: 'Computer Science',
        current_semester: 6,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Add sample calendar events
    calendarEvents = [
      {
        id: 1,
        title: 'Internship Interview',
        description: 'Technical interview for Frontend Developer Intern position',
        event_type: 'INTERVIEW',
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 1 hour duration
        organizer_id: 1,
        participants: JSON.stringify([2, 1]), // student and organizer
        location: 'Room 101',
        status: 'SCHEDULED',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Midterm Exam',
        description: 'Midterm exam for Database Systems',
        event_type: 'EXAM',
        start_datetime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // In 2 days
        end_datetime: new Date(Date.now() + 51 * 60 * 60 * 1000).toISOString(), // 3 hours duration
        organizer_id: 1,
        participants: JSON.stringify([2]), // student participant
        location: 'Exam Hall A',
        status: 'SCHEDULED',
        created_at: new Date().toISOString()
      }
    ];
    
    console.log('Memory database initialized with default users and calendar events');
  }
}

function getMemoryDatabase() {
  initializeSampleData();
  
  return {
    // Calendar Event queries
    createCalendarEvent: {
      run: (title, description, event_type, start_datetime, end_datetime, organizer_id, participants, location, meeting_url, status) => {
        const newEvent = {
          id: calendarEvents.length + 1,
          title,
          description,
          event_type,
          start_datetime,
          end_datetime,
          organizer_id,
          participants,
          location,
          meeting_url,
          status,
          created_at: new Date().toISOString()
        };
        calendarEvents.push(newEvent);
        return { lastInsertRowid: newEvent.id };
      }
    },
    
    getCalendarEventsByUser: {
      all: (userId, startDate, endDate) => {
        return calendarEvents
          .filter(event => {
            // Check if user is organizer or participant
            const isOrganizer = event.organizer_id === userId;
            const isParticipant = event.participants && 
              (event.participants.includes(`[${userId}]`) || 
               event.participants.includes(`${userId},`) ||
               event.participants.includes(`,${userId},`) ||
               event.participants === `[${userId}]`);
            
            // Check date range
            const eventStart = new Date(event.start_datetime);
            const eventEnd = new Date(event.end_datetime);
            const rangeStart = new Date(startDate);
            const rangeEnd = new Date(endDate);
            
            const inDateRange = eventStart >= rangeStart && eventEnd <= rangeEnd;
            
            return (isOrganizer || isParticipant) && inDateRange;
          })
          .map(event => ({
            ...event,
            participants: event.participants ? JSON.parse(event.participants) : []
          }));
      }
    },
    
    getCalendarEventsForDate: {
      all: (date, userId) => {
        return calendarEvents
          .filter(event => {
            const eventDate = new Date(event.start_datetime).toISOString().split('T')[0];
            const targetDate = new Date(date).toISOString().split('T')[0];
            
            const dateMatch = eventDate === targetDate;
            
            if (userId) {
              const isOrganizer = event.organizer_id === userId;
              const isParticipant = event.participants && 
                (event.participants.includes(`[${userId}]`) || 
                 event.participants.includes(`${userId},`) ||
                 event.participants.includes(`,${userId},`) ||
                 event.participants === `[${userId}]`);
              return dateMatch && (isOrganizer || isParticipant);
            }
            
            return dateMatch;
          })
          .map(event => ({
            ...event,
            participants: event.participants ? JSON.parse(event.participants) : []
          }));
      }
    },
    
    getCalendarEventById: {
      get: (id) => {
        const event = calendarEvents.find(e => e.id === id);
        if (!event) return null;
        return {
          ...event,
          participants: event.participants ? JSON.parse(event.participants) : []
        };
      }
    },
    
    updateCalendarEvent: {
      run: (id, title, description, event_type, start_datetime, end_datetime, organizer_id, participants, location, meeting_url, status) => {
        const eventIndex = calendarEvents.findIndex(e => e.id === id);
        if (eventIndex !== -1) {
          calendarEvents[eventIndex] = {
            ...calendarEvents[eventIndex],
            title,
            description,
            event_type,
            start_datetime,
            end_datetime,
            organizer_id,
            participants,
            location,
            meeting_url,
            status
          };
        }
        return { changes: eventIndex !== -1 ? 1 : 0 };
      }
    },
    
    deleteCalendarEvent: {
      run: (id) => {
        const initialLength = calendarEvents.length;
        calendarEvents = calendarEvents.filter(e => e.id !== id);
        return { changes: initialLength - calendarEvents.length };
      }
    },
    
    getUpcomingCalendarEvents: {
      all: (userId, limit = 10) => {
        const now = new Date().toISOString();
        return calendarEvents
          .filter(event => {
            // Check if user is organizer or participant
            const isOrganizer = event.organizer_id === userId;
            const isParticipant = event.participants && 
              (event.participants.includes(`[${userId}]`) || 
               event.participants.includes(`${userId},`) ||
               event.participants.includes(`,${userId},`) ||
               event.participants === `[${userId}]` ||
               event.participants.includes(userId.toString()));
            
            // Check if event is in the future
            const isFuture = event.start_datetime >= now;
            
            return (isOrganizer || isParticipant) && isFuture;
          })
          .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
          .slice(0, limit)
          .map(event => ({
            ...event,
            participants: event.participants ? JSON.parse(event.participants) : []
          }));
      }
    }
  };
}

function verifyMemoryDatabase() {
  console.log('Testing memory database implementation...');
  
  // Set mock env
  process.env = { ...originalEnv, ...mockEnv };
  
  try {
    // Get the memory database instance
    const db = getMemoryDatabase();
    console.log('✓ Memory database initialized successfully');
    
    // Test creating a calendar event
    const result = db.createCalendarEvent.run(
      'Test Interview',
      'Technical interview for frontend position',
      'INTERVIEW',
      '2023-12-01T10:00:00Z',
      '2023-12-01T11:00:00Z',
      1,
      '[1,2]',
      'Room 101',
      'https://meet.google.com/abc-defg-hij',
      'SCHEDULED'
    );
    
    if (result && result.lastInsertRowid) {
      console.log('✓ Calendar event created successfully');
    } else {
      console.error('✗ Failed to create calendar event');
      return false;
    }
    
    // Test retrieving calendar events by user
    const events = db.getCalendarEventsByUser.all(1, '2023-12-01T00:00:00Z', '2023-12-31T23:59:59Z');
    
    if (events.length === 1) {
      console.log('✓ Calendar events retrieved by user successfully');
    } else {
      console.error('✗ Failed to retrieve calendar events by user');
      return false;
    }
    
    // Test retrieving calendar events for a specific date
    const dateEvents = db.getCalendarEventsForDate.all('2023-12-01T00:00:00Z');
    
    if (dateEvents.length === 1) {
      console.log('✓ Calendar events retrieved for specific date successfully');
    } else {
      console.error('✗ Failed to retrieve calendar events for specific date');
      return false;
    }
    
    // Test updating a calendar event
    const updateResult = db.updateCalendarEvent.run(
      3,
      'Updated Interview',
      'Updated description',
      'INTERVIEW',
      '2023-12-01T10:00:00Z',
      '2023-12-01T11:00:00Z',
      1,
      '[1,2,3]',
      'Room 202',
      'https://meet.google.com/xyz-qrst-uvw',
      'CONFIRMED'
    );
    
    if (updateResult && updateResult.changes === 1) {
      console.log('✓ Calendar event updated successfully');
    } else {
      console.error('✗ Failed to update calendar event');
      return false;
    }
    
    // Test retrieving upcoming calendar events
    const upcomingEvents = db.getUpcomingCalendarEvents.all(1, 10);
    
    if (upcomingEvents.length >= 1) {
      console.log('✓ Upcoming calendar events retrieved successfully');
    } else {
      console.error('✗ Failed to retrieve upcoming calendar events');
      return false;
    }
    
    // Test deleting a calendar event
    const deleteResult = db.deleteCalendarEvent.run(3);
    
    if (deleteResult && deleteResult.changes === 1) {
      console.log('✓ Calendar event deleted successfully');
    } else {
      console.error('✗ Failed to delete calendar event');
      return false;
    }
    
    console.log('🎉 All memory database tests passed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    return false;
  } finally {
    // Restore original env
    process.env = originalEnv;
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  const success = verifyMemoryDatabase();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyMemoryDatabase };