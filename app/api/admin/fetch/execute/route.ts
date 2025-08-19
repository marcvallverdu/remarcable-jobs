import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/protect';
import { JobsFetcher } from '@/lib/fantastic-jobs/fetcher';
import { QueryBuilder } from '@/lib/fantastic-jobs/query-builder';
import { prisma } from '@/lib/db/prisma';
import { executeRequestSchema } from '@/lib/fantastic-jobs/schemas';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    const body = await request.json();
    const params = executeRequestSchema.parse(body);
    
    // Extract savedQueryId before creating QueryBuilder
    const { savedQueryId, ...queryParams } = params;
    
    // Convert array fields to strings if needed
    const processedParams = {
      ...queryParams,
      location_filter: Array.isArray(queryParams.location_filter) 
        ? queryParams.location_filter.join(' OR ')
        : queryParams.location_filter,
      organization_filter: Array.isArray(queryParams.organization_filter)
        ? queryParams.organization_filter.join(',')
        : queryParams.organization_filter,
      organization_exclusion_filter: Array.isArray(queryParams.organization_exclusion_filter)
        ? queryParams.organization_exclusion_filter.join(',')
        : queryParams.organization_exclusion_filter,
      source: Array.isArray(queryParams.source)
        ? queryParams.source.join(',')
        : queryParams.source,
      li_organization_slug_filter: Array.isArray(queryParams.li_organization_slug_filter)
        ? queryParams.li_organization_slug_filter.join(',')
        : queryParams.li_organization_slug_filter,
      li_organization_slug_exclusion_filter: Array.isArray(queryParams.li_organization_slug_exclusion_filter)
        ? queryParams.li_organization_slug_exclusion_filter.join(',')
        : queryParams.li_organization_slug_exclusion_filter,
      li_industry_filter: Array.isArray(queryParams.li_industry_filter)
        ? queryParams.li_industry_filter.join(',')
        : queryParams.li_industry_filter,
      ai_employment_type_filter: Array.isArray(queryParams.ai_employment_type_filter)
        ? queryParams.ai_employment_type_filter.join(',')
        : queryParams.ai_employment_type_filter,
      ai_work_arrangement_filter: Array.isArray(queryParams.ai_work_arrangement_filter)
        ? queryParams.ai_work_arrangement_filter.join(',')
        : queryParams.ai_work_arrangement_filter,
      ai_experience_level_filter: Array.isArray(queryParams.ai_experience_level_filter)
        ? queryParams.ai_experience_level_filter.join(',')
        : queryParams.ai_experience_level_filter,
    };
    
    // Create query builder from all parameters
    const queryBuilder = QueryBuilder.fromJSON(processedParams);
    
    // Apply pagination if not already set
    if (!queryBuilder.getParam('limit')) {
      const offset = queryBuilder.getParam('offset');
      queryBuilder.pagination(100, typeof offset === 'number' ? offset : 0);
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