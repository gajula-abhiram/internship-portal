import { NextRequest, NextResponse } from 'next/server';
import { SearchEngine } from '@/lib/search-engine';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse search parameters
    const query = searchParams.get('query') || '';
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];
    const department = searchParams.get('department') || '';
    const location = searchParams.get('location') || '';
    const stipendMin = searchParams.get('stipendMin') ? parseInt(searchParams.get('stipendMin')!) : undefined;
    const stipendMax = searchParams.get('stipendMax') ? parseInt(searchParams.get('stipendMax')!) : undefined;
    const durationMin = searchParams.get('durationMin') ? parseInt(searchParams.get('durationMin')!) : undefined;
    const durationMax = searchParams.get('durationMax') ? parseInt(searchParams.get('durationMax')!) : undefined;
    const type = searchParams.get('type') as 'internship' | 'placement' | 'both' | undefined;
    const sortBy = searchParams.get('sortBy') as 'relevance' | 'stipend' | 'date' | 'rating' | 'applications' | undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Get user skills for relevance scoring
    const userSkills = user.skills ? user.skills.split(',') : [];

    // Build search filters
    const filters = {
      query,
      skills,
      departments: department ? [department] : [],
      location: location ? [location] : [],
      stipendMin,
      stipendMax,
      type,
      sortBy: sortBy || 'relevance',
      sortOrder: sortOrder || 'desc'
    };

    // Perform search
    const searchResults = await SearchEngine.search(filters, userSkills, limit, offset);

    return NextResponse.json({
      success: true,
      data: searchResults,
      pagination: {
        limit,
        offset,
        total: searchResults.analytics.totalResults,
        hasMore: searchResults.analytics.totalResults > offset + limit
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during search' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, filters = {}, userSkills = [], limit = 20, offset = 0 } = body;

    // Validate request
    if (typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query parameter' }, { status: 400 });
    }

    // Merge user skills from profile
    const combinedSkills = user.skills ? 
      [...new Set([...userSkills, ...user.skills.split(',')])] : 
      userSkills;

    // Perform advanced search
    const searchResults = await SearchEngine.search(
      { query, ...filters },
      combinedSkills,
      limit,
      offset
    );

    // Mock logging since logSearch method doesn't exist
    console.log('Search logged:', {
      userId: user.id,
      query,
      filters: JSON.stringify(filters),
      resultCount: searchResults.analytics.totalResults
    });

    return NextResponse.json({
      success: true,
      data: searchResults,
      pagination: {
        limit,
        offset,
        total: searchResults.analytics.totalResults,
        hasMore: searchResults.analytics.totalResults > offset + limit
      }
    });

  } catch (error) {
    console.error('Advanced search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during advanced search' },
      { status: 500 }
    );
  }
}