"use strict";
// Verification script for memory database implementation
// This file verifies the calendar events functionality in the memory database
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMemoryDatabase = verifyMemoryDatabase;
var memory_database_1 = require("./memory-database");
// Mock the environment for testing
var mockEnv = {
    ENABLE_MEMORY_DB: 'true',
    DATABASE_URL: 'memory://'
};
// Save original env
var originalEnv = process.env;
// Set mock env
process.env = __assign(__assign({}, originalEnv), mockEnv);
function verifyMemoryDatabase() {
    console.log('Testing memory database implementation...');
    try {
        // Get the memory database instance
        var db = (0, memory_database_1.getMemoryDatabase)();
        console.log('✓ Memory database initialized successfully');
        // Test creating a calendar event
        var result = db.createCalendarEvent.run('Test Interview', 'Technical interview for frontend position', 'INTERVIEW', '2023-12-01T10:00:00Z', '2023-12-01T11:00:00Z', 1, '[1,2]', 'Room 101', 'https://meet.google.com/abc-defg-hij', 'SCHEDULED');
        if (result && result.lastInsertRowid) {
            console.log('✓ Calendar event created successfully');
        }
        else {
            console.error('✗ Failed to create calendar event');
            return false;
        }
        // Test retrieving calendar events by user
        var events = db.getCalendarEventsByUser.all(1, '2023-12-01T00:00:00Z', '2023-12-31T23:59:59Z');
        if (events.length === 1) {
            console.log('✓ Calendar events retrieved by user successfully');
        }
        else {
            console.error('✗ Failed to retrieve calendar events by user');
            return false;
        }
        // Test retrieving calendar events for a specific date
        var dateEvents = db.getCalendarEventsForDate.all('2023-12-01T00:00:00Z');
        if (dateEvents.length === 1) {
            console.log('✓ Calendar events retrieved for specific date successfully');
        }
        else {
            console.error('✗ Failed to retrieve calendar events for specific date');
            return false;
        }
        // Test updating a calendar event
        var updateResult = db.updateCalendarEvent.run(3, 'Updated Interview', 'Updated description', 'INTERVIEW', '2023-12-01T10:00:00Z', '2023-12-01T11:00:00Z', 1, '[1,2,3]', 'Room 202', 'https://meet.google.com/xyz-qrst-uvw', 'CONFIRMED');
        if (updateResult && updateResult.changes === 1) {
            console.log('✓ Calendar event updated successfully');
        }
        else {
            console.error('✗ Failed to update calendar event');
            return false;
        }
        // Test retrieving upcoming calendar events
        var upcomingEvents = db.getUpcomingCalendarEvents.all(1, 10);
        if (upcomingEvents.length === 1) {
            console.log('✓ Upcoming calendar events retrieved successfully');
        }
        else {
            console.error('✗ Failed to retrieve upcoming calendar events');
            return false;
        }
        // Test deleting a calendar event
        var deleteResult = db.deleteCalendarEvent.run(3);
        if (deleteResult && deleteResult.changes === 1) {
            console.log('✓ Calendar event deleted successfully');
        }
        else {
            console.error('✗ Failed to delete calendar event');
            return false;
        }
        console.log('🎉 All memory database tests passed successfully!');
        return true;
    }
    catch (error) {
        console.error('❌ Error during testing:', error);
        return false;
    }
    finally {
        // Restore original env
        process.env = originalEnv;
    }
}
// Run verification if this file is executed directly
if (require.main === module) {
    var success = verifyMemoryDatabase();
    process.exit(success ? 0 : 1);
}
