'use client';

import { useAuth } from '@/contexts/AuthContext';
import { RealTimeApplicationTracker } from '@/components/RealTimeApplicationTracker';
import Link from 'next/link';

export default function TrackerPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the application tracker.</p>
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Application Tracker</h1>
              <p className="text-gray-600 mt-2">
                Real-time tracking of your internship applications
              </p>
            </div>
            <Link 
              href="/applications" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Applications →
            </Link>
          </div>
        </div>

        {/* Real-Time Tracker */}
        <RealTimeApplicationTracker />

        {/* Information Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-blue-600 text-2xl mb-2">🔄</div>
              <h3 className="font-medium text-gray-900 mb-1">Real-Time Updates</h3>
              <p className="text-sm text-gray-600">
                Application status updates automatically every 10 seconds
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-green-600 text-2xl mb-2">📊</div>
              <h3 className="font-medium text-gray-900 mb-1">Detailed Tracking</h3>
              <p className="text-sm text-gray-600">
                Step-by-step progress through the application process
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-purple-600 text-2xl mb-2">🔔</div>
              <h3 className="font-medium text-gray-900 mb-1">Instant Notifications</h3>
              <p className="text-sm text-gray-600">
                Get notified immediately when your application status changes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}