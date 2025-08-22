import { FantasticJobsResponse } from './types';
import { Prisma } from '@prisma/client';

export function mapApiToOrganization(
  apiJob: FantasticJobsResponse
): Prisma.OrganizationCreateInput {
  return {
    name: apiJob.company_name,
    url: apiJob.company_url || null,
    logo: apiJob.company_logo || null,
    domain: apiJob.domain_derived || null,
    linkedinUrl: apiJob.company_linkedin_url || null,
    linkedinSlug: apiJob.company_linkedin_slug || null,
    linkedinEmployees: apiJob.company_employees || null,
    linkedinSize: apiJob.company_size || null,
    linkedinIndustry: apiJob.company_industry || null,
    linkedinType: apiJob.company_type || null,
    linkedinFoundedDate: apiJob.company_founded_date || null,
    linkedinFollowers: apiJob.company_followers || null,
    linkedinHeadquarters: apiJob.company_headquarters || null,
    linkedinSpecialties: apiJob.company_specialties || [],
    linkedinLocations: apiJob.company_locations || [],
    linkedinDescription: apiJob.company_description || null,
  };
}

export function mapApiToJob(
  apiJob: FantasticJobsResponse,
  organizationId: string
): Prisma.JobCreateInput {
  return {
    externalId: apiJob.id,
    datePosted: new Date(apiJob.date_posted),
    dateCreated: new Date(apiJob.date_created),
    dateValidThrough: apiJob.date_valid_through 
      ? new Date(apiJob.date_valid_through) 
      : null,
    title: apiJob.title,
    organization: {
      connect: { id: organizationId }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    locationsRaw: apiJob.locations_raw as any || undefined,
    cities: apiJob.cities || [],
    counties: apiJob.counties || [],
    regions: apiJob.regions || [],
    countries: apiJob.countries || [],
    locationsFull: apiJob.locations_full || [],
    timezones: apiJob.timezones || [],
    latitude: apiJob.latitude || [],
    longitude: apiJob.longitude || [],
    isRemote: apiJob.remote || false,
    employmentType: apiJob.employment_types || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    salaryRaw: apiJob.salary_raw as any || undefined,
    url: apiJob.url,
    descriptionText: apiJob.description,
    sourceType: apiJob.source_type || null,
    source: apiJob.source || null,
    sourceDomain: apiJob.source_domain || null,
    lastFetchedAt: new Date(),
  };
}

export function extractUniqueOrganizationKey(apiJob: FantasticJobsResponse): string {
  // Priority order for unique organization identification
  if (apiJob.company_linkedin_slug) {
    return `linkedin:${apiJob.company_linkedin_slug}`;
  }
  if (apiJob.domain_derived) {
    return `domain:${apiJob.domain_derived}`;
  }
  // Fallback to organization name (less reliable but necessary)
  return `name:${apiJob.company_name.toLowerCase().replace(/\s+/g, '-')}`;
}