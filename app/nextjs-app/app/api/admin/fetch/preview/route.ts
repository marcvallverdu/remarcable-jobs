import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/protect';
import { JobsFetcher } from '@/lib/fantastic-jobs/fetcher';
import { QueryBuilder } from '@/lib/fantastic-jobs/query-builder';
import { prisma } from '@/lib/db/prisma';
import { previewRequestSchema } from '@/lib/fantastic-jobs/schemas';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    const body = await request.json();
    const params = previewRequestSchema.parse(body);
    
    // Create query builder from all parameters
    const queryBuilder = QueryBuilder.fromJSON(params);
    
    // Ensure we're only getting a preview (max 5 items)
    queryBuilder.pagination(5, 0);
    
    const fetcher = new JobsFetcher(prisma);
    const previewJobs = await fetcher.preview(queryBuilder);
    
    return NextResponse.json({
      success: true,
      count: previewJobs.length,
      params: queryBuilder.build(), // Return the actual parameters being used
      data: previewJobs,
    });
  } catch (error) {
    console.error('Error previewing fetch:', error);
    
    // Return validation errors if present
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to preview fetch' },
      { status: 500 }
    );
  }
}