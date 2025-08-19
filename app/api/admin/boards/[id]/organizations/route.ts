import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';

const assignOrgSchema = z.object({
  organizationId: z.string(),
  isFeatured: z.boolean().optional().default(false),
  tier: z.string().optional(),
});

const assignOrgsSchema = z.object({
  organizationIds: z.array(z.string()),
  isFeatured: z.boolean().optional().default(false),
  tier: z.string().optional(),
});

interface Props {
  params: Promise<{ id: string }>;
}

// Add organization(s) to a board
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
    
    // Check if single org or multiple orgs
    if (body.organizationId) {
      // Single organization assignment
      const data = assignOrgSchema.parse(body);
      
      const assignment = await prisma.jobBoardOrganization.upsert({
        where: {
          jobBoardId_organizationId: {
            jobBoardId: boardId,
            organizationId: data.organizationId,
          },
        },
        update: {
          isFeatured: data.isFeatured,
          tier: data.tier,
        },
        create: {
          jobBoardId: boardId,
          organizationId: data.organizationId,
          isFeatured: data.isFeatured,
          tier: data.tier,
        },
        include: {
          organization: true,
        },
      });
      
      return NextResponse.json(assignment);
    } else if (body.organizationIds) {
      // Multiple organizations assignment
      const data = assignOrgsSchema.parse(body);
      
      const assignments = await prisma.$transaction(
        data.organizationIds.map(organizationId =>
          prisma.jobBoardOrganization.upsert({
            where: {
              jobBoardId_organizationId: {
                jobBoardId: boardId,
                organizationId,
              },
            },
            update: {
              isFeatured: data.isFeatured,
              tier: data.tier,
            },
            create: {
              jobBoardId: boardId,
              organizationId,
              isFeatured: data.isFeatured,
              tier: data.tier,
            },
          })
        )
      );
      
      return NextResponse.json({
        message: `Successfully assigned ${assignments.length} organizations to the board`,
        count: assignments.length,
      });
    } else {
      return NextResponse.json(
        { error: 'Either organizationId or organizationIds must be provided' },
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
    
    console.error('Error assigning organization to board:', error);
    return NextResponse.json(
      { error: 'Failed to assign organization to board' },
      { status: 500 }
    );
  }
}

// Remove an organization from a board
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
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId parameter is required' },
        { status: 400 }
      );
    }
    
    await prisma.jobBoardOrganization.delete({
      where: {
        jobBoardId_organizationId: {
          jobBoardId: boardId,
          organizationId,
        },
      },
    });
    
    return NextResponse.json({ message: 'Organization removed from board successfully' });
  } catch (error) {
    console.error('Error removing organization from board:', error);
    return NextResponse.json(
      { error: 'Failed to remove organization from board' },
      { status: 500 }
    );
  }
}