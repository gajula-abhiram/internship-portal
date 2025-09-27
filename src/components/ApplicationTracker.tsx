'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ApplicationStep {
  id: number;
  step: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completed_at?: string;
  notes?: string;
}

interface ApplicationStatus {
  application: {
    id: number;
    status: string;
    internship_title: string;
    company_name: string;
    applied_at: string;
    student_name: string;
  };
  tracking_steps: ApplicationStep[];
  current_step: string;
  progress_percentage: number;
  estimated_completion: string;
}

export function ApplicationTracker({ applicationId }: { applicationId: number }) {
  const { token } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && applicationId) {
      fetchApplicationStatus();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchApplicationStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [token, applicationId]);

  const fetchApplicationStatus = async () => {
    try {
      const response = await fetch(`/api/applications/quick?action=status&applicationId=${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch application status');

      const data = await response.json();
      setApplicationStatus(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'PENDING': return 'text-gray-600 bg-gray-100';
      case 'SKIPPED': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED': return 'bg-blue-500';
      case 'MENTOR_APPROVED': return 'bg-green-500';
      case 'MENTOR_REJECTED': return 'bg-red-500';
      case 'INTERVIEW_SCHEDULED': return 'bg-purple-500';
      case 'INTERVIEWED': return 'bg-indigo-500';
      case 'OFFERED': return 'bg-green-600';
      case 'OFFER_ACCEPTED': return 'bg-green-700';
      case 'COMPLETED': return 'bg-green-800';
      case 'NOT_OFFERED': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="h-4 bg-gray-300 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <div className="text-xl mb-2">⚠️</div>
          <div>{error}</div>
          <button 
            onClick={fetchApplicationStatus}
            className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!applicationStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          No application data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Application Tracker
            </h2>
            <p className="text-sm text-gray-600">
              {applicationStatus.application.internship_title} at {applicationStatus.application.company_name}
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(applicationStatus.application.status)} text-white`}>
              {applicationStatus.application.status.replace('_', ' ')}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Applied on {new Date(applicationStatus.application.applied_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Current Step: {applicationStatus.current_step}
          </span>
          <span className="text-sm text-gray-600">
            {applicationStatus.progress_percentage}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${applicationStatus.progress_percentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Estimated completion: {applicationStatus.estimated_completion}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {applicationStatus.tracking_steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4">
              {/* Step Icon */}
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                  step.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' :
                  step.status === 'SKIPPED' ? 'bg-orange-100 text-orange-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step.status === 'COMPLETED' ? '✓' :
                   step.status === 'IN_PROGRESS' ? '⏳' :
                   step.status === 'SKIPPED' ? '⏭' :
                   index + 1}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {step.step}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                    {step.status.replace('_', ' ')}
                  </span>
                </div>
                
                {step.completed_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed on {new Date(step.completed_at).toLocaleString()}
                  </p>
                )}
                
                {step.notes && (
                  <p className="text-sm text-gray-600 mt-1">
                    {step.notes}
                  </p>
                )}
              </div>

              {/* Connector Line */}
              {index < applicationStatus.tracking_steps.length - 1 && (
                <div className="absolute left-10 mt-8 w-0.5 h-6 bg-gray-200"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer with Live Updates */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live tracking enabled</span>
          </div>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

// Quick Application Stats Component
export function ApplicationStats() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/applications/quick?action=statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching application stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Application Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.total_applications}
          </div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.applications_this_week}
          </div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats.success_rate}%
          </div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {stats.average_response_time}
          </div>
          <div className="text-sm text-gray-600">Avg Response</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-3">Status Breakdown</h4>
        <div className="space-y-2">
          {Object.entries(stats.status_breakdown).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600 capitalize">
                {status.replace('_', ' ')}
              </span>
              <span className="font-semibold">{count as number}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Companies */}
      {stats.most_applied_companies.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-3">Most Applied Companies</h4>
          <div className="space-y-2">
            {stats.most_applied_companies.slice(0, 5).map((company: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{company.company}</span>
                <span className="font-semibold">{company.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}