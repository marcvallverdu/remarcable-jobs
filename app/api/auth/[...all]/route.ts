import { auth } from '@/lib/auth/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest } from 'next/server';

const handlers = toNextJsHandler(auth);

// Add CORS headers to responses
function addCorsHeaders(response: Response, origin: string | null) {
  const headers = new Headers(response.headers);
  
  // Allow specific origins
  const allowedOrigins = [
    'https://remarcablejobs.com',
    'https://www.remarcablejobs.com',
    'https://remarcable-jobs.vercel.app',
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Credentials', 'true');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  return addCorsHeaders(response, request.headers.get('origin'));
}

export async function POST(request: NextRequest) {
  const response = await handlers.POST(request);
  return addCorsHeaders(response, request.headers.get('origin'));
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new Response(null, { status: 200 }), request.headers.get('origin'));
}