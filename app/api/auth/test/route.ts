import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

export async function GET() {
  try {
    // Test if auth is initialized properly
    const testResult = {
      authInitialized: !!auth,
      authMethods: Object.keys(auth || {}),
      apiMethods: auth?.api ? Object.keys(auth.api) : [],
      secret: process.env.BETTER_AUTH_SECRET ? 'Set' : 'Not set',
      secretLength: process.env.BETTER_AUTH_SECRET?.length || 0,
    };
    
    return NextResponse.json(testResult);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
      error: errorMessage,
      stack: errorStack,
    }, { status: 500 });
  }
}