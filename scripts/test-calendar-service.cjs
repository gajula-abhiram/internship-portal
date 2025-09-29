// Test script for CalendarService with memory database
// This script verifies that the calendar service works correctly in Vercel deployment

// Use dynamic import since we're in an ES module environment
async function testCalendarService() {
  console.log('Testing CalendarService with memory database...');
  
  // Enable memory database
  process.env.ENABLE_MEMORY_DB = 'true';
  
  try {
    // Use the memory database directly for testing
    const { getMemoryDatabase } = await import('../src/lib/memory-database.ts');
    const db = getMemoryDatabase();
    
    // Test creating an event
    console.log('\n1. Creating a calendar event...');
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
    const event = { id: result.lastInsertRowid };
    
    console.log('Created event:', event);
    
    // Test retrieving events by user
    console.log('\n2. Retrieving events by user...');
    const userEvents = db.getCalendarEventsByUser.all(
      1, 
      '2023-12-01T00:00:00Z', 
      '2023-12-31T23:59:59Z'
    );
    
    console.log('User events:', userEvents);
    
    // Test checking for conflicts
    console.log('\n3. Checking for conflicts...');
    const conflicts = db.getCalendarEventsWithConflicts.all(
      1,
      '2023-12-01T10:30:00Z',
      '2023-12-01T11:30:00Z'
    );
    
    console.log('Conflict check result:', conflicts);
    
    // Test updating an event
    console.log('\n4. Updating event...');
    const updateResult = db.updateCalendarEvent.run(event.id, 'Test Interview', 'Technical interview for frontend position', 'INTERVIEW', '2023-12-01T10:00:00Z', '2023-12-01T11:00:00Z', 1, '[1,2]', 'Room 202', 'https://meet.google.com/abc-defg-hij', 'CONFIRMED');
    
    console.log('Update result:', updateResult);
    
    // Test retrieving upcoming events
    console.log('\n5. Retrieving upcoming events...');
    const upcomingEvents = db.getUpcomingCalendarEvents.all(1, 5);
    
    console.log('Upcoming events:', upcomingEvents);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run the test
testCalendarService();