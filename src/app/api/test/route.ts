import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'success',
      message: 'API is working correctly',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'API test failed'
      },
      { status: 500 }
    );
  }
}