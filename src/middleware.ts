import { NextRequest, NextResponse } from 'next/server';

// Simple rate limiting for edge runtime
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    // Skip middleware for static files and _next resources
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/_next/') ||
      pathname.includes('.') // Skip files with extensions
    ) {
      return NextResponse.next();
    }

    // Basic rate limiting
    if (!checkRateLimit(`middleware_${ip}`, 100, 15 * 60 * 1000)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      );
    }

    // Create response with security headers
    const response = NextResponse.next();
    
    // Add essential security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Simple CSP for development
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    
    // Return minimal error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match API routes only to reduce middleware overhead
     */
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};