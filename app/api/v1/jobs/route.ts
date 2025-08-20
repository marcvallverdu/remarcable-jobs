import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { validateBearerToken, unauthorizedResponse } from '@/lib/auth/api-auth';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  location: z.string().optional(),
  remote: z.coerce.boolean().optional(),
  employmentType: z.string().optional(),
  search: z.string().optional(),
  organizationId: z.string().optional(),
  boardSlug: z.string().optional(), // Filter by job board slug
});

export async function GET(request: NextRequest) {
  // Validate API token
  const tokenValidation = await validateBearerToken(request);
  if (!tokenValidation.valid) {
    return unauthorizedResponse(tokenValidation.error);
  }
  
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);
    
    const andConditions: Array<Record<string, unknown>> = [
      // Exclude expired jobs by default
      { expiredAt: null },
    ];
    
    // Filter by job board if specified
    if (params.boardSlug) {
      andConditions.push({
        jobBoards: {
          some: {
            jobBoard: {
              slug: params.boardSlug,
              isActive: true,
            },
          },
        },
      });
    }
    
    // Location filter - checks cities, regions, or countries
    if (params.location) {
      andConditions.push({
        OR: [
          { cities: { has: params.location } },
          { regions: { has: params.location } },
          { countries: { has: params.location } },
        ],
      });
    }
    
    if (params.remote !== undefined) {
      andConditions.push({ isRemote: params.remote });
    }
    
    if (params.employmentType) {
      andConditions.push({ employmentType: { has: params.employmentType } });
    }
    
    // Search filter - searches in title and description
    if (params.search) {
      andConditions.push({
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { descriptionText: { contains: params.search, mode: 'insensitive' } },
          {
            organization: {
              name: { contains: params.search, mode: 'insensitive' },
            },
          },
        ],
      });
    }
    
    // Organization filter
    if (params.organizationId) {
      andConditions.push({ organizationId: params.organizationId });
    }
    
    const where = andConditions.length > 1 ? { AND: andConditions } : andConditions[0];
    
    const skip = (params.page - 1) * params.limit;
    
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
              url: true,
              linkedinUrl: true,
              linkedinIndustry: true,
              linkedinSize: true,
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
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}