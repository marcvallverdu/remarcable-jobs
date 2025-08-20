import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { validateBearerToken, unauthorizedResponse } from '@/lib/auth/api-auth';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  activeOnly: z.coerce.boolean().optional().default(true),
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
    
    const where: Record<string, unknown> = {};
    
    if (params.activeOnly) {
      where.isActive = true;
    }
    
    const skip = (params.page - 1) * params.limit;
    
    const [boards, total] = await Promise.all([
      prisma.jobBoard.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          _count: {
            select: {
              jobs: true,
              organizations: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.jobBoard.count({ where }),
    ]);
    
    return NextResponse.json({
      data: boards,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching job boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job boards' },
      { status: 500 }
    );
  }
}