// Test script for CalendarService with memory database
// This script verifies that the calendar service works correctly in Vercel deployment

// Use dynamic import since we're in an ES module environment
async function testCalendarService() {
  console.log('Testing CalendarService with memory database...');
  
  // Enable memory database
  process.env.ENABLE_MEMORY_DB = 'true';
  
  try {
    // Dynamically import the CalendarService
    const { CalendarService } = await import('../src/lib/calendar-service.js');
    const calendarService = new CalendarService();
    
    // Test creating an event
    console.log('\n1. Creating a calendar event...');
    const event = await calendarService.createEvent({
      title: 'Test Interview',
      description: 'Technical interview for frontend position',
      event_type: 'INTERVIEW',
      start_datetime: '2023-12-01T10:00:00Z',
      end_datetime: '2023-12-01T11:00:00Z',
      organizer_id: 1,
      participants: [1, 2],
      location: 'Room 101',
      meeting_url: 'https://meet.google.com/abc-defg-hij',
      status: 'SCHEDULED'
    });
    
    console.log('Created event:', event);
    
    // Test retrieving events by user
    console.log('\n2. Retrieving events by user...');
    const userEvents = await calendarService.getUserEvents(
      1, 
      '2023-12-01T00:00:00Z', 
      '2023-12-31T23:59:59Z'
    );
    
    console.log('User events:', userEvents);
    
    // Test checking for conflicts
    console.log('\n3. Checking for conflicts...');
    const conflicts = await calendarService.checkForConflicts(
      1,
      '2023-12-01T10:30:00Z',
      '2023-12-01T11:30:00Z'
    );
    
    console.log('Conflict check result:', conflicts);
    
    // Test updating an event
    console.log('\n4. Updating event...');
    const updateResult = await calendarService.updateEvent(event.id, {
      status: 'CONFIRMED',
      location: 'Room 202'
    });
    
    console.log('Update result:', updateResult);
    
    // Test retrieving upcoming events
    console.log('\n5. Retrieving upcoming events...');
    const upcomingEvents = await calendarService.getUpcomingEvents(1, 5);
    
    console.log('Upcoming events:', upcomingEvents);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testCalendarService();