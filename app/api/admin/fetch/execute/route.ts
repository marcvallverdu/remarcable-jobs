import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/protect';
import { JobsFetcher } from '@/lib/fantastic-jobs/fetcher';
import { QueryBuilder } from '@/lib/fantastic-jobs/query-builder';
import { prisma } from '@/lib/db/prisma';
import { executeRequestSchema } from '@/lib/fantastic-jobs/schemas';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    const body = await request.json();
    const params = executeRequestSchema.parse(body);
    
    // Extract savedQueryId before creating QueryBuilder
    const { savedQueryId, ...queryParams } = params;
    
    // Create query builder from all parameters
    const queryBuilder = QueryBuilder.fromJSON(queryParams);
    
    // Apply pagination if not already set
    if (!queryBuilder.getParam('limit')) {
      queryBuilder.pagination(100, queryBuilder.getParam('offset') || 0);
    }
    
    const fetcher = new JobsFetcher(prisma);
    const result = await fetcher.fetchAndSave(queryBuilder, savedQueryId);
    
    // Update saved query if provided
    if (savedQueryId) {
      await prisma.savedQuery.update({
        where: { id: savedQueryId },
        data: {
          lastRun: new Date(),
          resultCount: result.jobsFetched,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      params: queryBuilder.build(), // Return the actual parameters used
      result,
    });
  } catch (error) {
    console.error('Error executing fetch:', error);
    
    // Return validation errors if present
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to execute fetch' },
      { status: 500 }
    );
  }
}