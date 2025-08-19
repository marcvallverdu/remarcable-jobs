import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  boardSlug: z.string().optional(), // Filter by job board slug
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);
    
    const where: Record<string, unknown> = {};
    
    // Filter by job board if specified
    if (params.boardSlug) {
      where.jobBoards = {
        some: {
          jobBoard: {
            slug: params.boardSlug,
            isActive: true,
          },
        },
      };
    }
    
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { linkedinIndustry: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    
    const skip = (params.page - 1) * params.limit;
    
    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          _count: {
            select: { jobs: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.organization.count({ where }),
    ]);
    
    return NextResponse.json({
      data: organizations,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}