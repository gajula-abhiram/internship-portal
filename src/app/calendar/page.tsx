'use client';

import React from 'react';
import CalendarIntegration from '@/components/CalendarIntegration';
import ProtectedRoute from '@/components/ProtectedRoute';

const CalendarPage: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']}>
      <div className="min-h-screen bg-gray-50">
        <CalendarIntegration />
      </div>
    </ProtectedRoute>
  );
};

export default CalendarPage;