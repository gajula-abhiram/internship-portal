// Test file for memory-database.ts
// This file contains comprehensive tests for the in-memory database implementation

import { getMemoryDatabase } from './memory-database';

// Simple assertion function for testing
function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected ${expected}, but got ${actual}`);
  }
  console.log(`✓ ${message}`);
}

function assertDefined(value: any, message: string) {
  if (value === undefined || value === null) {
    throw new Error(`Assertion failed: ${message}. Value is ${value}`);
  }
  console.log(`✓ ${message}`);
}

function assertArrayLength(array: any[], expectedLength: number, message: string) {
  if (array.length !== expectedLength) {
    throw new Error(`Assertion failed: ${message}. Expected length ${expectedLength}, but got ${array.length}`);
  }
  console.log(`✓ ${message}`);
}

// Mock environment for testing
const mockEnv = {
  ENABLE_MEMORY_DB: 'true',
  DATABASE_URL: 'memory://'
};

// Save original env
const originalEnv = process.env;

// Test function to run all tests
async function runTests() {
  console.log('Running memory database tests...');
  
  // Set mock env
  process.env = { ...originalEnv, ...mockEnv };
  
  try {
    // Get database instance
    const db = getMemoryDatabase();
    
    // User Operations Tests
    console.log('\n--- User Operations Tests ---');
    
    // Test creating a new user
    const createUserResult = db.createUser.run(
      'testuser',
      'hashedpassword',
      'STUDENT',
      'Test User',
      'test@example.com',
      'Computer Science',
      6,
      'JavaScript,React',
      'resume.pdf'
    );
    
    assertDefined(createUserResult.lastInsertRowid, 'User should be created with an ID');
    
    const user = db.getUserByUsername.get('testuser');
    assertDefined(user, 'User should be retrievable by username');
    assertEqual(user?.username, 'testuser', 'User username should match');
    assertEqual(user?.name, 'Test User', 'User name should match');
    
    // Test retrieving user by username
    const adminUser = db.getUserByUsername.get('admin');
    assertDefined(adminUser, 'Admin user should exist');
    assertEqual(adminUser?.username, 'admin', 'Admin username should match');
    assertEqual(adminUser?.role, 'STAFF', 'Admin role should be STAFF');
    
    // Test retrieving user by id
    const userById = db.getUserById.get(1);
    assertDefined(userById, 'User should be retrievable by ID');
    assertEqual(userById?.id, 1, 'User ID should match');
    assertEqual(userById?.username, 'admin', 'User username should match');
    
    // Test updating user information
    const updateUserResult = db.updateUser.run(
      'Updated Name',
      'updated@example.com',
      'Information Technology',
      7,
      'Python,Django',
      'updated-resume.pdf',
      1
    );
    
    assertEqual(updateUserResult.changes, 1, 'User should be updated successfully');
    
    const updatedUser = db.getUserById.get(1);
    assertEqual(updatedUser?.name, 'Updated Name', 'Updated user name should match');
    assertEqual(updatedUser?.email, 'updated@example.com', 'Updated user email should match');
    assertEqual(updatedUser?.department, 'Information Technology', 'Updated user department should match');
    
    // Internship Operations Tests
    console.log('\n--- Internship Operations Tests ---');
    
    // Test creating a new internship
    const createInternshipResult = db.createInternship.run(
      'Backend Developer Intern',
      'Work on Node.js projects',
      JSON.stringify(['Node.js', 'Express', 'MongoDB']),
      JSON.stringify(['Computer Science', 'Information Technology']),
      20000,
      30000,
      false,
      1
    );
    
    assertDefined(createInternshipResult.lastInsertRowid, 'Internship should be created with an ID');
    
    const internship = db.getInternshipById.get(2);
    assertDefined(internship, 'Internship should be retrievable by ID');
    assertEqual(internship?.title, 'Backend Developer Intern', 'Internship title should match');
    
    // Test retrieving active internships
    const activeInternships = db.getActiveInternships.all();
    assertDefined(activeInternships, 'Active internships should be retrievable');
    assertArrayLength(activeInternships, 2, 'Should have 2 active internships');
    
    // Test retrieving internship by id
    const internshipById = db.getInternshipById.get(1);
    assertDefined(internshipById, 'Internship should be retrievable by ID');
    assertEqual(internshipById?.id, 1, 'Internship ID should match');
    assertEqual(internshipById?.title, 'Frontend Developer Intern', 'Internship title should match');
    
    // Application Operations Tests
    console.log('\n--- Application Operations Tests ---');
    
    // Test creating a new application
    const createApplicationResult = db.createApplication.run(2, 2);
    assertDefined(createApplicationResult.lastInsertRowid, 'Application should be created with an ID');
    
    const applications = db.getApplicationsByStudent.all(2);
    assertDefined(applications, 'Applications should be retrievable by student');
    assertArrayLength(applications, 1, 'Should have 1 application for student');
    assertEqual(applications[0].status, 'APPLIED', 'Application status should be APPLIED');
    
    // Test retrieving applications by student
    const studentApplications = db.getApplicationsByStudent.all(2);
    assertDefined(studentApplications, 'Student applications should be retrievable');
    assertArrayLength(studentApplications, 1, 'Should have 1 application for student');
    assertEqual(studentApplications[0].student_id, 2, 'Application student ID should match');
    
    // Test retrieving applications for mentor
    const mentorApplications = db.getApplicationsForMentor.all(7); // mentor user
    assertDefined(mentorApplications, 'Mentor applications should be retrievable');
    assertArrayLength(mentorApplications, 1, 'Should have 1 application for mentor');
    assertEqual(mentorApplications[0].status, 'APPLIED', 'Application status should be APPLIED');
    
    // Test updating application status
    const updateApplicationResult = db.updateApplicationStatus.run('APPROVED', 7, 1);
    assertEqual(updateApplicationResult.changes, 1, 'Application status should be updated successfully');
    
    const updatedApplications = db.getApplicationsByStudent.all(2);
    assertEqual(updatedApplications[0].status, 'APPROVED', 'Updated application status should match');
    assertEqual(updatedApplications[0].mentor_id, 7, 'Updated application mentor ID should match');
    
    // Feedback Operations Tests
    console.log('\n--- Feedback Operations Tests ---');
    
    // Test creating feedback
    const createFeedbackResult = db.createFeedback.run(1, 1, 5, 'Excellent work!');
    assertDefined(createFeedbackResult.lastInsertRowid, 'Feedback should be created with an ID');
    
    const feedback = db.getFeedbackByApplication.all(1);
    assertDefined(feedback, 'Feedback should be retrievable by application');
    assertArrayLength(feedback, 1, 'Should have 1 feedback for application');
    assertEqual(feedback[0].rating, 5, 'Feedback rating should match');
    
    // Test retrieving feedback by application
    const feedbackByApplication = db.getFeedbackByApplication.all(1);
    assertDefined(feedbackByApplication, 'Feedback should be retrievable by application');
    assertArrayLength(feedbackByApplication, 1, 'Should have 1 feedback for application');
    assertEqual(feedbackByApplication[0].application_id, 1, 'Feedback application ID should match');
    assertEqual(feedbackByApplication[0].supervisor_id, 1, 'Feedback supervisor ID should match');
    
    // Calendar Event Operations Tests
    console.log('\n--- Calendar Event Operations Tests ---');
    
    // Test creating a calendar event
    const createCalendarEventResult = db.createCalendarEvent.run(
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
    
    assertDefined(createCalendarEventResult.lastInsertRowid, 'Calendar event should be created with an ID');
    
    const event = db.getCalendarEventById.get(3);
    assertDefined(event, 'Calendar event should be retrievable by ID');
    assertEqual(event?.title, 'Test Interview', 'Calendar event title should match');
    
    // Test retrieving calendar events by user
    const eventsByUser = db.getCalendarEventsByUser.all(1, '2023-12-01T00:00:00Z', '2023-12-31T23:59:59Z');
    assertDefined(eventsByUser, 'Calendar events should be retrievable by user');
    assertArrayLength(eventsByUser, 3, 'Should have 3 events for user 1');
    
    // Test retrieving calendar events for a specific date
    const eventsForDate = db.getCalendarEventsForDate.all('2023-12-01T00:00:00Z');
    assertDefined(eventsForDate, 'Calendar events should be retrievable for a specific date');
    
    // Test updating a calendar event
    const updateCalendarEventResult = db.updateCalendarEvent.run(
      1,
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
    
    assertEqual(updateCalendarEventResult.changes, 1, 'Calendar event should be updated successfully');
    
    const updatedEvent = db.getCalendarEventById.get(1);
    assertEqual(updatedEvent?.title, 'Updated Interview', 'Updated calendar event title should match');
    assertEqual(updatedEvent?.status, 'CONFIRMED', 'Updated calendar event status should match');
    
    // Test deleting a calendar event
    const deleteCalendarEventResult = db.deleteCalendarEvent.run(1);
    assertEqual(deleteCalendarEventResult.changes, 1, 'Calendar event should be deleted successfully');
    
    const deletedEvent = db.getCalendarEventById.get(1);
    assertDefined(deletedEvent, 'Deleted event should not be found');
    
    // Test retrieving upcoming calendar events
    const upcomingEvents = db.getUpcomingCalendarEvents.all(1, 10);
    assertDefined(upcomingEvents, 'Upcoming calendar events should be retrievable');
    
    // Analytics Operations Tests
    console.log('\n--- Analytics Operations Tests ---');
    
    // Test getting unplaced students count
    const unplacedStudentsCount = db.getUnplacedStudentsCount.get();
    assertDefined(unplacedStudentsCount, 'Unplaced students count should be retrievable');
    assertDefined(unplacedStudentsCount.count, 'Unplaced students count should have a count property');
    
    // Test getting application status breakdown
    const applicationStatusBreakdown = db.getApplicationStatusBreakdown.all();
    assertDefined(applicationStatusBreakdown, 'Application status breakdown should be retrievable');
    
    // Test getting open positions count
    const openPositionsCount = db.getOpenPositionsCount.get();
    assertDefined(openPositionsCount, 'Open positions count should be retrievable');
    assertDefined(openPositionsCount.count, 'Open positions count should have a count property');
    
    // Test getting average feedback rating
    const averageFeedbackRating = db.getAverageFeedbackRating.get();
    assertDefined(averageFeedbackRating, 'Average feedback rating should be retrievable');
    assertDefined(averageFeedbackRating.average_rating, 'Average feedback rating should have an average_rating property');
    assertDefined(averageFeedbackRating.total_feedback, 'Average feedback rating should have a total_feedback property');
    
    console.log('\n🎉 All memory database tests passed successfully!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    // Restore original env
    process.env = originalEnv;
  }
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}

export { runTests };