// Single-Click Application API
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SingleClickApplicationManager } from '@/lib/single-click-application';

const applicationManager = new SingleClickApplicationManager();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Only students can submit applications' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;
    
    if (action === 'submit') {
      const applicationData = {
        internship_id: body.internship_id,
        student_id: decoded.id,
        auto_generated_cover_letter: body.auto_generated_cover_letter || false,
        custom_message: body.custom_message,
        include_portfolio: body.include_portfolio || false,
        expected_start_date: body.expected_start_date
      };
      
      if (!applicationData.internship_id) {
        return NextResponse.json({ error: 'Internship ID is required' }, { status: 400 });
      }
      
      const result = await applicationManager.submitQuickApplication(applicationData);
      
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    
    if (action === 'bulk_apply') {
      const { internship_ids, common_message } = body;
      
      if (!internship_ids || !Array.isArray(internship_ids) || internship_ids.length === 0) {
        return NextResponse.json({ error: 'Internship IDs array is required' }, { status: 400 });
      }
      
      if (internship_ids.length > 10) {
        return NextResponse.json({ error: 'Maximum 10 applications allowed in bulk' }, { status: 400 });
      }
      
      const result = await applicationManager.bulkApply(decoded.id, internship_ids, common_message);
      
      return NextResponse.json({
        success: true,
        message: `${result.successful_applications} applications submitted successfully`,
        data: result
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in single-click application API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const applicationId = url.searchParams.get('applicationId');
    
    if (action === 'status' && applicationId) {
      // Check if user has access to this application
      if (decoded.role === 'STUDENT') {
        // Students can only view their own applications
        const appCheck = await applicationManager.getApplicationStatus(Number(applicationId));
        if (appCheck.application.student_id !== decoded.id) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      } else if (!['STAFF', 'MENTOR', 'EMPLOYER'].includes(decoded.role)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      
      const status = await applicationManager.getApplicationStatus(Number(applicationId));
      return NextResponse.json({ success: true, data: status });
    }
    
    if (action === 'statistics' && decoded.role === 'STUDENT') {
      const stats = await applicationManager.getApplicationStatistics(decoded.id);
      return NextResponse.json({ success: true, data: stats });
    }
    
    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in single-click application GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}