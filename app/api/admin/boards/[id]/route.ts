import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';

const updateBoardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  domain: z.string().optional(),
  isActive: z.boolean().optional(),
});

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const board = await prisma.jobBoard.findUnique({
      where: { id },
      include: {
        jobs: {
          include: {
            job: {
              include: {
                organization: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        organizations: {
          include: {
            organization: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            jobs: true,
            organizations: true,
          },
        },
      },
    });
    
    if (!board) {
      return NextResponse.json({ error: 'Job board not found' }, { status: 404 });
    }
    
    return NextResponse.json(board);
  } catch (error) {
    console.error('Error fetching job board:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job board' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const data = updateBoardSchema.parse(body);
    
    const board = await prisma.jobBoard.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            jobs: true,
            organizations: true,
          },
        },
      },
    });
    
    return NextResponse.json(board);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating job board:', error);
    return NextResponse.json(
      { error: 'Failed to update job board' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await prisma.jobBoard.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Job board deleted successfully' });
  } catch (error) {
    console.error('Error deleting job board:', error);
    return NextResponse.json(
      { error: 'Failed to delete job board' },
      { status: 500 }
    );
  }
}