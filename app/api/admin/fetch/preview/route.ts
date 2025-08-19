import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/protect';
import { JobsFetcher } from '@/lib/fantastic-jobs/fetcher';
import { QueryBuilder } from '@/lib/fantastic-jobs/query-builder';
import { prisma } from '@/lib/db/prisma';
import { previewRequestSchema } from '@/lib/fantastic-jobs/schemas';

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    const body = await request.json();
    const params = previewRequestSchema.parse(body);
    
    // Convert array fields to strings if needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedParams: any = {
      ...params,
      location_filter: Array.isArray(params.location_filter) 
        ? params.location_filter.join(' OR ')
        : params.location_filter,
      organization_filter: Array.isArray(params.organization_filter)
        ? params.organization_filter.join(',')
        : params.organization_filter,
      organization_exclusion_filter: Array.isArray(params.organization_exclusion_filter)
        ? params.organization_exclusion_filter.join(',')
        : params.organization_exclusion_filter,
      source: Array.isArray(params.source)
        ? params.source.join(',')
        : params.source,
      li_organization_slug_filter: Array.isArray(params.li_organization_slug_filter)
        ? params.li_organization_slug_filter.join(',')
        : params.li_organization_slug_filter,
      li_organization_slug_exclusion_filter: Array.isArray(params.li_organization_slug_exclusion_filter)
        ? params.li_organization_slug_exclusion_filter.join(',')
        : params.li_organization_slug_exclusion_filter,
      li_industry_filter: Array.isArray(params.li_industry_filter)
        ? params.li_industry_filter.join(',')
        : params.li_industry_filter,
      ai_employment_type_filter: Array.isArray(params.ai_employment_type_filter)
        ? params.ai_employment_type_filter.join(',')
        : params.ai_employment_type_filter,
      ai_work_arrangement_filter: Array.isArray(params.ai_work_arrangement_filter)
        ? params.ai_work_arrangement_filter.join(',')
        : params.ai_work_arrangement_filter,
      ai_experience_level_filter: Array.isArray(params.ai_experience_level_filter)
        ? params.ai_experience_level_filter.join(',')
        : params.ai_experience_level_filter,
    };
    
    // Create query builder from all parameters
    const queryBuilder = QueryBuilder.fromJSON(processedParams);
    
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