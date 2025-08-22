import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/protect';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { jobIds } = body;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid job IDs provided' },
        { status: 400 }
      );
    }

    // Update all selected jobs to remove expiredAt
    const result = await prisma.job.updateMany({
      where: {
        id: {
          in: jobIds,
        },
        expiredAt: {
          not: null, // Only update jobs that are expired
        },
      },
      data: {
        expiredAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully reactivated ${result.count} job(s)`,
    });
  } catch (error) {
    console.error('Error reactivating jobs:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate jobs' },
      { status: 500 }
    );
  }
}