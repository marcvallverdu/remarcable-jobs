import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(organization);
  } catch (error) {
    console.error(`Error fetching organization ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}