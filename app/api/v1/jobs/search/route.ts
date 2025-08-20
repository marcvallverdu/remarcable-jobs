import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { validateBearerToken, unauthorizedResponse } from '@/lib/auth/api-auth';

const searchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  organizationId: z.string().optional(),
  location: z.string().optional(),
});

export async function GET(request: NextRequest) {
  // Validate API token
  const tokenValidation = await validateBearerToken(request);
  if (!tokenValidation.valid) {
    return unauthorizedResponse(tokenValidation.error);
  }
  
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = searchSchema.parse(searchParams);
    
    const skip = (params.page - 1) * params.limit;
    
    // Build dynamic query conditions
    const andConditions: Array<Record<string, unknown>> = [
      // Exclude expired jobs
      { expiredAt: null },
      // Search query
      {
        OR: [
          { title: { contains: params.q, mode: 'insensitive' } },
          { descriptionText: { contains: params.q, mode: 'insensitive' } },
          {
            organization: {
              name: { contains: params.q, mode: 'insensitive' },
            },
          },
        ],
      },
    ];
    
    // Add organization filter if provided
    if (params.organizationId) {
      andConditions.push({ organizationId: params.organizationId });
    }
    
    // Add location filter if provided
    if (params.location) {
      andConditions.push({
        OR: [
          { cities: { has: params.location } },
          { regions: { has: params.location } },
          { countries: { has: params.location } },
        ],
      });
    }
    
    const where = { AND: andConditions };
    
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
              domain: true,
            },
          },
        },
        orderBy: { datePosted: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);
    
    return NextResponse.json({
      data: jobs,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    );
  }
}