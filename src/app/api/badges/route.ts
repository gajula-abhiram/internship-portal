// API endpoint for badge management
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { BadgeManager } from '@/lib/badge-manager';

const badgeManager = new BadgeManager();

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
    const userId = url.searchParams.get('userId');
    const type = url.searchParams.get('type'); // 'all', 'user', 'leaderboard'
    
    if (type === 'all') {
      // Get all available badges
      const badges = await badgeManager.getAllBadges();
      return NextResponse.json({ success: true, data: badges });
    }
    
    if (type === 'user' && userId) {
      // Get user's badges
      const userBadges = await badgeManager.getUserBadges(Number(userId));
      const stats = await badgeManager.getUserBadgeStats(Number(userId));
      
      return NextResponse.json({
        success: true,
        data: { badges: userBadges, stats }
      });
    }
    
    if (type === 'leaderboard') {
      const department = url.searchParams.get('department');
      const limit = Number(url.searchParams.get('limit')) || 10;
      
      const leaderboard = await badgeManager.getBadgeLeaderboard(limit, department || undefined);
      return NextResponse.json({ success: true, data: leaderboard });
    }
    
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in badges API:', error);
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
    
    if (!decoded || !['STAFF', 'MENTOR'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, badgeId } = body;
    
    if (action === 'award' && userId && badgeId) {
      const success = await badgeManager.awardBadge(userId, badgeId, {
        awarded_by: decoded.id,
        manual_award: true
      });
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Badge awarded successfully'
        });
      } else {
        return NextResponse.json({ error: 'Failed to award badge' }, { status: 400 });
      }
    }
    
    if (action === 'check' && userId) {
      const awardedBadges = await badgeManager.checkAndAwardBadges(userId, 'manual_check');
      
      return NextResponse.json({
        success: true,
        message: `${awardedBadges.length} new badges awarded`,
        data: awardedBadges
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in badges POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}