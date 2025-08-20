import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateBearerToken, unauthorizedResponse } from '@/lib/auth/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  // Validate API token
  const tokenValidation = await validateBearerToken(request);
  if (!tokenValidation.valid) {
    return unauthorizedResponse(tokenValidation.error);
  }

  const { id } = await params;
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: id },
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
    console.error(`Error fetching organization ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}