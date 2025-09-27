'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { analyticsApi, internshipsApi, applicationsApi } from '@/lib/api';
import Link from 'next/link';

interface DashboardData {
  summary?: {
    unplaced_students: number;
    open_positions: number;
    total_applications: number;
    average_rating: number;
    total_feedback: number;
  };
  status_breakdown?: Array<{ status: string; count: number }>;
  recent_applications?: Array<any>;
  top_internships?: Array<any>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({});
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (user?.role === 'STAFF') {
          const analyticsData = await analyticsApi.getDashboard();
          setData(analyticsData);
        } else if (user?.role === 'STUDENT') {
          const [internshipsData, applicationsData] = await Promise.all([
            internshipsApi.getAll(user.department),
            applicationsApi.getAll()
          ]);
          setInternships(internshipsData.slice(0, 5)); // Show top 5
          setApplications(applicationsData.slice(0, 5)); // Show recent 5
        } else if (user?.role === 'MENTOR') {
          const applicationsData = await applicationsApi.getAll('APPLIED');
          setApplications(applicationsData.slice(0, 10));
        } else if (user?.role === 'EMPLOYER') {
          const applicationsData = await applicationsApi.getAll();
          setApplications(applicationsData.slice(0, 10));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

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

  const renderStaffDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Dashboard</h1>
        <p className="text-gray-600">Monitor the placement process and track student progress</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-100 text-sm font-medium">Unplaced Students</h3>
              <p className="text-3xl font-bold">{data.summary?.unplaced_students || 0}</p>
            </div>
            <div className="text-4xl opacity-80">🎓</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-blue-100 text-sm font-medium">Open Positions</h3>
              <p className="text-3xl font-bold">{data.summary?.open_positions || 0}</p>
            </div>
            <div className="text-4xl opacity-80">💼</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-green-100 text-sm font-medium">Total Applications</h3>
              <p className="text-3xl font-bold">{data.summary?.total_applications || 0}</p>
            </div>
            <div className="text-4xl opacity-80">📝</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-yellow-100 text-sm font-medium">Average Rating</h3>
              <p className="text-3xl font-bold">{data.summary?.average_rating || 0}</p>
            </div>
            <div className="text-4xl opacity-80">⭐</div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Application Status Breakdown</h3>
          <div className="space-y-3">
            {data.status_breakdown?.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">{item.status.replace('_', ' ')}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(item.count / (data.summary?.total_applications || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-gray-900">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Recent Applications</h3>
          <div className="space-y-3">
            {data.recent_applications?.slice(0, 5).map((app, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 hover:bg-gray-50 transition-colors">
                <p className="font-medium text-gray-900">{app.student_name}</p>
                <p className="text-sm text-gray-600">{app.internship_title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">{app.status.replace('_', ' ')}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    app.status === 'APPLIED' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'MENTOR_APPROVED' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'OFFERED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Actions for Staff */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/internships/manage" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">💼</div>
            <div className="font-medium text-gray-900">Manage Internships</div>
          </Link>
          
          <Link href="/applications" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-gray-900">View Applications</div>
          </Link>
          
          <Link href="/analytics" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-gray-900">Analytics</div>
          </Link>
          
          <Link href="/feedback" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">⭐</div>
            <div className="font-medium text-gray-900">Feedback</div>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderStudentDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Discover new opportunities and track your applications</p>
      </div>
      
      {/* Quick Stats for Students */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Available Internships</p>
              <p className="text-3xl font-bold">{internships.length}</p>
            </div>
            <div className="text-4xl opacity-80">💼</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">My Applications</p>
              <p className="text-3xl font-bold">{applications.length}</p>
            </div>
            <div className="text-4xl opacity-80">📝</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Department</p>
              <p className="text-lg font-semibold">{user?.department || 'Not Set'}</p>
            </div>
            <div className="text-4xl opacity-80">🎓</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Latest Internships</h3>
            <Link href="/internships" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {internships.slice(0, 5).map((internship: any, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors">
                <Link href={`/internships/${internship.id}`} className="block">
                  <p className="font-medium text-gray-900 hover:text-blue-600">{internship.title}</p>
                  <p className="text-sm text-gray-600">₹{internship.stipend_min} - ₹{internship.stipend_max}</p>
                  <p className="text-xs text-gray-500">{internship.posted_by_name}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">My Applications</h3>
            <Link href="/applications" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {applications.slice(0, 5).map((app: any, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                <p className="font-medium text-gray-900">{app.internship_title}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Status: {app.status.replace('_', ' ')}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    app.status === 'APPLIED' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'MENTOR_APPROVED' ? 'bg-blue-100 text-blue-800' :
                    app.status === 'OFFERED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📝</p>
                <p>No applications yet</p>
                <Link href="/internships" className="text-blue-600 hover:text-blue-800 text-sm">
                  Browse Internships
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/internships" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-medium text-gray-900">Browse Internships</div>
            <div className="text-sm text-gray-600">Find your perfect opportunity</div>
          </Link>
          
          <Link href="/profile" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-gray-900">Update Profile</div>
            <div className="text-sm text-gray-600">Keep your info current</div>
          </Link>
          
          <Link href="/applications" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-gray-900">Track Applications</div>
            <div className="text-sm text-gray-600">Monitor your progress</div>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderMentorDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentor Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
        <div className="space-y-3">
          {applications.map((app: any, index) => (
            <div key={index} className="border-l-4 border-yellow-500 pl-3">
              <p className="font-medium">{app.student_name}</p>
              <p className="text-sm text-gray-600">{app.internship_title}</p>
              <p className="text-xs text-gray-500">Department: {app.student_department}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEmployerDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Employer Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Applications</h3>
        <div className="space-y-3">
          {applications.map((app: any, index) => (
            <div key={index} className="border-l-4 border-purple-500 pl-3">
              <p className="font-medium">{app.student_name}</p>
              <p className="text-sm text-gray-600">{app.internship_title}</p>
              <p className="text-xs text-gray-500">Status: {app.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  switch (user?.role) {
    case 'STAFF':
      return renderStaffDashboard();
    case 'STUDENT':
      return renderStudentDashboard();
    case 'MENTOR':
      return renderMentorDashboard();
    case 'EMPLOYER':
      return renderEmployerDashboard();
    default:
      return <div>Access denied</div>;
  }
}