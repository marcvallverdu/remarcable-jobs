import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = searchSchema.parse(searchParams);
    
    const skip = (params.page - 1) * params.limit;
    
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: {
          AND: [
            // Exclude expired jobs
            { expiredAt: null },
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
          ],
        },
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
      prisma.job.count({
        where: {
          AND: [
            // Exclude expired jobs
            { expiredAt: null },
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
          ],
        },
      }),
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