// Enhanced Recommendations API with real-time notifications
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { EnhancedRecommendationEngine } from '@/lib/enhanced-recommendation-engine';

const recommendationEngine = new EnhancedRecommendationEngine();

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
    const studentId = url.searchParams.get('studentId') || (decoded.role === 'STUDENT' ? decoded.id.toString() : null);
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    if (action === 'personalized') {
      const includeRecent = url.searchParams.get('includeRecent') === 'true';
      const limit = Number(url.searchParams.get('limit')) || 10;
      
      const recommendations = await recommendationEngine.getPersonalizedRecommendations(
        Number(studentId), 
        includeRecent, 
        limit
      );
      
      return NextResponse.json({ success: true, data: recommendations });
    }
    
    if (action === 'notifications') {
      const limit = Number(url.searchParams.get('limit')) || 20;
      
      const notifications = await recommendationEngine.getNotificationFeed(
        Number(studentId), 
        limit
      );
      
      return NextResponse.json({ success: true, data: notifications });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in enhanced recommendations API:', error);
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
    
    if (action === 'processNewInternship' && ['STAFF', 'EMPLOYER'].includes(decoded.role)) {
      const { internshipId } = body;
      
      if (!internshipId) {
        return NextResponse.json({ error: 'Internship ID required' }, { status: 400 });
      }
      
      const result = await recommendationEngine.processNewInternship(internshipId);
      
      return NextResponse.json({
        success: true,
        message: 'Internship processed for recommendations',
        data: result
      });
    }
    
    if (action === 'refreshRecommendations' && decoded.role === 'STUDENT') {
      const { profileUpdates } = body;
      
      const result = await recommendationEngine.updateStudentAndRefreshRecommendations(
        decoded.id, 
        profileUpdates
      );
      
      return NextResponse.json({
        success: true,
        message: 'Recommendations refreshed',
        data: result
      });
    }
    
    if (action === 'markAsRead') {
      const { notificationIds } = body;
      const studentId = decoded.role === 'STUDENT' ? decoded.id : body.studentId;
      
      if (!studentId) {
        return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
      }
      
      const success = await recommendationEngine.markNotificationsAsRead(
        studentId, 
        notificationIds
      );
      
      return NextResponse.json({
        success,
        message: success ? 'Notifications marked as read' : 'Failed to update notifications'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 403 });
    
  } catch (error) {
    console.error('Error in enhanced recommendations POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}