'use client';

import { useState, useEffect } from 'react';

interface TrackingStep {
  id: number;
  application_id: number;
  step: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completed_at: string | null;
  notes: string | null;
  actor_id: number | null;
  created_at: string;
}

interface InterviewSchedule {
  id: number;
  application_id: number;
  interviewer_id: number;
  student_id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  mode: 'ONLINE' | 'OFFLINE' | 'PHONE';
  meeting_link: string | null;
  location: string | null;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED';
  interview_type: 'TECHNICAL' | 'HR' | 'MANAGER' | 'FINAL';
  notes: string | null;
  feedback: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface PlacementOffer {
  id: number;
  application_id: number;
  student_id: number;
  company_id: number;
  position_title: string;
  offer_type: 'INTERNSHIP' | 'PLACEMENT' | 'FULL_TIME';
  offer_details: string;
  offer_status: 'DRAFT' | 'EXTENDED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  offer_date: string;
  response_deadline: string;
  acceptance_date: string | null;
  rejection_date: string | null;
  rejection_reason: string | null;
  contract_signed: boolean;
  contract_details: string | null;
  created_at: string;
  updated_at: string;
}

interface ApplicationTrackerProps {
  applicationId: number;
  initialTrackingSteps?: TrackingStep[];
  initialInterviews?: InterviewSchedule[];
  initialOffers?: PlacementOffer[];
}

export default function ApplicationTracker({
  applicationId,
  initialTrackingSteps = [],
  initialInterviews = [],
  initialOffers = []
}: ApplicationTrackerProps) {
  const [trackingSteps, setTrackingSteps] = useState<TrackingStep[]>(initialTrackingSteps);
  const [interviews, setInterviews] = useState<InterviewSchedule[]>(initialInterviews);
  const [offers, setOffers] = useState<PlacementOffer[]>(initialOffers);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tracking?application_id=${applicationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTrackingSteps(data.data.tracking_steps || []);
          setInterviews(data.data.interviews || []);
          setOffers(data.data.offers || []);
        }
      } catch (error) {
        console.error('Failed to fetch tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId && trackingSteps.length === 0) {
      fetchTrackingData();
    }
  }, [applicationId, trackingSteps.length]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Application Tracking Steps */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Tracking</h3>
        
        <div className="space-y-6">
          {trackingSteps.length > 0 ? (
            trackingSteps.map((step, index) => {
              const statusInfo = getTrackingStepStatus(step.status);
              return (
                <div key={step.id} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    {getStepIcon(step.status)}
                    {index < trackingSteps.length - 1 && (
                      <div className={`w-0.5 h-12 ${
                        step.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium text-gray-900">{step.step}</h4>
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
      {interviews.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Schedule</h3>
          
          <div className="space-y-4">
            {interviews.map((interview) => (
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
      {offers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Status</h3>
          
          <div className="space-y-4">
            {offers.map((offer) => (
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
    </div>
  );
}