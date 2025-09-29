'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardProps {
  className?: string;
}

interface DashboardData {
  role: string;
  user_id: number;
  metrics: any;
  real_time_data: any;
  notifications_summary: any;
  quick_actions: any[];
}

export function EnhancedDashboard({ className = '' }: DashboardProps) {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
      // Set up real-time updates every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/enhanced', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="animate-pulse p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className={`min-h-screen bg-gray-50 ${className}`}>No data available</div>;
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.role === 'STUDENT' ? 'Student Dashboard' :
             user?.role === 'MENTOR' ? 'Mentor Dashboard' :
             user?.role === 'STAFF' ? 'Staff Dashboard' :
             user?.role === 'EMPLOYER' ? 'Employer Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-gray-600">Welcome back, {user?.name}!</p>
        </div>

        {/* Quick Actions */}
        {dashboardData.quick_actions && dashboardData.quick_actions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.quick_actions.map((action, index) => (
                <div key={index} className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                  action.priority === 'urgent' ? 'border-red-500' :
                  action.priority === 'high' ? 'border-orange-500' :
                  action.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'
                }`}>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{action.description}</p>
                  <a href={action.action_url} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Take Action →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {user?.role === 'STUDENT' && (
            <StudentMetrics metrics={dashboardData.metrics} />
          )}
          {user?.role === 'MENTOR' && (
            <MentorMetrics metrics={dashboardData.metrics} />
          )}
          {user?.role === 'STAFF' && (
            <StaffMetrics metrics={dashboardData.metrics} />
          )}
          {user?.role === 'EMPLOYER' && (
            <EmployerMetrics metrics={dashboardData.metrics} />
          )}
        </div>

        {/* Notifications Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              {user?.role === 'STUDENT' && dashboardData.metrics.recent_activities && (
                <div className="space-y-3">
                  {dashboardData.metrics.recent_activities.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'APPLICATION' ? 'bg-blue-500' :
                        activity.type === 'RECOMMENDATION' ? 'bg-green-500' :
                        activity.type === 'BADGE' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Notifications Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Notifications</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="font-semibold">{dashboardData.notifications_summary?.total_notifications || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unread</span>
                  <span className="font-semibold text-blue-600">{dashboardData.notifications_summary?.unread_count || 0}</span>
                </div>
                {user?.role === 'STUDENT' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Applications</span>
                      <span className="font-semibold text-green-600">{dashboardData.notifications_summary?.unread_applications || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Recommendations</span>
                      <span className="font-semibold text-purple-600">{dashboardData.notifications_summary?.unread_recommendations || 0}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Real-time Data */}
            {dashboardData.real_time_data && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Live Updates</h3>
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 text-green-600 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live</span>
                  </div>
                  <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Student Metrics Component
function StudentMetrics({ metrics }: { metrics: any }) {
  return (
    <>
      <MetricCard
        title="Profile Completion"
        value={`${metrics.profile_completion || 0}%`}
        icon="👤"
        color="blue"
        trend={metrics.profile_completion > 80 ? 'up' : 'stable'}
      />
      <MetricCard
        title="Employability Score"
        value={metrics.employability_score || 0}
        icon="📊"
        color="green"
        trend="up"
      />
      <MetricCard
        title="Active Applications"
        value={metrics.active_applications || 0}
        icon="📄"
        color="purple"
      />
      <MetricCard
        title="Badges Earned"
        value={metrics.badges_earned || 0}
        icon="🏆"
        color="yellow"
      />
    </>
  );
}

// Mentor Metrics Component
function MentorMetrics({ metrics }: { metrics: any }) {
  return (
    <>
      <MetricCard
        title="Pending Approvals"
        value={metrics.pending_approvals || 0}
        icon="⏰"
        color="orange"
        urgent={metrics.overdue_requests > 0}
      />
      <MetricCard
        title="Students Mentored"
        value={metrics.students_mentored || 0}
        icon="👥"
        color="blue"
      />
      <MetricCard
        title="Avg Response Time"
        value={`${metrics.avg_response_time || 0}h`}
        icon="⚡"
        color="green"
      />
      <MetricCard
        title="Approval Rate"
        value={`${metrics.approval_rate || 0}%`}
        icon="✅"
        color="green"
      />
    </>
  );
}

// Staff Metrics Component
function StaffMetrics({ metrics }: { metrics: any }) {
  return (
    <>
      <MetricCard
        title="Total Students"
        value={metrics.total_students || 0}
        icon="🎓"
        color="blue"
      />
      <MetricCard
        title="Placement Rate"
        value={`${metrics.placement_rate || 0}%`}
        icon="📈"
        color="green"
      />
      <MetricCard
        title="Active Employers"
        value={metrics.active_employers || 0}
        icon="💼"
        color="purple"
      />
      <MetricCard
        title="Pending Verifications"
        value={metrics.pending_verifications || 0}
        icon="⚠️"
        color="orange"
      />
    </>
  );
}

// Employer Metrics Component
function EmployerMetrics({ metrics }: { metrics: any }) {
  return (
    <>
      <MetricCard
        title="Posted Internships"
        value={metrics.posted_internships || 0}
        icon="📋"
        color="blue"
      />
      <MetricCard
        title="Total Applications"
        value={metrics.total_applications || 0}
        icon="📄"
        color="purple"
      />
      <MetricCard
        title="Pending Reviews"
        value={metrics.pending_reviews || 0}
        icon="👀"
        color="orange"
      />
      <MetricCard
        title="Hired Students"
        value={metrics.hired_students || 0}
        icon="🎯"
        color="green"
      />
    </>
  );
}

// Reusable Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'yellow';
  trend?: 'up' | 'down' | 'stable';
  urgent?: boolean;
}

function MetricCard({ title, value, icon, color = 'blue', trend, urgent }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
      urgent ? 'border-red-500' : colorClasses[color].split(' ')[2]
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-sm">
          <span className={`inline-flex items-center ${
            trend === 'up' ? 'text-green-600' :
            trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'}
            <span className="ml-1">
              {trend === 'up' ? 'Improving' :
               trend === 'down' ? 'Declining' : 'Stable'}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}