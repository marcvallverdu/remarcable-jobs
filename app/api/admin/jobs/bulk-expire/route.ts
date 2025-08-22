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

    // Update all selected jobs to set expiredAt
    const result = await prisma.job.updateMany({
      where: {
        id: {
          in: jobIds,
        },
        expiredAt: null, // Only update jobs that aren't already expired
      },
      data: {
        expiredAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully expired ${result.count} job(s)`,
    });
  } catch (error) {
    console.error('Error expiring jobs:', error);
    return NextResponse.json(
      { error: 'Failed to expire jobs' },
      { status: 500 }
    );
  }
}