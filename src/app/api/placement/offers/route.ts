// Placement Offer Management API
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { PlacementOfferManager } from '@/lib/placement-offer-manager';

const offerManager = new PlacementOfferManager();

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
    const offerId = url.searchParams.get('offerId');
    
    if (action === 'details' && offerId) {
      // Get offer details with tracking
      const offerDetails = await offerManager.getOfferDetails(
        Number(offerId),
        decoded.role === 'STUDENT' ? decoded.id : undefined
      );
      
      return NextResponse.json({ success: true, data: offerDetails });
    }
    
    if (action === 'analytics' && ['STAFF', 'EMPLOYER'].includes(decoded.role)) {
      // Get offer analytics
      const filters = {
        department: url.searchParams.get('department') || undefined,
        company: url.searchParams.get('company') || undefined,
        date_range: url.searchParams.get('startDate') && url.searchParams.get('endDate') ? {
          start: url.searchParams.get('startDate')!,
          end: url.searchParams.get('endDate')!
        } : undefined
      };
      
      const analytics = await offerManager.getOfferAnalytics(filters);
      return NextResponse.json({ success: true, data: analytics });
    }
    
    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in placement offers GET API:', error);
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
    
    if (action === 'create_offer' && ['STAFF', 'EMPLOYER'].includes(decoded.role)) {
      const offerData = {
        application_id: body.application_id,
        student_id: body.student_id,
        company_id: body.company_id,
        position_title: body.position_title,
        offer_type: body.offer_type,
        offer_details: body.offer_details,
        offer_status: 'EXTENDED' as const,
        offer_date: new Date().toISOString(),
        response_deadline: body.response_deadline,
        contract_signed: false
      };
      
      if (!offerData.application_id || !offerData.student_id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const result = await offerManager.createOffer(offerData);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    
    if (action === 'respond_to_offer' && decoded.role === 'STUDENT') {
      const { offer_id, response, reason } = body;
      
      if (!offer_id || !['ACCEPTED', 'REJECTED'].includes(response)) {
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
      }
      
      const result = await offerManager.processOfferResponse(
        offer_id,
        decoded.id,
        response,
        reason
      );
      
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    
    return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 403 });
    
  } catch (error) {
    console.error('Error in placement offers POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}