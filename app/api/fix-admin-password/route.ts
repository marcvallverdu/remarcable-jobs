import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';

export async function POST() {
  try {
    // Only allow in development or with a secret
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PASSWORD_FIX) {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }
    
    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        email: 'marc@remarcablevc.com',
        isAdmin: true,
      },
    });
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }
    
    // Delete the old bcrypt account
    await prisma.account.deleteMany({
      where: {
        userId: adminUser.id,
        providerId: 'credential',
      },
    });
    
    // Use Better Auth to create a proper password
    // Better Auth will handle the password hashing correctly
    const result = await auth.api.signUpEmail({
      body: {
        email: adminUser.email,
        password: 'TempPassword123!', // Temporary password
        name: adminUser.name,
      },
      asResponse: false,
    }).catch(async (error) => {
      // If user already exists, that's fine - just update the password
      if (error?.message?.includes('already exists')) {
        // Try to update password directly in the account table
        // with Better Auth's expected format
        await prisma.account.create({
          data: {
            userId: adminUser.id,
            accountId: adminUser.id,
            providerId: 'credential',
            // Better Auth expects the password in a specific format
            // We'll set a marker that needs to be replaced
            password: 'NEEDS_BETTER_AUTH_FORMAT',
          },
        });
        return { error: 'Created placeholder - use Better Auth signup' };
      }
      throw error;
    });
    
    return NextResponse.json({
      message: 'Password reset attempted',
      result,
      instructions: 'Try logging in with email: marc@remarcablevc.com and password: TempPassword123!',
      important: 'Change this password immediately after logging in!',
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fix password',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}