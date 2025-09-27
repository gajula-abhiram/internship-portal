// Enhanced Dashboard API with role-based real-time analytics
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { DashboardManager } from '@/lib/dashboard-manager';

const dashboardManager = new DashboardManager();

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
    const targetUserId = url.searchParams.get('userId');
    const targetRole = url.searchParams.get('role');
    
    // Determine which user's dashboard to fetch
    let userId = decoded.id;
    let role = decoded.role;
    
    // Allow staff to view other users' dashboards
    if (targetUserId && targetRole && decoded.role === 'STAFF') {
      const validRoles = ['STUDENT', 'MENTOR', 'STAFF', 'EMPLOYER'];
      if (validRoles.includes(targetRole)) {
        userId = Number(targetUserId);
        role = targetRole as 'STUDENT' | 'MENTOR' | 'STAFF' | 'EMPLOYER';
      }
    }
    
    // Get dashboard data based on role
    const dashboardData = await dashboardManager.getDashboard(userId, role);
    
    return NextResponse.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}