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
    const job = await prisma.job.findUnique({
      where: { id: id },
      include: {
        organization: true,
      },
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(job);
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}