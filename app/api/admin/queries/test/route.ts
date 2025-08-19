import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import axios from 'axios';

const API_ENDPOINTS: Record<string, string> = {
  'active-ats-7d': '/active-ats-7d',
  'active-ats-24h': '/active-ats-24h',
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { endpoint, parameters } = body;

    if (!endpoint || !API_ENDPOINTS[endpoint]) {
      return NextResponse.json(
        { error: 'Invalid endpoint specified' },
        { status: 400 }
      );
    }

    // Build query parameters for RapidAPI
    const queryParams: Record<string, string> = {};

    // Map our form field names to RapidAPI parameter names
    // Handle both old field names (for backwards compatibility) and new field names
    
    // Title search - map 'title' to 'title_filter'
    if (parameters.title) queryParams.title_filter = parameters.title;
    if (parameters.title_filter) queryParams.title_filter = parameters.title_filter;
    if (parameters.advanced_title_filter) queryParams.advanced_title_filter = parameters.advanced_title_filter;
    
    // Location search - map 'location' to 'location_filter'
    if (parameters.location) queryParams.location_filter = parameters.location;
    if (parameters.location_filter) queryParams.location_filter = parameters.location_filter;
    
    // Organization/Company search - map 'company' to 'organization_filter'
    if (parameters.company) queryParams.organization_filter = parameters.company;
    if (parameters.organization_filter) queryParams.organization_filter = parameters.organization_filter;
    if (parameters.advanced_organization_filter) queryParams.advanced_organization_filter = parameters.advanced_organization_filter;
    if (parameters.organization_exclusion_filter) queryParams.organization_exclusion_filter = parameters.organization_exclusion_filter;
    
    // Description search - 'query' field can be used as description_filter
    if (parameters.query) queryParams.description_filter = parameters.query;
    if (parameters.description_filter) queryParams.description_filter = parameters.description_filter;
    if (parameters.advanced_description_filter) queryParams.advanced_description_filter = parameters.advanced_description_filter;
    
    // Remote and source filters
    if (parameters.remote !== undefined && parameters.remote !== '') {
      queryParams.remote = parameters.remote;
    }
    if (parameters.source) queryParams.source = parameters.source;
    
    // Date filter
    if (parameters.date_filter) queryParams.date_filter = parameters.date_filter;
    
    // AI filters
    if (parameters.ai_employment_type_filter) {
      queryParams.ai_employment_type_filter = Array.isArray(parameters.ai_employment_type_filter) 
        ? parameters.ai_employment_type_filter.join(',')
        : parameters.ai_employment_type_filter;
    }
    if (parameters.ai_work_arrangement_filter) {
      queryParams.ai_work_arrangement_filter = Array.isArray(parameters.ai_work_arrangement_filter)
        ? parameters.ai_work_arrangement_filter.join(',')
        : parameters.ai_work_arrangement_filter;
    }
    if (parameters.ai_experience_level_filter) {
      queryParams.ai_experience_level_filter = Array.isArray(parameters.ai_experience_level_filter)
        ? parameters.ai_experience_level_filter.join(',')
        : parameters.ai_experience_level_filter;
    }
    if (parameters.ai_has_salary !== undefined) {
      queryParams.ai_has_salary = parameters.ai_has_salary.toString();
    }
    if (parameters.ai_visa_sponsorship_filter !== undefined) {
      queryParams.ai_visa_sponsorship_filter = parameters.ai_visa_sponsorship_filter.toString();
    }
    if (parameters.include_ai !== undefined) {
      queryParams.include_ai = parameters.include_ai.toString();
    }
    
    // LinkedIn filters
    if (parameters.include_li !== undefined) {
      queryParams.include_li = parameters.include_li.toString();
    }
    if (parameters.li_organization_slug_filter) queryParams.li_organization_slug_filter = parameters.li_organization_slug_filter;
    if (parameters.li_organization_slug_exclusion_filter) queryParams.li_organization_slug_exclusion_filter = parameters.li_organization_slug_exclusion_filter;
    if (parameters.li_industry_filter) queryParams.li_industry_filter = parameters.li_industry_filter;
    if (parameters.li_organization_specialties_filter) queryParams.li_organization_specialties_filter = parameters.li_organization_specialties_filter;
    if (parameters.li_organization_description_filter) queryParams.li_organization_description_filter = parameters.li_organization_description_filter;
    if (parameters.li_organization_employees_lte) queryParams.li_organization_employees_lte = parameters.li_organization_employees_lte;
    if (parameters.li_organization_employees_gte) queryParams.li_organization_employees_gte = parameters.li_organization_employees_gte;
    
    // Description type
    if (parameters.description_type) queryParams.description_type = parameters.description_type;
    
    // Pagination parameters (using limit and offset instead of page/num_pages)
    const limit = parameters.limit || 10;
    const offset = parameters.offset || 0;
    queryParams.limit = limit.toString();
    queryParams.offset = offset.toString();

    console.log('Sending query params to RapidAPI:', queryParams);

    // Make request to RapidAPI
    const response = await axios.get(
      `https://${process.env.RAPIDAPI_HOST}${API_ENDPOINTS[endpoint]}`,
      {
        params: queryParams,
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
          'X-RapidAPI-Host': process.env.RAPIDAPI_HOST!,
        },
        timeout: 30000,
      }
    );

    // The API returns an array directly in response.data
    const jobs = Array.isArray(response.data) ? response.data : (response.data.data || response.data.jobs || []);
    
    // Check for duplicates in database
    const jobIds = jobs.map((job: Record<string, unknown>) => job.id).filter(Boolean);
    const existingJobs = await prisma.job.findMany({
      where: {
        externalId: { in: jobIds },
      },
      select: { externalId: true },
    });

    const existingIds = new Set(existingJobs.map(j => j.externalId));
    
    // Mark which jobs are duplicates
    const jobsWithDuplicateFlag = jobs.map((job: Record<string, unknown>) => ({
      ...job,
      isDuplicate: existingIds.has(job.id as string),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const duplicates = jobsWithDuplicateFlag.filter((job: any) => job.isDuplicate).length;
    const newJobs = jobsWithDuplicateFlag.length - duplicates;

    return NextResponse.json({
      success: true,
      jobCount: jobs.length,
      duplicates,
      newJobs,
      jobs: jobsWithDuplicateFlag,
      totalPages: response.data.total_pages || 1,
      currentPage: response.data.page || 1,
    });
  } catch (error) {
    console.error('Error testing query:', error);
    
    const axiosError = error as Record<string, unknown> & { response?: { status?: number; data?: { message?: string } } };
    if (axiosError.response?.status === 429) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    if (axiosError.response?.data?.message) {
      return NextResponse.json(
        { error: axiosError.response.data.message },
        { status: axiosError.response.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to test query' },
      { status: 500 }
    );
  }
}