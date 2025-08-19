import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

export async function GET() {
  try {
    // Test if auth is initialized properly
    const testResult = {
      status: 'Auth system check',
      authInitialized: !!auth,
      authMethods: Object.keys(auth || {}),
      apiMethods: auth?.api ? Object.keys(auth.api) : [],
      environment: {
        nodeEnv: process.env.NODE_ENV || 'not-set',
        betterAuthSecret: process.env.BETTER_AUTH_SECRET ? 'SET ✓' : 'MISSING ✗',
        betterAuthUrl: process.env.BETTER_AUTH_URL || 'not-set',
        nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'not-set',
        databaseUrl: process.env.DATABASE_URL ? 'SET ✓' : 'MISSING ✗',
      },
      recommendations: [] as string[],
    };
    
    // Add recommendations based on missing config
    if (!process.env.BETTER_AUTH_SECRET) {
      testResult.recommendations.push('Set BETTER_AUTH_SECRET in Vercel environment variables');
    }
    if (!process.env.BETTER_AUTH_URL) {
      testResult.recommendations.push('Set BETTER_AUTH_URL to your deployment URL');
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      testResult.recommendations.push('Set NEXT_PUBLIC_APP_URL to your deployment URL');
    }
    
    return NextResponse.json(testResult);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
      error: errorMessage,
      stack: errorStack,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'not-set',
        betterAuthSecret: process.env.BETTER_AUTH_SECRET ? 'SET' : 'MISSING',
        betterAuthUrl: process.env.BETTER_AUTH_URL || 'not-set',
        nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'not-set',
      },
    }, { status: 500 });
  }
}