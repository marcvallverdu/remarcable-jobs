import { FantasticJobsResponse } from './types';
import { Prisma } from '@prisma/client';

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
    linkedinSlogan: apiJob.linkedin_org_slogan || null,
    linkedinRecruitmentAgency: apiJob.linkedin_org_recruitment_agency_derived || null,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    locationsRaw: apiJob.locations_raw as any || undefined,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    salaryRaw: apiJob.salary_raw as any || undefined,
    url: apiJob.url,
    descriptionText: apiJob.description_text,
    sourceType: apiJob.source_type || null,
    source: apiJob.source || null,
    sourceDomain: apiJob.source_domain || null,
    
    // AI-powered analysis fields
    aiSalaryCurrency: apiJob.ai_salary_currency || null,
    aiSalaryValue: apiJob.ai_salary_value || null,
    aiSalaryMinValue: apiJob.ai_salary_minvalue || null,
    aiSalaryMaxValue: apiJob.ai_salary_maxvalue || null,
    aiSalaryUnitText: apiJob.ai_salary_unittext || null,
    aiBenefits: apiJob.ai_benefits || [],
    aiExperienceLevel: apiJob.ai_experience_level || null,
    aiWorkArrangement: apiJob.ai_work_arrangement || null,
    aiWorkArrangementOfficeDays: apiJob.ai_work_arrangement_office_days || null,
    aiRemoteLocation: apiJob.ai_remote_location || [],
    aiRemoteLocationDerived: apiJob.ai_remote_location_derived || [],
    aiKeySkills: apiJob.ai_key_skills || [],
    aiCoreResponsibilities: apiJob.ai_core_responsibilities || null,
    aiRequirementsSummary: apiJob.ai_requirements_summary || null,
    aiHiringManagerName: apiJob.ai_hiring_manager_name || null,
    aiHiringManagerEmailAddress: apiJob.ai_hiring_manager_email_address || null,
    aiWorkingHours: apiJob.ai_working_hours || null,
    aiEmploymentType: apiJob.ai_employment_type || [],
    aiJobLanguage: apiJob.ai_job_language || null,
    aiVisaSponsorship: apiJob.ai_visa_sponsorship || null,
    
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