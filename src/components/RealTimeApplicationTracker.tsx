'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RealTimeNotificationService } from '@/lib/notification-service';

interface ApplicationTrackingStep {
  id: number;
  application_id: number;
  step: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completed_at: string | null;
  notes: string | null;
  actor_id: number | null;
  created_at: string;
}

interface ApplicationStatus {
  id: number;
  internship_title: string;
  company_name: string;
  status: string;
  applied_at: string;
  tracking_steps: ApplicationTrackingStep[];
  last_updated: string;
}

export function RealTimeApplicationTracker() {
  const { user, token } = useAuth();
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  useEffect(() => {
    if (user && token) {
      fetchApplicationStatus();
      
      // Set up polling for real-time updates every 10 seconds
      const interval = setInterval(fetchApplicationStatus, 10000);
      
      // Set up real-time notifications
      const handleUpdate = (update: any) => {
        // When we receive a real-time update, refresh the data
        fetchApplicationStatus();
      };
      
      if (user.id) {
        RealTimeNotificationService.subscribe(user.id, handleUpdate);
      }
      
      return () => {
        clearInterval(interval);
        if (user.id) {
          RealTimeNotificationService.unsubscribe(user.id, handleUpdate);
        }
      };
    }
  }, [user, token]);

  const fetchApplicationStatus = async () => {
    try {
      const response = await fetch('/api/tracking/realtime', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch application status');
      }

      const data = await response.json();
      
      setApplications(data.data.applications);
      setLastUpdated(data.data.last_updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-yellow-100 text-yellow-800';
      case 'MENTOR_APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'MENTOR_REJECTED':
        return 'bg-red-100 text-red-800';
      case 'INTERVIEWED':
        return 'bg-purple-100 text-purple-800';
      case 'OFFERED':
        return 'bg-green-100 text-green-800';
      case 'NOT_OFFERED':
        return 'bg-gray-100 text-gray-800';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackingStepStatus = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { text: 'Completed', color: 'text-green-600', bg: 'bg-green-100' };
      case 'IN_PROGRESS':
        return { text: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'PENDING':
        return { text: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'SKIPPED':
        return { text: 'Skipped', color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { text: status, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        );
      case 'IN_PROGRESS':
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
        );
      case 'PENDING':
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        );
      case 'SKIPPED':
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
          </div>
        );
    }
  };

  const getProgressPercentage = (trackingSteps: ApplicationTrackingStep[]) => {
    if (!trackingSteps || trackingSteps.length === 0) return 0;
    
    const completedSteps = trackingSteps.filter(step => step.status === 'COMPLETED').length;
    return Math.round((completedSteps / trackingSteps.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-500">
          <div className="text-xl mb-2">⚠️ Error Loading Applications</div>
          <p>{error}</p>
          <button 
            onClick={fetchApplicationStatus}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📄</div>
          <p>No applications found</p>
          <p className="text-sm mt-2">Apply to internships to see tracking information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Real-Time Application Tracker</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Updates</span>
            </div>
            <span className="text-xs text-gray-500">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-1">
          Tracking {applications.length} application{applications.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.map((application) => (
          <div key={application.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Application Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{application.internship_title}</h3>
                  <p className="text-gray-600">{application.company_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                    {application.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Application Progress</span>
                  <span className="font-medium">
                    {getProgressPercentage(application.tracking_steps)}% Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage(application.tracking_steps)}%` }}
                  ></div>
                </div>
              </div>

              {/* Tracking Steps */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Tracking Steps</h4>
                <div className="space-y-3">
                  {application.tracking_steps.slice(0, 3).map((step, index) => {
                    const statusInfo = getTrackingStepStatus(step.status);
                    return (
                      <div key={step.id} className="flex items-start">
                        <div className="flex flex-col items-center mr-3">
                          {getStepIcon(step.status)}
                          {index < application.tracking_steps.length - 1 && (
                            <div className={`w-0.5 h-6 ${
                              step.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-200'
                            }`}></div>
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium text-gray-900">{step.step}</h5>
                            <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                          {step.completed_at && (
                            <p className="text-gray-500 text-xs mt-1">
                              Completed on {new Date(step.completed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {application.tracking_steps.length > 3 && (
                    <div className="text-center">
                      <span className="text-xs text-blue-600 font-medium">
                        +{application.tracking_steps.length - 3} more steps
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Details Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a 
                  href={`/applications/${application.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Full Details →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}