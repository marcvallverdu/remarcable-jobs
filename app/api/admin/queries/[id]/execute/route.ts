import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import axios from 'axios';

const API_ENDPOINTS: Record<string, string> = {
  'active-ats-7d': '/active-ats-7d',
  'active-ats-24h': '/active-ats-24h',
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get the saved query
    const savedQuery = await prisma.savedQuery.findUnique({
      where: { id: params.id },
    });

    if (!savedQuery) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { saveJobs = false, selectedJobIds = [] } = body;

    const parameters = savedQuery.parameters as Record<string, unknown>;
    const endpoint = parameters.endpoint || 'active-ats-7d';

    if (!API_ENDPOINTS[endpoint]) {
      return NextResponse.json(
        { error: 'Invalid endpoint in saved query' },
        { status: 400 }
      );
    }

    // Build query parameters for RapidAPI
    const queryParams: Record<string, string> = {};

    // Map our form field names to RapidAPI parameter names
    // Title search - map 'title' to 'title_filter'
    if (parameters.title) queryParams.title_filter = parameters.title as string;
    if (parameters.title_filter) queryParams.title_filter = parameters.title_filter as string;
    if (parameters.advanced_title_filter) queryParams.advanced_title_filter = parameters.advanced_title_filter as string;
    
    // Location search - map 'location' to 'location_filter'
    if (parameters.location) queryParams.location_filter = parameters.location as string;
    if (parameters.location_filter) queryParams.location_filter = parameters.location_filter as string;
    
    // Organization/Company search - map 'company' to 'organization_filter'
    if (parameters.company) queryParams.organization_filter = parameters.company as string;
    if (parameters.organization_filter) queryParams.organization_filter = parameters.organization_filter as string;
    if (parameters.advanced_organization_filter) queryParams.advanced_organization_filter = parameters.advanced_organization_filter as string;
    
    // Description search - 'query' field can be used as description_filter
    if (parameters.query) queryParams.description_filter = parameters.query as string;
    if (parameters.description_filter) queryParams.description_filter = parameters.description_filter as string;
    if (parameters.advanced_description_filter) queryParams.advanced_description_filter = parameters.advanced_description_filter as string;
    
    // Country doesn't need mapping
    if (parameters.country) queryParams.country = parameters.country as string;
    
    // Add filters
    if (parameters.remote !== undefined && parameters.remote !== '') {
      queryParams.remote = parameters.remote as string;
    }
    if (parameters.source) queryParams.source = parameters.source as string;
    if (parameters.description_type) queryParams.description_type = parameters.description_type as string;
    if (parameters.date_filter) queryParams.date_filter = parameters.date_filter as string;
    if (parameters.organization_exclusion_filter) queryParams.organization_exclusion_filter = parameters.organization_exclusion_filter as string;
    
    // AI filters
    if (parameters.include_ai) queryParams.include_ai = (parameters.include_ai as boolean).toString();
    if (parameters.ai_employment_type_filter) queryParams.ai_employment_type_filter = parameters.ai_employment_type_filter as string;
    if (parameters.ai_work_arrangement_filter) queryParams.ai_work_arrangement_filter = parameters.ai_work_arrangement_filter as string;
    if (parameters.ai_has_salary) queryParams.ai_has_salary = (parameters.ai_has_salary as boolean).toString();
    if (parameters.ai_experience_level_filter) queryParams.ai_experience_level_filter = parameters.ai_experience_level_filter as string;
    if (parameters.ai_visa_sponsorship_filter) queryParams.ai_visa_sponsorship_filter = (parameters.ai_visa_sponsorship_filter as boolean).toString();
    
    // LinkedIn filters
    if (parameters.include_li) queryParams.include_li = (parameters.include_li as boolean).toString();
    if (parameters.li_organization_slug_filter) queryParams.li_organization_slug_filter = parameters.li_organization_slug_filter as string;
    if (parameters.li_organization_slug_exclusion_filter) queryParams.li_organization_slug_exclusion_filter = parameters.li_organization_slug_exclusion_filter as string;
    if (parameters.li_industry_filter) queryParams.li_industry_filter = parameters.li_industry_filter as string;
    if (parameters.li_organization_specialties_filter) queryParams.li_organization_specialties_filter = parameters.li_organization_specialties_filter as string;
    if (parameters.li_organization_description_filter) queryParams.li_organization_description_filter = parameters.li_organization_description_filter as string;
    if (parameters.li_organization_employees_gte) queryParams.li_organization_employees_gte = (parameters.li_organization_employees_gte as number).toString();
    if (parameters.li_organization_employees_lte) queryParams.li_organization_employees_lte = (parameters.li_organization_employees_lte as number).toString();
    
    // Legacy fields (keeping for backwards compatibility)
    if (parameters.employment_types && Array.isArray(parameters.employment_types) && parameters.employment_types.length > 0) {
      queryParams.employment_types = parameters.employment_types.join(',');
    }
    if (parameters.seniority_levels && Array.isArray(parameters.seniority_levels) && parameters.seniority_levels.length > 0) {
      queryParams.seniority_levels = parameters.seniority_levels.join(',');
    }
    if (parameters.date_posted) queryParams.date_posted = parameters.date_posted as string;
    
    // Add exclusions
    if (parameters.exclude_job_boards) {
      queryParams.exclude_job_boards = 'true';
    }
    if (parameters.companies_exclude) {
      queryParams.companies_exclude = parameters.companies_exclude as string;
    }
    if (parameters.title_exclude) {
      queryParams.title_exclude = parameters.title_exclude as string;
    }
    
    // Pagination - use limit/offset if available, otherwise use page/num_pages
    if (parameters.limit) {
      queryParams.limit = (parameters.limit as number).toString();
      queryParams.offset = ((parameters.offset as number) || 0).toString();
    } else {
      queryParams.page = ((parameters.page as number) || 1).toString();
      queryParams.num_pages = ((parameters.num_pages as number) || 1).toString();
    }

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
    const externalIds = jobs.map((job: Record<string, unknown>) => job.id as string);
    const existingJobs = await prisma.job.findMany({
      where: {
        externalId: {
          in: externalIds,
        },
      },
      select: {
        externalId: true,
      },
    });

    const existingIds = new Set(existingJobs.map(j => j.externalId));
    
    // Filter jobs to save
    let jobsToSave = jobs;
    if (saveJobs && selectedJobIds.length > 0) {
      jobsToSave = jobs.filter((job: Record<string, unknown>) => 
        selectedJobIds.includes(job.id as string) && !existingIds.has(job.id as string)
      );
    } else if (!saveJobs) {
      jobsToSave = [];
    } else {
      // Save all non-duplicate jobs
      jobsToSave = jobs.filter((job: Record<string, unknown>) => !existingIds.has(job.id as string));
    }

    let jobsCreated = 0;
    let orgsCreated = 0;
    let orgsUpdated = 0;
    const errors: string[] = [];

    // Save jobs to database
    for (const jobData of jobsToSave) {
      try {
        // First, handle the organization
        const companyName = (jobData.company_name as string) || 'Unknown Company';
        
        let organization = await prisma.organization.findFirst({
          where: {
            OR: [
              { name: companyName },
              { linkedinSlug: jobData.company_linkedin_slug as string | undefined },
            ],
          },
        });

        if (!organization) {
          // Create new organization
          organization = await prisma.organization.create({
            data: {
              name: companyName,
              url: jobData.company_url as string | undefined,
              logo: jobData.company_logo as string | undefined,
              linkedinUrl: jobData.company_linkedin_url as string | undefined,
              linkedinSlug: jobData.company_linkedin_slug as string | undefined,
              linkedinEmployees: jobData.company_employees as number | undefined,
              linkedinSize: jobData.company_size as string | undefined,
              linkedinIndustry: jobData.company_industry as string | undefined,
              linkedinType: jobData.company_type as string | undefined,
              linkedinFollowers: jobData.company_followers as number | undefined,
              linkedinHeadquarters: jobData.company_headquarters as string | undefined,
              linkedinSpecialties: [],
              linkedinLocations: [],
            },
          });
          orgsCreated++;
        } else if (jobData.company_linkedin_url && !organization.linkedinUrl) {
          // Update organization with LinkedIn data
          await prisma.organization.update({
            where: { id: organization.id },
            data: {
              linkedinUrl: jobData.company_linkedin_url as string | undefined,
              linkedinSlug: jobData.company_linkedin_slug as string | undefined,
              linkedinEmployees: jobData.company_employees as number | undefined,
              linkedinSize: jobData.company_size as string | undefined,
              linkedinIndustry: jobData.company_industry as string | undefined,
              linkedinType: jobData.company_type as string | undefined,
              linkedinFollowers: jobData.company_followers as number | undefined,
              linkedinHeadquarters: jobData.company_headquarters as string | undefined,
            },
          });
          orgsUpdated++;
        }

        // Create the job
        await prisma.job.create({
          data: {
            externalId: jobData.id as string,
            title: jobData.title as string,
            url: jobData.url as string,
            organizationId: organization.id,
            datePosted: new Date(jobData.date_posted as string),
            dateCreated: new Date(jobData.date_created as string || jobData.date_posted as string),
            dateValidThrough: jobData.date_valid_through ? new Date(jobData.date_valid_through as string) : null,
            descriptionText: jobData.description as string || '',
            cities: Array.isArray(jobData.cities) ? jobData.cities as string[] : [],
            counties: Array.isArray(jobData.counties) ? jobData.counties as string[] : [],
            regions: Array.isArray(jobData.regions) ? jobData.regions as string[] : [],
            countries: Array.isArray(jobData.countries) ? jobData.countries as string[] : [],
            locationsFull: Array.isArray(jobData.locations_full) ? jobData.locations_full as string[] : [],
            timezones: Array.isArray(jobData.timezones) ? jobData.timezones as string[] : [],
            latitude: Array.isArray(jobData.latitude) ? jobData.latitude as number[] : [],
            longitude: Array.isArray(jobData.longitude) ? jobData.longitude as number[] : [],
            isRemote: Boolean(jobData.remote),
            employmentType: Array.isArray(jobData.employment_types) ? jobData.employment_types as string[] : [],
            salaryRaw: jobData.salary || null,
            sourceType: jobData.source_type as string | undefined,
            source: jobData.source as string | undefined,
            sourceDomain: jobData.source_domain as string | undefined,
            lastFetchedAt: new Date(),
          },
        });
        jobsCreated++;
      } catch (error) {
        console.error('Error saving job:', error);
        errors.push(`Failed to save job ${jobData.id}: ${error}`);
      }
    }

    // Create fetch log
    const fetchLog = await prisma.fetchLog.create({
      data: {
        status: errors.length > 0 ? 'partial' : 'success',
        jobsFetched: jobs.length,
        jobsCreated,
        orgsCreated,
        orgsUpdated,
        parameters: queryParams,
        savedQueryId: savedQuery.id,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
      },
    });

    // Update query with last run info
    await prisma.savedQuery.update({
      where: { id: savedQuery.id },
      data: {
        lastRun: new Date(),
        resultCount: jobs.length,
      },
    });

    return NextResponse.json({
      success: true,
      jobsFetched: jobs.length,
      jobsCreated,
      duplicatesSkipped: jobs.length - jobsToSave.length,
      orgsCreated,
      orgsUpdated,
      errors,
      fetchLogId: fetchLog.id,
    });
  } catch (error) {
    console.error('Error executing query:', error);
    
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
      { error: 'Failed to execute query', details: axiosError.message || 'Unknown error' },
      { status: 500 }
    );
  }
}