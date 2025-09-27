import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/monitoring';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'analytics';
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    let data;

    switch (type) {
      case 'analytics':
        data = await MonitoringService.getPerformanceAnalytics();
        break;
      
      case 'performance':
        data = await MonitoringService.getPerformanceMetrics({
          startDate,
          endDate,
          limit
        });
        break;
      
      case 'system':
        data = await MonitoringService.getSystemMetrics({
          startDate,
          endDate,
          limit
        });
        break;
      
      case 'errors':
        data = await MonitoringService.getErrorLogs({
          startDate,
          endDate,
          limit
        });
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      type,
      data
    });

  } catch (error) {
    console.error('Monitoring API error:', error);
    return NextResponse.json(
      { error: 'Failed to get monitoring data' },
      { status: 500 }
    );
  }
}