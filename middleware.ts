import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './lib/rate-limiter';

export async function middleware(request: NextRequest) {
  // Only apply rate limiting to public API routes
  if (request.nextUrl.pathname.startsWith('/api/v1')) {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }

    // Check if rate limiting is enabled
    if (process.env.ENABLE_RATE_LIMITING === 'false') {
      return NextResponse.next();
    }

    const { success, headers } = await checkRateLimit(request);
    
    if (!success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          message: 'Rate limit exceeded'
        }),
        { 
          status: 429, 
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // Add security headers for all routes
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};