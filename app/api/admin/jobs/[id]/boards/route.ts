import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const assignBoardSchema = z.object({
  boardId: z.string(),
  featured: z.boolean().optional().default(false),
  pinnedUntil: z.string().datetime().optional(),
});

// Get all boards and the job's assignment status
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id: jobId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all boards with this job's assignment status
    const boards = await prisma.jobBoard.findMany({
      where: { isActive: true },
      include: {
        jobs: {
          where: {
            jobId: jobId,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    // Transform to include assignment status
    const boardsWithStatus = boards.map(board => ({
      id: board.id,
      name: board.name,
      slug: board.slug,
      isAssigned: board.jobs.length > 0,
      featured: board.jobs[0]?.featured || false,
      pinnedUntil: board.jobs[0]?.pinnedUntil || null,
    }));
    
    return NextResponse.json(boardsWithStatus);
  } catch (error) {
    console.error('Error fetching job boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job boards' },
      { status: 500 }
    );
  }
}

// Assign/update job to a board
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id: jobId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const data = assignBoardSchema.parse(body);
    
    const assignment = await prisma.jobBoardJob.upsert({
      where: {
        jobBoardId_jobId: {
          jobBoardId: data.boardId,
          jobId: jobId,
        },
      },
      update: {
        featured: data.featured,
        pinnedUntil: data.pinnedUntil ? new Date(data.pinnedUntil) : null,
      },
      create: {
        jobBoardId: data.boardId,
        jobId: jobId,
        featured: data.featured,
        pinnedUntil: data.pinnedUntil ? new Date(data.pinnedUntil) : null,
      },
      include: {
        jobBoard: true,
      },
    });
    
    return NextResponse.json(assignment);
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

// Remove job from a board
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id: jobId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const boardId = searchParams.get('boardId');
    
    if (!boardId) {
      return NextResponse.json(
        { error: 'boardId parameter is required' },
        { status: 400 }
      );
    }
    
    await prisma.jobBoardJob.delete({
      where: {
        jobBoardId_jobId: {
          jobBoardId: boardId,
          jobId: jobId,
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