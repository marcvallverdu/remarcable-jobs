import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  location: z.string().optional(),
  remote: z.coerce.boolean().optional(),
  employmentType: z.string().optional(),
  search: z.string().optional(),
  organizationId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);
    
    const where: any = {};
    
    if (params.location) {
      where.OR = [
        { cities: { has: params.location } },
        { regions: { has: params.location } },
        { countries: { has: params.location } },
      ];
    }
    
    if (params.remote !== undefined) {
      where.isRemote = params.remote;
    }
    
    if (params.employmentType) {
      where.employmentType = { has: params.employmentType };
    }
    
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { descriptionText: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    
    if (params.organizationId) {
      where.organizationId = params.organizationId;
    }
    
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