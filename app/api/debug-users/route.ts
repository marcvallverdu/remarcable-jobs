import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Get all users (without passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    
    // Get all accounts (check if password accounts exist)
    const accounts = await prisma.account.findMany({
      select: {
        userId: true,
        providerId: true,
        accountId: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json({
      userCount: users.length,
      users,
      accountCount: accounts.length,
      accounts,
      hasAdminUser: users.some(u => u.isAdmin),
      hasPasswordAccount: accounts.some(a => a.providerId === 'credential'),
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}