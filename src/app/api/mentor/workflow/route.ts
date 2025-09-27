// Mentor Approval Workflow API
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { AutomatedMentorWorkflow } from '@/lib/automated-mentor-workflow';

const mentorWorkflow = new AutomatedMentorWorkflow();

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
    
    if (action === 'workqueue' && decoded.role === 'MENTOR') {
      const workqueue = await mentorWorkflow.getMentorWorkqueue(decoded.id);
      return NextResponse.json({ success: true, data: workqueue });
    }
    
    if (action === 'analytics' && ['STAFF', 'MENTOR'].includes(decoded.role)) {
      const analytics = await mentorWorkflow.getWorkflowAnalytics();
      return NextResponse.json({ success: true, data: analytics });
    }
    
    return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 403 });
    
  } catch (error) {
    console.error('Error in mentor workflow GET API:', error);
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
    
    if (action === 'submit_for_approval' && ['STAFF', 'STUDENT'].includes(decoded.role)) {
      const { applicationId } = body;
      
      if (!applicationId) {
        return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
      }
      
      const result = await mentorWorkflow.submitForMentorApproval(applicationId);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    
    if (action === 'process_decision' && decoded.role === 'MENTOR') {
      const { approvalRequestId, decision, comments } = body;
      
      if (!approvalRequestId || !['APPROVED', 'REJECTED'].includes(decision)) {
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
      }
      
      const result = await mentorWorkflow.processMentorDecision(
        approvalRequestId,
        decoded.id,
        decision,
        comments
      );
      
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    
    return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 403 });
    
  } catch (error) {
    console.error('Error in mentor workflow POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}