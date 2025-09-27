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
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') as 'skills' | 'companies' | 'titles' | 'all' || 'all';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [],
          skills: [],
          companies: [],
          locations: []
        }
      });
    }

    // Get autocomplete suggestions
    const suggestions = await SearchEngine.getAutocompleteSuggestions(query, type);

    return NextResponse.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Autocomplete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during autocomplete' },
      { status: 500 }
    );
  }
}