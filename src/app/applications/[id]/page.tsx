'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { applicationsApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ApplicationDetail {
  id: number;
  internship_id: number;
  internship_title: string;
  internship_description: string;
  company_name: string;
  student_id: number;
  student_name: string;
  student_department: string;
  student_email: string;
  student_skills: string;
  status: string;
  applied_at: string;
  mentor_approved_at: string | null;
  mentor_id: number | null;
  mentor_name: string | null;
  feedback?: {
    id: number;
    rating: number;
    comments: string;
    supervisor_name: string;
    created_at: string;
  }[];
}

export default function ApplicationDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applicationId = params.id as string;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MENTOR_APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MENTOR_REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'INTERVIEWED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OFFERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'NOT_OFFERED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ');
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return 'Your application has been submitted and is awaiting review by your department mentor.';
      case 'MENTOR_APPROVED':
        return 'Your mentor has approved your application. It has been forwarded to the employer for review.';
      case 'MENTOR_REJECTED':
        return 'Your application was not approved by your mentor. Please consult with your mentor for guidance.';
      case 'INTERVIEWED':
        return 'You have completed the interview process. Please wait for the final decision.';
      case 'OFFERED':
        return 'Congratulations! You have received an offer for this position.';
      case 'NOT_OFFERED':
        return 'Unfortunately, you were not selected for this position. Keep applying to other opportunities.';
      case 'COMPLETED':
        return 'You have successfully completed this internship. Well done!';
      default:
        return 'Application status unknown.';
    }
  };

  const getTimelineSteps = (status: string) => {
    const allSteps = [
      { name: 'Application Submitted', status: 'APPLIED', completed: true },
      { name: 'Mentor Review', status: 'MENTOR_APPROVED', completed: ['MENTOR_APPROVED', 'INTERVIEWED', 'OFFERED', 'COMPLETED'].includes(status) },
      { name: 'Employer Review', status: 'EMPLOYER_REVIEW', completed: ['INTERVIEWED', 'OFFERED', 'COMPLETED'].includes(status) },
      { name: 'Interview Process', status: 'INTERVIEWED', completed: ['INTERVIEWED', 'OFFERED', 'COMPLETED'].includes(status) },
      { name: 'Final Decision', status: 'OFFERED', completed: ['OFFERED', 'COMPLETED'].includes(status) },
      { name: 'Completion', status: 'COMPLETED', completed: status === 'COMPLETED' }
    ];

    // Handle rejection cases
    if (status === 'MENTOR_REJECTED') {
      return allSteps.slice(0, 2).map((step, index) => ({
        ...step,
        completed: index === 0,
        rejected: index === 1
      }));
    }

    if (status === 'NOT_OFFERED') {
      return allSteps.slice(0, 4).map((step, index) => ({
        ...step,
        completed: index < 3,
        rejected: index === 3
      }));
    }

    return allSteps;
  };

  useEffect(() => {
    const fetchApplicationDetail = async () => {
      try {
        setLoading(true);
        setError('');
        
        // This would be a new API endpoint to get detailed application info
        const response = await fetch(`/api/applications/${applicationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch application details');
        }

        const data = await response.json();
        setApplication(data);
      } catch (error) {
        console.error('Failed to fetch application details:', error);
        setError('Failed to load application details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplicationDetail();
    }
  }, [applicationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The application you are looking for does not exist.'}</p>
          <Link
            href="/applications"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const timelineSteps = getTimelineSteps(application.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <span>←</span>
            Back
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {application.internship_title}
            </h1>
            <p className="text-gray-600">Application Details</p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
              {getStatusText(application.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-800 mb-2">Current Status</h3>
        <p className="text-blue-700">{getStatusDescription(application.status)}</p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Application Progress</h3>
        
        <div className="space-y-8">
          {timelineSteps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-green-500 border-green-500' 
                    : step.rejected 
                    ? 'bg-red-500 border-red-500'
                    : 'bg-gray-200 border-gray-300'
                }`}></div>
                {index < timelineSteps.length - 1 && (
                  <div className={`w-0.5 h-12 mt-2 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <h4 className={`font-medium ${
                  step.completed 
                    ? 'text-green-700' 
                    : step.rejected 
                    ? 'text-red-700'
                    : 'text-gray-500'
                }`}>
                  {step.name}
                </h4>
                {step.completed && (
                  <p className="text-sm text-green-600 mt-1">✓ Completed</p>
                )}
                {step.rejected && (
                  <p className="text-sm text-red-600 mt-1">✗ {step.status === 'MENTOR_APPROVED' ? 'Rejected by mentor' : 'Not selected'}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Application Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Application Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Applied Date:</span>
              <p className="text-gray-900">{new Date(application.applied_at).toLocaleDateString()}</p>
            </div>
            
            {application.mentor_approved_at && (
              <div>
                <span className="text-sm font-medium text-gray-500">Mentor Review Date:</span>
                <p className="text-gray-900">{new Date(application.mentor_approved_at).toLocaleDateString()}</p>
              </div>
            )}

            {application.mentor_name && (
              <div>
                <span className="text-sm font-medium text-gray-500">Reviewing Mentor:</span>
                <p className="text-gray-900">{application.mentor_name}</p>
              </div>
            )}

            {user?.role !== 'STUDENT' && (
              <>
                <div>
                  <span className="text-sm font-medium text-gray-500">Student:</span>
                  <p className="text-gray-900">{application.student_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Department:</span>
                  <p className="text-gray-900">{application.student_department}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <p className="text-gray-900">{application.student_email}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Internship Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Internship Details</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Position:</span>
              <p className="text-gray-900">{application.internship_title}</p>
            </div>
            
            {application.company_name && (
              <div>
                <span className="text-sm font-medium text-gray-500">Company:</span>
                <p className="text-gray-900">{application.company_name}</p>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-gray-500">Description:</span>
              <p className="text-gray-900 text-sm">{application.internship_description}</p>
            </div>
            
            <div className="pt-2">
              <Link
                href={`/internships/${application.internship_id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Full Job Details →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Student Skills (for non-students) */}
      {user?.role !== 'STUDENT' && application.student_skills && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Student Skills</h3>
          <div className="flex flex-wrap gap-2">
            {JSON.parse(application.student_skills).map((skill: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Section */}
      {application.feedback && application.feedback.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Mentor/Supervisor Feedback</h3>
          
          <div className="space-y-6">
            {application.feedback.map((feedback, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{feedback.supervisor_name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Rating:</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({feedback.rating}/5)</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-2">{feedback.comments}</p>
                
                <p className="text-sm text-gray-500">
                  Submitted on {new Date(feedback.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty Feedback State */}
      {(!application.feedback || application.feedback.length === 0) && (
        ['COMPLETED', 'OFFERED'].includes(application.status) && (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-gray-400 text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
            <p className="text-gray-600">
              Feedback from your mentor or supervisor will appear here once submitted.
            </p>
          </div>
        )
      )}
    </div>
  );
}