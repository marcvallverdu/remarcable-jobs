import { FantasticJobsResponse } from './types';
import { Organization, Job, Prisma } from '@prisma/client';

export function mapApiToOrganization(
  apiJob: FantasticJobsResponse
): Prisma.OrganizationCreateInput {
  return {
    name: apiJob.organization,
    url: apiJob.organization_url || null,
    logo: apiJob.organization_logo || null,
    domain: apiJob.domain_derived || null,
    linkedinUrl: apiJob.linkedin_org_url || null,
    linkedinSlug: apiJob.linkedin_org_slug || null,
    linkedinEmployees: apiJob.linkedin_org_employees || null,
    linkedinSize: apiJob.linkedin_org_size || null,
    linkedinIndustry: apiJob.linkedin_org_industry || null,
    linkedinType: apiJob.linkedin_org_type || null,
    linkedinFoundedDate: apiJob.linkedin_org_foundeddate || null,
    linkedinFollowers: apiJob.linkedin_org_followers || null,
    linkedinHeadquarters: apiJob.linkedin_org_headquarters || null,
    linkedinSpecialties: apiJob.linkedin_org_specialties || [],
    linkedinLocations: apiJob.linkedin_org_locations || [],
    linkedinDescription: apiJob.linkedin_org_description || null,
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
    dateValidThrough: apiJob.date_validthrough 
      ? new Date(apiJob.date_validthrough) 
      : null,
    title: apiJob.title,
    organization: {
      connect: { id: organizationId }
    },
    locationsRaw: apiJob.locations_raw as any || null,
    cities: apiJob.cities_derived || [],
    counties: apiJob.counties_derived || [],
    regions: apiJob.regions_derived || [],
    countries: apiJob.countries_derived || [],
    locationsFull: apiJob.locations_derived || [],
    timezones: apiJob.timezones_derived || [],
    latitude: apiJob.lats_derived || [],
    longitude: apiJob.lngs_derived || [],
    isRemote: apiJob.remote_derived || false,
    employmentType: apiJob.employment_type || [],
    salaryRaw: apiJob.salary_raw as any || null,
    url: apiJob.url,
    descriptionText: apiJob.description_text,
    sourceType: apiJob.source_type || null,
    source: apiJob.source || null,
    sourceDomain: apiJob.source_domain || null,
    lastFetchedAt: new Date(),
  };
}

export function extractUniqueOrganizationKey(apiJob: FantasticJobsResponse): string {
  // Priority order for unique organization identification
  if (apiJob.linkedin_org_slug) {
    return `linkedin:${apiJob.linkedin_org_slug}`;
  }
  if (apiJob.domain_derived) {
    return `domain:${apiJob.domain_derived}`;
  }
  // Fallback to organization name (less reliable but necessary)
  return `name:${apiJob.organization.toLowerCase().replace(/\s+/g, '-')}`;
}