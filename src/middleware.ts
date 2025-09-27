import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/monitoring';
import { checkRateLimit } from '@/lib/middleware';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  try {
    // Rate limiting check
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

    // CSRF protection for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type') || '';
      
      // Skip CSRF for API routes with proper authentication
      if (!pathname.startsWith('/api/')) {
        const csrfToken = request.headers.get('x-csrf-token') || 
                         request.cookies.get('csrf-token')?.value;
        
        if (!csrfToken) {
          return NextResponse.json(
            { error: 'CSRF token required' },
            { status: 403 }
          );
        }
      }
    }

    // Security headers
    const response = NextResponse.next();
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.* wss:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);

    // Log performance metric after response
    const duration = Date.now() - startTime;
    
    // Schedule performance logging (non-blocking)
    setImmediate(async () => {
      try {
        await MonitoringService.logPerformanceMetric({
          endpoint: pathname,
          method,
          duration,
          statusCode: response.status,
          userAgent,
          ip
        });
      } catch (error) {
        console.error('Failed to log performance metric:', error);
      }
    });

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    
    // Log error (non-blocking)
    setImmediate(async () => {
      try {
        await MonitoringService.logError({
          endpoint: pathname,
          method,
          errorMessage: error instanceof Error ? error.message : 'Unknown middleware error',
          stackTrace: error instanceof Error ? error.stack : undefined,
          requestData: JSON.stringify({
            userAgent,
            ip,
            query: search
          })
        });
      } catch (logError) {
        console.error('Failed to log middleware error:', logError);
      }
    });

    // Return error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};