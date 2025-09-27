// Placement Heatmap API with real-time department statistics
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { PlacementHeatmapManager } from '@/lib/placement-heatmap-manager';

const heatmapManager = new PlacementHeatmapManager();

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
    const department = url.searchParams.get('department');
    const lastUpdate = url.searchParams.get('lastUpdate');
    
    if (action === 'full') {
      // Get complete heatmap data
      const heatmapData = await heatmapManager.getPlacementHeatmap();
      return NextResponse.json({ success: true, data: heatmapData });
    }
    
    if (action === 'department' && department) {
      // Get detailed analytics for specific department
      const departmentAnalytics = await heatmapManager.getDepartmentAnalytics(department);
      return NextResponse.json({ success: true, data: departmentAnalytics });
    }
    
    if (action === 'live' && lastUpdate) {
      // Get live updates since last refresh
      const liveUpdates = await heatmapManager.getLiveUpdates(lastUpdate);
      return NextResponse.json({ success: true, data: liveUpdates });
    }
    
    if (action === 'departments') {
      // Get just department statistics for quick refresh
      const departmentStats = await heatmapManager.getDepartmentStats();
      return NextResponse.json({ success: true, data: departmentStats });
    }
    
    // Default: return full heatmap data
    const heatmapData = await heatmapManager.getPlacementHeatmap();
    return NextResponse.json({ success: true, data: heatmapData });
    
  } catch (error) {
    console.error('Error in placement heatmap API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}