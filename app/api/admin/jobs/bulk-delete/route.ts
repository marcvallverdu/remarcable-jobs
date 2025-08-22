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

    // First, delete all JobBoardJob associations
    await prisma.jobBoardJob.deleteMany({
      where: {
        jobId: {
          in: jobIds,
        },
      },
    });

    // Then delete the jobs themselves
    const result = await prisma.job.deleteMany({
      where: {
        id: {
          in: jobIds,
        },
      },
    });

    // Clean up organizations that no longer have any jobs
    // This is optional but helps keep the database clean
    const orphanedOrgs = await prisma.organization.findMany({
      where: {
        jobs: {
          none: {},
        },
      },
      select: {
        id: true,
      },
    });

    if (orphanedOrgs.length > 0) {
      // Delete JobBoardOrganization associations for orphaned orgs
      await prisma.jobBoardOrganization.deleteMany({
        where: {
          organizationId: {
            in: orphanedOrgs.map(org => org.id),
          },
        },
      });

      // Delete the orphaned organizations
      await prisma.organization.deleteMany({
        where: {
          id: {
            in: orphanedOrgs.map(org => org.id),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      orphanedOrgsDeleted: orphanedOrgs.length,
      message: `Successfully deleted ${result.count} job(s)${orphanedOrgs.length > 0 ? ` and ${orphanedOrgs.length} orphaned organization(s)` : ''}`,
    });
  } catch (error) {
    console.error('Error deleting jobs:', error);
    return NextResponse.json(
      { error: 'Failed to delete jobs' },
      { status: 500 }
    );
  }
}