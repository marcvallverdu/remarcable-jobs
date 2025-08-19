import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';

const createBoardSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1),
  description: z.string().optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  domain: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const boards = await prisma.jobBoard.findMany({
      include: {
        _count: {
          select: {
            jobs: true,
            organizations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(boards);
  } catch (error) {
    console.error('Error fetching job boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job boards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const data = createBoardSchema.parse(body);
    
    // Check if slug already exists
    const existing = await prisma.jobBoard.findUnique({
      where: { slug: data.slug },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'A job board with this slug already exists' },
        { status: 400 }
      );
    }
    
    const board = await prisma.jobBoard.create({
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
    
    console.error('Error creating job board:', error);
    return NextResponse.json(
      { error: 'Failed to create job board' },
      { status: 500 }
    );
  }
}