'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { applicationsApi } from '@/lib/api';
import Link from 'next/link';

interface Application {
  id: number;
  internship_id: number;
  internship_title: string;
  student_id: number;
  student_name: string;
  student_department: string;
  status: string;
  applied_at: string;
  mentor_approved_at: string | null;
  mentor_id: number | null;
  mentor_name: string | null;
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const statusOptions = [
    'APPLIED',
    'MENTOR_APPROVED', 
    'MENTOR_REJECTED',
    'INTERVIEWED',
    'OFFERED',
    'NOT_OFFERED',
    'COMPLETED'
  ];

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

  const getStatusText = (status: string) => {
    return status.replace('_', ' ');
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const data = await applicationsApi.getAll();
        setApplications(data);
        setFilteredApplications(data);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = applications;

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.internship_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.student_department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [applications, selectedStatus, searchTerm]);

  const handleApprove = async (applicationId: number) => {
    try {
      await applicationsApi.approve(applicationId);
      // Refresh the applications
      const data = await applicationsApi.getAll();
      setApplications(data);
    } catch (error) {
      console.error('Failed to approve application:', error);
      alert('Failed to approve application');
    }
  };

  const handleReject = async (applicationId: number) => {
    try {
      await applicationsApi.reject(applicationId);
      // Refresh the applications
      const data = await applicationsApi.getAll();
      setApplications(data);
    } catch (error) {
      console.error('Failed to reject application:', error);
      alert('Failed to reject application');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    switch (user?.role) {
      case 'STUDENT':
        return 'My Applications';
      case 'MENTOR':
        return 'Applications for Approval';
      case 'STAFF':
        return 'All Applications';
      case 'EMPLOYER':
        return 'Applications for Your Positions';
      default:
        return 'Applications';
    }
  };

  const getPageDescription = () => {
    switch (user?.role) {
      case 'STUDENT':
        return 'Track the status of your internship and placement applications';
      case 'MENTOR':
        return 'Review and approve student applications from your department';
      case 'STAFF':
        return 'Monitor all applications across the platform';
      case 'EMPLOYER':
        return 'Review applications for your posted positions';
      default:
        return 'Application management';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getPageTitle()}
        </h1>
        <p className="text-gray-600">
          {getPageDescription()}
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filter Applications</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by internship title, student name, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{getStatusText(status)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredApplications.length} of {applications.length} applications
        </p>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <div key={application.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {application.internship_title}
                      </h3>
                      {user?.role !== 'STUDENT' && (
                        <div className="text-sm text-gray-600 mb-2">
                          <p><strong>Student:</strong> {application.student_name}</p>
                          <p><strong>Department:</strong> {application.student_department}</p>
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        <p>Applied on: {new Date(application.applied_at).toLocaleDateString()}</p>
                        {application.mentor_approved_at && (
                          <p>Mentor reviewed on: {new Date(application.mentor_approved_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                  </div>

                  {/* Timeline Progress */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        ['APPLIED', 'MENTOR_APPROVED', 'MENTOR_REJECTED', 'INTERVIEWED', 'OFFERED', 'NOT_OFFERED', 'COMPLETED'].includes(application.status)
                          ? 'bg-blue-500' 
                          : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1 h-1 bg-gray-200">
                        <div className={`h-1 ${
                          ['MENTOR_APPROVED', 'INTERVIEWED', 'OFFERED', 'COMPLETED'].includes(application.status)
                            ? 'bg-blue-500' 
                            : 'bg-gray-200'
                        } transition-all duration-300`} style={{
                          width: application.status === 'APPLIED' ? '20%' :
                                 application.status === 'MENTOR_APPROVED' ? '40%' :
                                 application.status === 'INTERVIEWED' ? '60%' :
                                 application.status === 'OFFERED' ? '80%' :
                                 application.status === 'COMPLETED' ? '100%' : '0%'
                        }}></div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        ['COMPLETED'].includes(application.status)
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Applied</span>
                      <span>In Progress</span>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4 lg:mt-0 lg:ml-6">
                  {user?.role === 'MENTOR' && application.status === 'APPLIED' && (
                    <>
                      <button
                        onClick={() => handleApprove(application.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(application.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {user?.role === 'STUDENT' && (
                    <Link
                      href={`/internships/${application.internship_id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      View Internship
                    </Link>
                  )}

                  {(user?.role === 'STAFF' || user?.role === 'EMPLOYER') && (
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600 mb-4">
            {applications.length === 0 
              ? "No applications have been submitted yet."
              : "Try adjusting your search criteria or clear the filters to see all applications."
            }
          </p>
          {user?.role === 'STUDENT' && applications.length === 0 && (
            <Link
              href="/internships"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Browse Internships
            </Link>
          )}
          {applications.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}