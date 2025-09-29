'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { applicationsApi, analyticsApi } from '@/lib/api';

interface Application {
  id: number;
  internship_title: string;
  status: string;
  applied_at: string;
  tracking_steps?: Array<{
    id: number;
    step: string;
    status: string;
    completed_at: string | null;
  }>;
}

interface DashboardData {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  unreadMessages: number;
  placementStats?: {
    total_students: number;
    placed_students: number;
    placement_percentage: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError('');

        // Fetch applications with tracking data
        const apps = await applicationsApi.getAll();
        setApplications(apps.slice(0, 5)); // Show only first 5

        // For students and mentors, fetch unread message count
        if (user.role === 'STUDENT' || user.role === 'MENTOR') {
          try {
            const response = await fetch('/api/chat/rooms', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              const unreadCount = data.chat_rooms?.reduce((sum: number, room: any) => sum + room.unread_count, 0) || 0;
              
              setDashboardData(prev => ({
                ...prev,
                unreadMessages: unreadCount
              }));
            }
          } catch (chatError) {
            console.error('Failed to fetch chat data:', chatError);
          }
        }

        // For staff, fetch placement statistics
        if (user.role === 'STAFF') {
          try {
            const response = await fetch('/api/analytics/dashboard', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              const stats = data.data;
              
              // Calculate overall placement stats
              const totalStudents = stats.department_stats.reduce((sum: number, dept: any) => sum + dept.total_students, 0);
              const placedStudents = stats.department_stats.reduce((sum: number, dept: any) => sum + dept.placed_students, 0);
              const placementPercentage = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 10000) / 100 : 0;
              
              setDashboardData(prev => ({
                ...prev,
                placementStats: {
                  total_students: totalStudents,
                  placed_students: placedStudents,
                  placement_percentage: placementPercentage
                }
              }));
            }
          } catch (analyticsError) {
            console.error('Failed to fetch analytics data:', analyticsError);
          }
        }

        // Calculate application statistics
        const totalApplications = apps.length;
        const pendingApplications = apps.filter((app: any) => 
          app.status === 'APPLIED' || app.status === 'MENTOR_REVIEW'
        ).length;
        const approvedApplications = apps.filter((app: any) => 
          app.status === 'MENTOR_APPROVED' || app.status === 'INTERVIEWED' || app.status === 'OFFERED'
        ).length;
        const rejectedApplications = apps.filter((app: any) => 
          app.status === 'MENTOR_REJECTED' || app.status === 'NOT_OFFERED'
        ).length;

        setDashboardData(prev => ({
          ...prev,
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications
        }));

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  const getTrackingStepStatus = (trackingSteps: Application['tracking_steps']) => {
    if (!trackingSteps || trackingSteps.length === 0) {
      return 'Not started';
    }
    
    const completedSteps = trackingSteps.filter(step => step.status === 'COMPLETED').length;
    const totalSteps = trackingSteps.length;
    
    if (completedSteps === totalSteps) {
      return 'Completed';
    } else if (completedSteps > 0) {
      return `In progress (${completedSteps}/${totalSteps})`;
    } else {
      return 'Not started';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the dashboard.</p>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h1>
        <p className="text-gray-600 mt-2">
          {user.role === 'STUDENT' && 'Track your internship applications and communicate with mentors.'}
          {user.role === 'STAFF' && 'Manage internships and monitor student progress.'}
          {user.role === 'MENTOR' && 'Review student applications and provide guidance.'}
          {user.role === 'EMPLOYER' && 'Manage internship postings and provide feedback.'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.pendingApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.approvedApplications}</p>
            </div>
          </div>
        </div>

        {(user.role === 'STUDENT' || user.role === 'MENTOR') && (
          <Link href="/chat" className="bg-white rounded-lg shadow-md p-6 block hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData.unreadMessages}</p>
              </div>
            </div>
          </Link>
        )}

        {user.role === 'STAFF' && dashboardData.placementStats && (
          <Link href="/analytics" className="bg-white rounded-lg shadow-md p-6 block hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Placement Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardData.placementStats.placement_percentage}%</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Recent Applications with Tracking */}
      {user.role === 'STUDENT' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Applications</h2>
          </div>
          {applications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {applications.map((application) => (
                <li key={application.id}>
                  <Link href={`/applications/${application.id}`} className="block hover:bg-gray-50">
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{application.internship_title}</p>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {application.status.replace('_', ' ')}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              {getTrackingStepStatus(application.tracking_steps)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied on {new Date(application.applied_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by applying to an internship.</p>
              <div className="mt-6">
                <Link
                  href="/internships"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Internships
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placement Statistics for Staff */}
      {user.role === 'STAFF' && dashboardData.placementStats && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Placement Overview</h2>
            <Link 
              href="/analytics" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View Detailed Analytics →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Students</div>
              <div className="text-3xl font-bold text-gray-900">{dashboardData.placementStats.total_students}</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Placed Students</div>
              <div className="text-3xl font-bold text-green-600">{dashboardData.placementStats.placed_students}</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Placement Rate</div>
              <div className="text-3xl font-bold text-purple-600">{dashboardData.placementStats.placement_percentage}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}