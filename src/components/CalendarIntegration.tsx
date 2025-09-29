'use client';

import React, { useState, useEffect } from 'react';
import { useCalendar } from '@/hooks/useCalendar';

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

const CalendarIntegration: React.FC = () => {
  // In a real implementation, we would get the current user ID from context
  const userId = 1; // Mock user ID
  const {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    checkForConflicts,
    syncInterviewWithCalendar,
    syncApplicationTimeline,
    findOptimalTimeSlots
  } = useCalendar(userId);

  const [conflicts, setConflicts] = useState<ConflictCheckResult | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'OTHER' as 'INTERVIEW' | 'EXAM' | 'ACADEMIC' | 'DEADLINE' | 'PLACEMENT' | 'OTHER',
    start_datetime: '',
    end_datetime: '',
    location: '',
  });
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);

  // Fetch events for the next 30 days
  useEffect(() => {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now
    fetchEvents(startDate, endDate);
  }, []);

  const handleCreateEvent = async () => {
    try {
      const result = await createEvent({
        title: newEvent.title,
        description: newEvent.description,
        event_type: newEvent.event_type,
        start_datetime: newEvent.start_datetime,
        end_datetime: newEvent.end_datetime,
        location: newEvent.location,
        status: 'SCHEDULED'
      });
      
      if (result.success) {
        alert('Event created successfully!');
        setNewEvent({
          title: '',
          description: '',
          event_type: 'OTHER',
          start_datetime: '',
          end_datetime: '',
          location: '',
        });
        // Refresh events
        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        fetchEvents(startDate, endDate);
      } else {
        alert(result.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event');
    }
  };

  const checkForConflictsHandler = async () => {
    if (!newEvent.start_datetime || !newEvent.end_datetime) {
      alert('Please select start and end times');
      return;
    }

    try {
      const conflictResult = await checkForConflicts(
        newEvent.start_datetime,
        newEvent.end_datetime
      );
      
      setConflicts(conflictResult);
      
      if (conflictResult.has_conflicts) {
        alert('Scheduling conflicts detected! Check the suggestions below.');
      } else {
        alert('No conflicts detected. You can proceed with scheduling.');
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      alert('Error checking conflicts');
    }
  };

  const handleSyncApplicationTimeline = async (applicationId: number) => {
    try {
      // In a real implementation, we would get the current user ID
      const studentId = userId; // Mock user ID
      
      const result = await syncApplicationTimeline(applicationId, studentId);
      
      if (result.success) {
        alert('Application timeline synced with calendar successfully!');
        // Refresh events
        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        fetchEvents(startDate, endDate);
      } else {
        alert(result.error || 'Failed to sync application timeline');
      }
    } catch (error) {
      console.error('Error syncing application timeline:', error);
      alert('Error syncing application timeline');
    }
  };

  const handleFindOptimalSlots = async () => {
    if (!newEvent.start_datetime || !newEvent.end_datetime) {
      alert('Please select start and end times');
      return;
    }

    try {
      // Calculate duration in minutes
      const start = new Date(newEvent.start_datetime);
      const end = new Date(newEvent.end_datetime);
      const durationMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
      
      const optimalSlots = await findOptimalTimeSlots(
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next 7 days
        durationMinutes
      );
      
      // Get slots with no conflicts
      const conflictFreeSlots = optimalSlots
        .filter((slot: any) => slot.conflicts.length === 0)
        .slice(0, 5) // Limit to first 5 slots
        .map((slot: any) => `${new Date(slot.start_datetime).toLocaleString()} to ${new Date(slot.end_datetime).toLocaleString()}`);
      
      setSuggestedTimes(conflictFreeSlots);
      
      if (conflictFreeSlots.length > 0) {
        alert('Found optimal time slots with no conflicts!');
      } else {
        alert('No optimal time slots found without conflicts.');
      }
    } catch (error) {
      console.error('Error finding optimal slots:', error);
      alert('Error finding optimal slots');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'INTERVIEW': return 'bg-blue-100 text-blue-800';
      case 'EXAM': return 'bg-red-100 text-red-800';
      case 'ACADEMIC': return 'bg-green-100 text-green-800';
      case 'DEADLINE': return 'bg-yellow-100 text-yellow-800';
      case 'PLACEMENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Calendar Integration</h2>
      
      {/* Event Creation Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Create New Event</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={newEvent.event_type}
              onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="INTERVIEW">Interview</option>
              <option value="EXAM">Exam</option>
              <option value="ACADEMIC">Academic</option>
              <option value="DEADLINE">Deadline</option>
              <option value="PLACEMENT">Placement</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
            <input
              type="datetime-local"
              value={newEvent.start_datetime}
              onChange={(e) => setNewEvent({...newEvent, start_datetime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
            <input
              type="datetime-local"
              value={newEvent.end_datetime}
              onChange={(e) => setNewEvent({...newEvent, end_datetime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event location"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event description"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={handleCreateEvent}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Event
          </button>
          
          <button
            onClick={checkForConflictsHandler}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Check for Conflicts
          </button>
          
          <button
            onClick={handleFindOptimalSlots}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Find Optimal Slots
          </button>
        </div>
      </div>
      
      {/* Conflict Results */}
      {conflicts && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Conflict Check Results</h3>
          <div className={`p-4 rounded-md ${conflicts.has_conflicts ? 'bg-red-100' : 'bg-green-100'}`}>
            <p className={`font-medium ${conflicts.has_conflicts ? 'text-red-800' : 'text-green-800'}`}>
              {conflicts.has_conflicts 
                ? `Conflicts detected: ${conflicts.conflicts.length} conflicting event(s)` 
                : 'No conflicts detected'}
            </p>
          </div>
          
          {conflicts.has_conflicts && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Conflicting Events:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {conflicts.conflicts.map((conflict, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{conflict.title}</span> - {formatDate(conflict.start_datetime)}
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getEventTypeColor(conflict.event_type)}`}>
                      {conflict.event_type}
                    </span>
                  </li>
                ))}
              </ul>
              
              {conflicts.suggested_times.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Suggested Times:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {conflicts.suggested_times.map((time, index) => (
                      <li key={index} className="text-sm">{time}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Optimal Time Slots */}
      {suggestedTimes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Optimal Time Slots</h3>
          <ul className="list-disc pl-5 space-y-1">
            {suggestedTimes.map((time, index) => (
              <li key={index} className="text-sm">{time}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Events List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Upcoming Events</h3>
          <button
            onClick={() => {
              const startDate = new Date().toISOString();
              const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              fetchEvents(startDate, endDate);
            }}
            className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Refresh
          </button>
        </div>
        
        {loading ? (
          <p>Loading events...</p>
        ) : error ? (
          <p className="text-red-600">Error: {error}</p>
        ) : events.length === 0 ? (
          <p>No upcoming events found.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between">
                  <h4 className="font-medium">{event.title}</h4>
                  <span className={`text-sm px-2 py-1 rounded-full ${getEventTypeColor(event.event_type)}`}>
                    {event.event_type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span>{formatDate(event.start_datetime)}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full">
                    {event.status}
                  </span>
                </div>
                {event.location && (
                  <p className="text-sm mt-1">📍 {event.location}</p>
                )}
                {event.meeting_url && (
                  <p className="text-sm mt-1">🔗 <a href={event.meeting_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meeting Link</a></p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarIntegration;