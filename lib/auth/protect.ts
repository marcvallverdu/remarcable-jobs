import { auth } from './auth';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function requireAuth(request?: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return session;
}

export async function requireAdmin(request?: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session?.user || !session.user.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }
  
  return session;
}