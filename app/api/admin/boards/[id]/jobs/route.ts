import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';

const assignJobSchema = z.object({
  jobId: z.string(),
  featured: z.boolean().optional().default(false),
  pinnedUntil: z.string().datetime().optional(),
});

const assignJobsSchema = z.object({
  jobIds: z.array(z.string()),
  featured: z.boolean().optional().default(false),
});

interface Props {
  params: Promise<{ id: string }>;
}

// Add job(s) to a board
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id: boardId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Check if single job or multiple jobs
    if (body.jobId) {
      // Single job assignment
      const data = assignJobSchema.parse(body);
      
      const assignment = await prisma.jobBoardJob.upsert({
        where: {
          jobBoardId_jobId: {
            jobBoardId: boardId,
            jobId: data.jobId,
          },
        },
        update: {
          featured: data.featured,
          pinnedUntil: data.pinnedUntil ? new Date(data.pinnedUntil) : undefined,
        },
        create: {
          jobBoardId: boardId,
          jobId: data.jobId,
          featured: data.featured,
          pinnedUntil: data.pinnedUntil ? new Date(data.pinnedUntil) : undefined,
        },
        include: {
          job: {
            include: {
              organization: true,
            },
          },
        },
      });
      
      return NextResponse.json(assignment);
    } else if (body.jobIds) {
      // Multiple jobs assignment
      const data = assignJobsSchema.parse(body);
      
      const assignments = await prisma.$transaction(
        data.jobIds.map(jobId =>
          prisma.jobBoardJob.upsert({
            where: {
              jobBoardId_jobId: {
                jobBoardId: boardId,
                jobId,
              },
            },
            update: {
              featured: data.featured,
            },
            create: {
              jobBoardId: boardId,
              jobId,
              featured: data.featured,
            },
          })
        )
      );
      
      return NextResponse.json({
        message: `Successfully assigned ${assignments.length} jobs to the board`,
        count: assignments.length,
      });
    } else {
      return NextResponse.json(
        { error: 'Either jobId or jobIds must be provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error assigning job to board:', error);
    return NextResponse.json(
      { error: 'Failed to assign job to board' },
      { status: 500 }
    );
  }
}

// Remove a job from a board
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id: boardId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }
    
    await prisma.jobBoardJob.delete({
      where: {
        jobBoardId_jobId: {
          jobBoardId: boardId,
          jobId,
        },
      },
    });
    
    return NextResponse.json({ message: 'Job removed from board successfully' });
  } catch (error) {
    console.error('Error removing job from board:', error);
    return NextResponse.json(
      { error: 'Failed to remove job from board' },
      { status: 500 }
    );
  }
}