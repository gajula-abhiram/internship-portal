import { NextRequest } from 'next/server';
import { withAuth, ApiResponse, AuthenticatedRequest } from '@/lib/middleware';
import { ApplicationTracker } from '@/lib/application-tracker';

const tracker = new ApplicationTracker();

/**
 * POST /api/tracking
 * Update application tracking status
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { action, data } = body;
    const user = req.user!;

    switch (action) {
      case 'complete_step':
        if (!data.step_id) {
          return ApiResponse.error('Step ID is required', 400);
        }
        
        const success = await tracker.completeStep(
          data.step_id, 
          data.notes, 
          user.id
        );
        
        if (success) {
          return ApiResponse.success({ message: 'Step completed successfully' });
        } else {
          return ApiResponse.error('Failed to complete step', 500);
        }

      case 'schedule_interview':
        if (!data.application_id || !data.interviewer_id || !data.scheduled_datetime) {
          return ApiResponse.error('Required interview data missing', 400);
        }
        
        const interviewId = await tracker.scheduleInterview({
          application_id: data.application_id,
          interviewer_id: data.interviewer_id,
          student_id: data.student_id,
          scheduled_datetime: data.scheduled_datetime,
          duration_minutes: data.duration_minutes || 60,
          mode: data.mode || 'ONLINE',
          meeting_link: data.meeting_link,
          location: data.location,
          status: data.status || 'SCHEDULED',
          interview_type: data.interview_type || 'TECHNICAL',
          notes: data.notes
        });
        
        if (interviewId) {
          // Update tracking step
          const trackingSteps = await tracker.getTrackingSteps(data.application_id);
          const interviewStep = trackingSteps.find(step => step.step === 'Interview Scheduling');
          
          if (interviewStep) {
            await tracker.completeStep(interviewStep.id!, 'Interview scheduled', user.id);
          }
          
          return ApiResponse.success({ 
            message: 'Interview scheduled successfully',
            interview_id: interviewId
          }, 201);
        } else {
          return ApiResponse.error('Failed to schedule interview', 500);
        }

      case 'update_interview_status':
        if (!data.interview_id) {
          return ApiResponse.error('Interview ID is required', 400);
        }
        
        const interviewSuccess = await tracker.updateInterviewStatus(
          data.interview_id,
          data.status,
          data.feedback,
          data.rating
        );
        
        if (interviewSuccess) {
          return ApiResponse.success({ message: 'Interview status updated successfully' });
        } else {
          return ApiResponse.error('Failed to update interview status', 500);
        }

      case 'create_offer':
        if (!data.application_id || !data.student_id || !data.company_id) {
          return ApiResponse.error('Required offer data missing', 400);
        }
        
        const offerId = await tracker.createOffer({
          application_id: data.application_id,
          student_id: data.student_id,
          company_id: data.company_id,
          position_title: data.position_title,
          offer_type: data.offer_type || 'INTERNSHIP',
          offer_details: data.offer_details,
          offer_status: data.offer_status || 'DRAFT',
          offer_date: data.offer_date,
          response_deadline: data.response_deadline,
          contract_signed: data.contract_signed || false,
          contract_details: data.contract_details
        });
        
        if (offerId) {
          return ApiResponse.success({ 
            message: 'Offer created successfully',
            offer_id: offerId
          }, 201);
        } else {
          return ApiResponse.error('Failed to create offer', 500);
        }

      case 'update_offer_status':
        if (!data.offer_id) {
          return ApiResponse.error('Offer ID is required', 400);
        }
        
        const offerSuccess = await tracker.updateOfferStatus(
          data.offer_id,
          data.status,
          data.acceptance_date,
          data.rejection_date,
          data.rejection_reason
        );
        
        if (offerSuccess) {
          return ApiResponse.success({ message: 'Offer status updated successfully' });
        } else {
          return ApiResponse.error('Failed to update offer status', 500);
        }

      case 'record_feedback':
        if (!data.application_id || !data.supervisor_id || !data.rating) {
          return ApiResponse.error('Required feedback data missing', 400);
        }
        
        const feedbackId = await tracker.recordFeedback(
          data.application_id,
          data.supervisor_id,
          data.rating,
          data.comments
        );
        
        if (feedbackId) {
          return ApiResponse.success({ 
            message: 'Feedback recorded successfully',
            feedback_id: feedbackId
          }, 201);
        } else {
          return ApiResponse.error('Failed to record feedback', 500);
        }

      case 'mark_resume_viewed':
        if (!data.application_id) {
          return ApiResponse.error('Application ID is required', 400);
        }
        
        const resumeSuccess = await tracker.markResumeViewed(
          data.application_id,
          user.id
        );
        
        if (resumeSuccess) {
          return ApiResponse.success({ message: 'Resume marked as viewed' });
        } else {
          return ApiResponse.error('Failed to mark resume as viewed', 500);
        }

      default:
        return ApiResponse.error('Invalid action', 400);
    }
  } catch (error) {
    console.error('Tracking API error:', error);
    return ApiResponse.serverError('Failed to process tracking request');
  }
}, ['STAFF', 'MENTOR', 'EMPLOYER']);

/**
 * GET /api/tracking?application_id={id}
 * Get application tracking data
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('application_id');
    
    if (!applicationId) {
      return ApiResponse.error('Application ID is required', 400);
    }
    
    const trackingSteps = await tracker.getTrackingSteps(parseInt(applicationId));
    const interviews = await tracker.getInterviews(parseInt(applicationId));
    const offers = await tracker.getOffers(parseInt(applicationId));
    const resumeStatus = await tracker.getResumeViewStatus(parseInt(applicationId));
    
    return ApiResponse.success({
      tracking_steps: trackingSteps,
      interviews: interviews,
      offers: offers,
      resume_status: resumeStatus
    });
  } catch (error) {
    console.error('Get tracking data error:', error);
    return ApiResponse.serverError('Failed to fetch tracking data');
  }
}, ['STUDENT', 'STAFF', 'MENTOR', 'EMPLOYER']);