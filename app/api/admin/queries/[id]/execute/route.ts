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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      where: { id },
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
    const endpoint = (parameters.endpoint as string) || 'active-ats-7d';

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
    
    // Check for duplicates in database - only check active jobs (not expired)
    const externalIds = jobs.map((job: Record<string, unknown>) => job.id as string);
    const existingJobs = await prisma.job.findMany({
      where: {
        externalId: {
          in: externalIds,
        },
        expiredAt: null, // Only check against active jobs, not expired ones
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
    let jobsReactivated = 0;
    let orgsCreated = 0;
    let orgsUpdated = 0;
    const errors: string[] = [];

    // Check if any of the jobs we're about to save are expired in the database
    // If so, we'll reactivate them instead of creating new ones
    const expiredJobs = await prisma.job.findMany({
      where: {
        externalId: {
          in: jobsToSave.map((job: Record<string, unknown>) => job.id as string),
        },
        expiredAt: { not: null }, // Find expired jobs
      },
      select: {
        id: true,
        externalId: true,
      },
    });

    const expiredJobsMap = new Map(expiredJobs.map(j => [j.externalId, j.id]));

    // Save jobs to database
    for (const jobData of jobsToSave) {
      try {
        // Validate required fields first
        if (!jobData.id || !jobData.title || !jobData.url) {
          console.error('Missing required job fields:', { 
            id: jobData.id, 
            title: jobData.title, 
            url: jobData.url 
          });
          errors.push(`Job ${jobData.id || 'unknown'}: Missing required fields`);
          continue;
        }
        
        // Validate date fields
        if (jobData.date_posted && isNaN(Date.parse(jobData.date_posted as string))) {
          console.error(`Invalid date_posted for job ${jobData.id}:`, jobData.date_posted);
          errors.push(`Job ${jobData.id}: Invalid date_posted value`);
          continue;
        }
        
        // First, handle the organization
        // API returns 'organization' not 'company_name'
        const companyName = (jobData.organization as string) || 'Unknown Company';
        
        // Build conditions for finding existing organization
        const orgConditions = [];
        
        // Check by LinkedIn slug (most reliable)
        if (jobData.linkedin_org_slug) {
          orgConditions.push({ linkedinSlug: jobData.linkedin_org_slug as string });
        }
        
        // Check by domain (also unique)
        if (jobData.domain_derived) {
          orgConditions.push({ domain: jobData.domain_derived as string });
        }
        
        // Check by name as fallback
        orgConditions.push({ name: companyName });
        
        let organization = await prisma.organization.findFirst({
          where: {
            OR: orgConditions,
          },
        });

        if (!organization) {
          // Create new organization - handle potential race condition
          try {
            organization = await prisma.organization.create({
              data: {
              name: companyName,
              url: jobData.organization_url as string | undefined,
              logo: jobData.organization_logo as string | undefined,
              domain: jobData.domain_derived as string | undefined,
              linkedinUrl: jobData.linkedin_org_url as string | undefined,
              linkedinSlug: jobData.linkedin_org_slug as string | undefined,
              linkedinEmployees: jobData.linkedin_org_employees as number | undefined,
              linkedinSize: jobData.linkedin_org_size as string | undefined,
              linkedinIndustry: jobData.linkedin_org_industry as string | undefined,
              linkedinType: jobData.linkedin_org_type as string | undefined,
              linkedinFollowers: jobData.linkedin_org_followers as number | undefined,
              linkedinHeadquarters: jobData.linkedin_org_headquarters as string | undefined,
              linkedinSpecialties: Array.isArray(jobData.linkedin_org_specialties) ? jobData.linkedin_org_specialties as string[] : [],
              linkedinLocations: Array.isArray(jobData.linkedin_org_locations) ? jobData.linkedin_org_locations as string[] : [],
              linkedinDescription: jobData.linkedin_org_description as string | undefined,
              linkedinFoundedDate: jobData.linkedin_org_foundeddate as string | undefined,
            },
          });
          orgsCreated++;
        } catch (createError) {
          // Handle race condition - another request might have created it
          if (createError instanceof Error && createError.message.includes('Unique constraint')) {
            // Try to find the organization again
            organization = await prisma.organization.findFirst({
              where: {
                OR: orgConditions,
              },
            });
            
            if (!organization) {
              throw createError; // Re-throw if we still can't find it
            }
          } else {
            throw createError;
          }
        }
        }
        
        // Ensure we have an organization before proceeding
        if (!organization) {
          console.error(`Failed to create or find organization for job ${jobData.id}`);
          errors.push(`Job ${jobData.id}: Failed to create or find organization`);
          continue;
        }
        
        if (jobData.linkedin_org_url && !organization.linkedinUrl) {
          // Update organization with LinkedIn data only if we have new data
          const updateData: Record<string, unknown> = {};
          
          // Only update fields that have values
          if (jobData.linkedin_org_url) updateData.linkedinUrl = jobData.linkedin_org_url;
          if (jobData.linkedin_org_slug) updateData.linkedinSlug = jobData.linkedin_org_slug;
          if (jobData.linkedin_org_employees) updateData.linkedinEmployees = jobData.linkedin_org_employees;
          if (jobData.linkedin_org_size) updateData.linkedinSize = jobData.linkedin_org_size;
          if (jobData.linkedin_org_industry) updateData.linkedinIndustry = jobData.linkedin_org_industry;
          if (jobData.linkedin_org_type) updateData.linkedinType = jobData.linkedin_org_type;
          if (jobData.linkedin_org_followers) updateData.linkedinFollowers = jobData.linkedin_org_followers;
          if (jobData.linkedin_org_headquarters) updateData.linkedinHeadquarters = jobData.linkedin_org_headquarters;
          if (Array.isArray(jobData.linkedin_org_specialties) && jobData.linkedin_org_specialties.length > 0) {
            updateData.linkedinSpecialties = jobData.linkedin_org_specialties;
          }
          if (Array.isArray(jobData.linkedin_org_locations) && jobData.linkedin_org_locations.length > 0) {
            updateData.linkedinLocations = jobData.linkedin_org_locations;
          }
          if (jobData.linkedin_org_description) updateData.linkedinDescription = jobData.linkedin_org_description;
          if (jobData.linkedin_org_foundeddate) updateData.linkedinFoundedDate = jobData.linkedin_org_foundeddate;
          
          // Only update if we have data to update
          if (Object.keys(updateData).length > 0) {
            await prisma.organization.update({
              where: { id: organization.id },
              data: updateData,
            });
            orgsUpdated++;
          }
        }

        // Check if this job was previously expired and needs to be reactivated
        const expiredJobId = expiredJobsMap.get(jobData.id as string);
        
        if (expiredJobId) {
          // Reactivate the expired job instead of creating a new one
          await prisma.job.update({
            where: { id: expiredJobId },
            data: {
              // Update all fields with fresh data
              title: jobData.title as string,
              url: jobData.url as string,
              organizationId: organization.id,
              datePosted: jobData.date_posted ? new Date(jobData.date_posted as string) : new Date(),
              dateValidThrough: jobData.date_validthrough ? new Date(jobData.date_validthrough as string) : null,
              descriptionText: jobData.description_text as string || '',
              locationsRaw: jobData.locations_raw || null,
              cities: Array.isArray(jobData.cities_derived) ? jobData.cities_derived as string[] : [],
              counties: Array.isArray(jobData.counties_derived) ? jobData.counties_derived as string[] : [],
              regions: Array.isArray(jobData.regions_derived) ? jobData.regions_derived as string[] : [],
              countries: Array.isArray(jobData.countries_derived) ? jobData.countries_derived as string[] : [],
              locationsFull: Array.isArray(jobData.locations_derived) ? jobData.locations_derived as string[] : [],
              timezones: Array.isArray(jobData.timezones_derived) ? jobData.timezones_derived as string[] : [],
              latitude: Array.isArray(jobData.lats_derived) ? jobData.lats_derived as number[] : [],
              longitude: Array.isArray(jobData.lngs_derived) ? jobData.lngs_derived as number[] : [],
              isRemote: Boolean(jobData.remote_derived),
              employmentType: Array.isArray(jobData.employment_type) ? jobData.employment_type as string[] : [],
              salaryRaw: jobData.salary_raw || null,
              sourceType: jobData.source_type as string | undefined,
              source: jobData.source as string | undefined,
              sourceDomain: jobData.source_domain as string | undefined,
              lastFetchedAt: new Date(),
              expiredAt: null, // Remove the expired status
            },
          });
          jobsReactivated++;
          console.log(`Reactivated previously expired job: ${jobData.id}`);
        } else {
          // Create new job
          await prisma.job.create({
            data: {
              externalId: jobData.id as string,
              title: jobData.title as string,
              url: jobData.url as string,
              organizationId: organization.id,
              datePosted: jobData.date_posted ? new Date(jobData.date_posted as string) : new Date(),
              dateCreated: jobData.date_created ? new Date(jobData.date_created as string) : (jobData.date_posted ? new Date(jobData.date_posted as string) : new Date()),
              dateValidThrough: jobData.date_validthrough ? new Date(jobData.date_validthrough as string) : null,
              descriptionText: jobData.description_text as string || '',
              locationsRaw: jobData.locations_raw || null,
              cities: Array.isArray(jobData.cities_derived) ? jobData.cities_derived as string[] : [],
              counties: Array.isArray(jobData.counties_derived) ? jobData.counties_derived as string[] : [],
              regions: Array.isArray(jobData.regions_derived) ? jobData.regions_derived as string[] : [],
              countries: Array.isArray(jobData.countries_derived) ? jobData.countries_derived as string[] : [],
              locationsFull: Array.isArray(jobData.locations_derived) ? jobData.locations_derived as string[] : [],
              timezones: Array.isArray(jobData.timezones_derived) ? jobData.timezones_derived as string[] : [],
              latitude: Array.isArray(jobData.lats_derived) ? jobData.lats_derived as number[] : [],
              longitude: Array.isArray(jobData.lngs_derived) ? jobData.lngs_derived as number[] : [],
              isRemote: Boolean(jobData.remote_derived),
              employmentType: Array.isArray(jobData.employment_type) ? jobData.employment_type as string[] : [],
              salaryRaw: jobData.salary_raw || null,
              sourceType: jobData.source_type as string | undefined,
              source: jobData.source as string | undefined,
              sourceDomain: jobData.source_domain as string | undefined,
              lastFetchedAt: new Date(),
            },
          });
          jobsCreated++;
        }
      } catch (error) {
        console.error('Error saving job:', jobData.id, error);
        
        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('Unique constraint')) {
            errors.push(`Job ${jobData.id}: Duplicate organization constraint (domain or slug)`);
          } else if (error.message.includes('Foreign key constraint')) {
            errors.push(`Job ${jobData.id}: Failed to link to organization`);
          } else {
            errors.push(`Job ${jobData.id}: ${error.message}`);
          }
        } else {
          errors.push(`Job ${jobData.id}: Unknown error`);
        }
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
      jobsReactivated,
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