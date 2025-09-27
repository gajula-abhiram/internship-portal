// Enhanced Internship API with verification and advanced features
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { InternshipManager } from '@/lib/internship-manager';

const internshipManager = new InternshipManager();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'stats') {
      const department = url.searchParams.get('department');
      const stats = await internshipManager.getInternshipStats(department || undefined);
      return NextResponse.json({ success: true, data: stats });
    }
    
    if (action === 'trending') {
      const trends = await internshipManager.getTrendingSkillsAndCompetencies();
      return NextResponse.json({ success: true, data: trends });
    }
    
    // Regular enhanced internship listing
    const departments = url.searchParams.getAll('department');
    const skills = url.searchParams.getAll('skill');
    const competencies = url.searchParams.getAll('competency');
    const stipendMin = url.searchParams.get('stipendMin');
    const stipendMax = url.searchParams.get('stipendMax');
    const company = url.searchParams.get('company');
    const location = url.searchParams.get('location');
    const placementConversion = url.searchParams.getAll('placementConversion');
    const verificationStatus = url.searchParams.get('verificationStatus');
    const limit = Number(url.searchParams.get('limit')) || 50;
    
    const filters = {
      departments: departments.length > 0 ? departments : undefined,
      skills: skills.length > 0 ? skills : undefined,
      competencies: competencies.length > 0 ? competencies : undefined,
      stipend_min: stipendMin ? Number(stipendMin) : undefined,
      stipend_max: stipendMax ? Number(stipendMax) : undefined,
      company: company || undefined,
      location: location || undefined,
      placement_conversion: placementConversion.length > 0 ? placementConversion : undefined,
      verification_status: verificationStatus || undefined
    };
    
    const internships = await internshipManager.getInternships(filters, limit);
    
    return NextResponse.json({
      success: true,
      data: internships,
      count: internships.length
    });
    
  } catch (error) {
    console.error('Error in enhanced internships API:', error);
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
    
    if (action === 'verify' && ['STAFF'].includes(decoded.role)) {
      const { internshipId, status, notes } = body;
      
      if (!internshipId || !['VERIFIED', 'REJECTED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid verification data' }, { status: 400 });
      }
      
      const success = await internshipManager.verifyInternship(internshipId, status, decoded.id, notes);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: `Internship ${status.toLowerCase()} successfully`
        });
      } else {
        return NextResponse.json({ error: 'Failed to verify internship' }, { status: 500 });
      }
    }
    
    if (action === 'create' && ['STAFF', 'EMPLOYER'].includes(decoded.role)) {
      const internshipData = body.data;
      
      if (!internshipData?.title || !internshipData?.description) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const internshipId = await internshipManager.createInternship(internshipData, decoded.id);
      
      if (!internshipId) {
        return NextResponse.json({ error: 'Failed to create internship' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Internship created successfully. Pending verification.',
        data: { id: internshipId }
      }, { status: 201 });
    }
    
    return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 403 });
    
  } catch (error) {
    console.error('Error in enhanced internships POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || !['STAFF', 'EMPLOYER'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { id, updates } = body;
    
    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing ID or updates' }, { status: 400 });
    }
    
    const success = await internshipManager.updateInternship(id, updates);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Internship updated successfully'
      });
    } else {
      return NextResponse.json({ error: 'Failed to update internship' }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error updating internship:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}