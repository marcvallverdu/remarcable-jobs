import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/protect';
import { JobsFetcher } from '@/lib/fantastic-jobs/fetcher';
import { QueryBuilder } from '@/lib/fantastic-jobs/query-builder';
import { prisma } from '@/lib/db/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    const query = await prisma.savedQuery.findFirst({
      where: {
        id: params.id,
        createdBy: authResult.user.id,
      },
    });
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }
    
    const parameters = query.parameters as Record<string, unknown>;
    const queryBuilder = QueryBuilder.fromJSON(parameters);
    
    const fetcher = new JobsFetcher(prisma);
    const result = await fetcher.fetchAndSave(queryBuilder, query.id);
    
    // Update saved query
    await prisma.savedQuery.update({
      where: { id: query.id },
      data: {
        lastRun: new Date(),
        resultCount: result.jobsFetched,
      },
    });
    
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(`Error running query ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to run query' },
      { status: 500 }
    );
  }
}