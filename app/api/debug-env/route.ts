import { NextResponse } from 'next/server';

export async function GET() {
  // Only show in development or with a secret query param
  const debugInfo = {
    environment: process.env.NODE_ENV,
    hasSecret: !!process.env.BETTER_AUTH_SECRET,
    secretLength: process.env.BETTER_AUTH_SECRET?.length || 0,
    secretPreview: process.env.BETTER_AUTH_SECRET 
      ? `${process.env.BETTER_AUTH_SECRET.substring(0, 10)}...` 
      : 'NOT SET',
    authUrl: process.env.BETTER_AUTH_URL || 'NOT SET',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    hasDatabase: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(debugInfo);
}