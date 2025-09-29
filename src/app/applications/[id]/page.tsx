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
  tracking_steps?: {
    id: number;
    application_id: number;
    step: string;
    status: string;
    completed_at: string | null;
    notes: string | null;
    actor_id: number | null;
    created_at: string;
  }[];
  interviews?: {
    id: number;
    application_id: number;
    interviewer_id: number;
    student_id: number;
    scheduled_datetime: string;
    duration_minutes: number;
    mode: string;
    meeting_link: string | null;
    location: string | null;
    status: string;
    interview_type: string;
    notes: string | null;
    feedback: string | null;
    rating: number | null;
    created_at: string;
    updated_at: string;
  }[];
  offers?: {
    id: number;
    application_id: number;
    student_id: number;
    company_id: number;
    position_title: string;
    offer_type: string;
    offer_details: string;
    offer_status: string;
    offer_date: string;
    response_deadline: string;
    acceptance_date: string | null;
    rejection_date: string | null;
    rejection_reason: string | null;
    contract_signed: boolean;
    contract_details: string | null;
    created_at: string;
    updated_at: string;
  }[];
}

interface ChatMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_role: string;
}

export default function ApplicationDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

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

    // Add rejected property to all steps for type consistency
    return allSteps.map(step => ({
      ...step,
      rejected: false
    }));
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
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        );
      case 'IN_PROGRESS':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
        );
      case 'PENDING':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        );
      case 'SKIPPED':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          </div>
        );
    }
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

  // Fetch chat data when application is loaded and user is student or mentor
  useEffect(() => {
    const fetchChatData = async () => {
      if (!application || !user || (user.role !== 'STUDENT' && user.role !== 'MENTOR')) {
        return;
      }

      try {
        setChatLoading(true);
        const response = await fetch(`/api/chat/rooms/${application.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setChatRoom(data.chat_room);
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch chat data:', error);
      } finally {
        setChatLoading(false);
      }
    };

    fetchChatData();
  }, [application, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !application) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          application_id: application.id,
          message: newMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage('');
        
        // If this is the first message, set the chat room
        if (!chatRoom) {
          setChatRoom({ id: data.chat_room_id });
        }
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

      {/* Detailed Application Tracking */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Application Tracking</h3>
        
        <div className="space-y-6">
          {application.tracking_steps && application.tracking_steps.length > 0 ? (
            application.tracking_steps.map((step, index) => {
              const statusInfo = getTrackingStepStatus(step.status);
              return (
                <div key={step.id} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    {getStepIcon(step.status)}
                    {index < application.tracking_steps!.length - 1 && (
                      <div className={`w-0.5 h-12 ${
                        step.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">{step.step}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {step.completed_at 
                        ? `Completed on ${new Date(step.completed_at).toLocaleDateString()}` 
                        : `Started on ${new Date(step.created_at).toLocaleDateString()}`}
                    </p>
                    {step.notes && (
                      <p className="text-gray-500 text-sm mt-2">{step.notes}</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-gray-500">
              No tracking information available yet.
            </div>
          )}
        </div>
      </div>

      {/* Interview Information */}
      {application.interviews && application.interviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Interview Schedule</h3>
          
          <div className="space-y-4">
            {application.interviews.map((interview) => (
              <div key={interview.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{interview.interview_type} Interview</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {new Date(interview.scheduled_datetime).toLocaleString()}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {interview.mode === 'ONLINE' ? 'Online' : 'In-person'} • {interview.duration_minutes} minutes
                    </p>
                    {interview.location && (
                      <p className="text-gray-600 text-sm mt-1">Location: {interview.location}</p>
                    )}
                    {interview.meeting_link && (
                      <p className="text-blue-600 text-sm mt-1">
                        Meeting Link: <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="underline">
                          {interview.meeting_link}
                        </a>
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    interview.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                    interview.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    interview.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                    interview.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {interview.status.replace('_', ' ')}
                  </span>
                </div>
                {interview.notes && (
                  <p className="text-gray-700 text-sm mt-3">{interview.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offer Information */}
      {application.offers && application.offers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Offer Status</h3>
          
          <div className="space-y-4">
            {application.offers.map((offer) => (
              <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{offer.position_title}</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Offer Date: {new Date(offer.offer_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      Response Deadline: {new Date(offer.response_deadline).toLocaleDateString()}
                    </p>
                    {offer.offer_details && (
                      <div className="mt-2">
                        <p className="text-gray-700 text-sm">
                          {offer.offer_details}
                        </p>
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    offer.offer_status === 'EXTENDED' ? 'bg-blue-100 text-blue-800' :
                    offer.offer_status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                    offer.offer_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    offer.offer_status === 'EXPIRED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {offer.offer_status.replace('_', ' ')}
                  </span>
                </div>
                {offer.rejection_reason && (
                  <p className="text-red-700 text-sm mt-3">Rejection Reason: {offer.rejection_reason}</p>
                )}
                {offer.contract_signed && (
                  <p className="text-green-700 text-sm mt-2">Contract Signed</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Student Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{application.student_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{application.student_department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{application.student_email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Skills</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {application.student_skills && Array.isArray(application.student_skills) ? (
                  application.student_skills.map((skill: string, index: number) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No skills listed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Internship Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Internship Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Title</p>
              <p className="font-medium">{application.internship_title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium">{application.internship_description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Applied Date</p>
              <p className="font-medium">
                {new Date(application.applied_at).toLocaleDateString()}
              </p>
            </div>
            {application.mentor_name && (
              <div>
                <p className="text-sm text-gray-500">Mentor</p>
                <p className="font-medium">{application.mentor_name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      {application.feedback && application.feedback.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h3>
          <div className="space-y-4">
            {application.feedback.map((feedback) => (
              <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{feedback.supervisor_name}</h4>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{feedback.rating}/5</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </span>
                </div>
                {feedback.comments && (
                  <p className="mt-3 text-gray-700">{feedback.comments}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Section */}
      {(user?.role === 'STUDENT' || user?.role === 'MENTOR') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Chat with {user?.role === 'STUDENT' ? 'Mentor' : 'Student'}</h3>
            <button
              onClick={() => setShowChat(!showChat)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </button>
          </div>
          
          {showChat && (
            <div className="border border-gray-200 rounded-lg">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-sm">
                              {message.sender_name}
                            </span>
                            <span className="text-xs opacity-75 ml-2">
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}