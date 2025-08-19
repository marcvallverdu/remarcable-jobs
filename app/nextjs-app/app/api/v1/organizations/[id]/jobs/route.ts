import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);
    
    const skip = (query.page - 1) * query.limit;
    
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { organizationId: params.id },
        skip,
        take: query.limit,
        orderBy: { datePosted: 'desc' },
      }),
      prisma.job.count({
        where: { organizationId: params.id },
      }),
    ]);
    
    return NextResponse.json({
      data: jobs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error(`Error fetching jobs for organization ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch organization jobs' },
      { status: 500 }
    );
  }
}