import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/protect';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['success', 'error', 'partial']).optional(),
  savedQueryId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);
    
    const where: any = {};
    
    if (params.status) {
      where.status = params.status;
    }
    
    if (params.savedQueryId) {
      where.savedQueryId = params.savedQueryId;
    }
    
    const skip = (params.page - 1) * params.limit;
    
    const [logs, total] = await Promise.all([
      prisma.fetchLog.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          savedQuery: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fetchLog.count({ where }),
    ]);
    
    return NextResponse.json({
      data: logs,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}