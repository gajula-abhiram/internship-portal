// Interview Scheduling API with Calendar Sync
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { InterviewScheduler } from '@/lib/interview-scheduler';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'available_slots') {
      const interviewerId = url.searchParams.get('interviewerId');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const duration = Number(url.searchParams.get('duration')) || 60;
      
      if (!interviewerId || !startDate || !endDate) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
      }
      
      const availableSlots = InterviewScheduler.getAvailableSlots(
        Number(interviewerId),
        startDate,
        endDate,
        duration
      );
      
      return NextResponse.json({ success: true, data: availableSlots });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in interview scheduling GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    
    if (action === 'schedule_interview' && ['STAFF', 'EMPLOYER'].includes(decoded.role)) {
      const {
        application_id,
        interviewer_id,
        student_id,
        date_time,
        mode,
        duration,
        notes
      } = body;
      
      if (!application_id || !interviewer_id || !student_id || !date_time || !mode) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      try {
        const interviewSlot = await InterviewScheduler.scheduleInterview(
          application_id,
          interviewer_id,
          student_id,
          date_time,
          mode,
          duration || 60,
          notes
        );
        
        return NextResponse.json({
          success: true,
          message: 'Interview scheduled successfully',
          data: interviewSlot
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to schedule interview';
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
    }
    
    if (action === 'update_status') {
      const { interview_id, status, notes } = body;
      
      if (!interview_id || !status) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      await InterviewScheduler.updateInterviewStatus(interview_id, status, notes);
      
      return NextResponse.json({
        success: true,
        message: 'Interview status updated successfully'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 403 });
    
  } catch (error) {
    console.error('Error in interview scheduling POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}