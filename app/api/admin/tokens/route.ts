import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import crypto from 'crypto';

// GET: List all tokens for the current user
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const tokens = await prisma.apiToken.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

// POST: Create a new token
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, expiresInDays } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Token name is required' }, { status: 400 });
    }
    
    // Generate a secure random token
    const token = `rmj_${crypto.randomBytes(32).toString('hex')}`;
    
    // Calculate expiration date if specified
    let expiresAt: Date | null = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }
    
    const apiToken = await prisma.apiToken.create({
      data: {
        name,
        token,
        userId: session.user.id,
        expiresAt,
      },
    });
    
    // Return the token only once (user must save it)
    return NextResponse.json({
      id: apiToken.id,
      name: apiToken.name,
      token: apiToken.token,
      expiresAt: apiToken.expiresAt,
      message: 'Save this token securely. It will not be shown again.',
    });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}

// DELETE: Revoke a token
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id');
    
    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }
    
    // Ensure the token belongs to the current user
    const token = await prisma.apiToken.findFirst({
      where: {
        id: tokenId,
        userId: session.user.id,
      },
    });
    
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }
    
    await prisma.apiToken.delete({
      where: { id: tokenId },
    });
    
    return NextResponse.json({ message: 'Token revoked successfully' });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json(
      { error: 'Failed to delete token' },
      { status: 500 }
    );
  }
}