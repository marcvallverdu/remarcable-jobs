import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // First, let's delete the incorrectly created account
    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        providerId: 'credential',
      },
    });
    
    // Also delete the user to start fresh
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: 'marc@remarcablevc.com',
      },
    });
    
    return NextResponse.json({
      message: 'Cleaned up old admin user',
      deletedAccounts: deletedAccounts.count,
      deletedUsers: deletedUsers.count,
      nextStep: 'Now use the signup page at /signup to create a new admin user properly through Better Auth',
      important: 'After signup, we will manually set isAdmin to true in the database',
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to clean up',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // After user signs up normally, make them admin
    const user = await prisma.user.findFirst({
      where: {
        email: 'marc@remarcablevc.com',
      },
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found. Please sign up first at /signup' 
      }, { status: 404 });
    }
    
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { 
        isAdmin: true,
        emailVerified: true,
      },
    });
    
    return NextResponse.json({
      message: 'User promoted to admin',
      user: {
        id: updated.id,
        email: updated.email,
        isAdmin: updated.isAdmin,
      },
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to promote to admin',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}