import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasSecret: !!process.env.BETTER_AUTH_SECRET,
    secretLength: process.env.BETTER_AUTH_SECRET?.length || 0,
    firstChars: process.env.BETTER_AUTH_SECRET?.substring(0, 5) || 'undefined',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('AUTH') || key.includes('BETTER')),
  });
}