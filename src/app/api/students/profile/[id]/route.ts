// API endpoint for enhanced student profiles
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ProfileManager } from '@/lib/profile-manager';

const profileManager = new ProfileManager();

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await context.params;
    
    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const requestedUserId = Number(userId);
    
    if (requestedUserId !== decoded.id && 
        !['STAFF', 'EMPLOYER', 'MENTOR'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const profileData = await profileManager.getStudentProfile(requestedUserId);
    const visibility = await profileManager.getProfileVisibility(requestedUserId);
    
    return NextResponse.json({
      success: true,
      data: { ...profileData, visibility }
    });
    
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await context.params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = body;

    const success = await profileManager.updateProfile(decoded.id, updates);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    const updatedProfile = await profileManager.getStudentProfile(decoded.id);
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
    
  } catch (error) {
    console.error('Error updating student profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}