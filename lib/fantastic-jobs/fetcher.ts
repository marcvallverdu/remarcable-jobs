import { PrismaClient } from '@prisma/client';
import FantasticJobsClient from './client';
import { FantasticJobsResponse } from './types';
import { mapApiToOrganization, mapApiToJob, extractUniqueOrganizationKey } from './mapper';
import { QueryBuilder } from './query-builder';

export interface FetchResult {
  status: 'success' | 'error' | 'partial';
  jobsFetched: number;
  jobsCreated: number;
  jobsUpdated: number;
  orgsCreated: number;
  orgsUpdated: number;
  errorMessage?: string;
  duration: number;
}

export class JobsFetcher {
  private prisma: PrismaClient;
  private apiClient: FantasticJobsClient;
  private organizationCache: Map<string, string> = new Map();
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.apiClient = new FantasticJobsClient();
  }
  
  async fetchAndSave(
    queryBuilder: QueryBuilder,
    savedQueryId?: string
  ): Promise<FetchResult> {
    const startTime = Date.now();
    const result: FetchResult = {
      status: 'success',
      jobsFetched: 0,
      jobsCreated: 0,
      jobsUpdated: 0,
      orgsCreated: 0,
      orgsUpdated: 0,
      duration: 0,
    };
    
    try {
      // Build query parameters
      const params = queryBuilder.build();
      
      // Fetch jobs from API
      const apiJobs = await this.apiClient.searchJobs(params);
      
      if (!Array.isArray(apiJobs)) {
        throw new Error('Invalid API response format');
      }
      
      result.jobsFetched = apiJobs.length;
      
      // Process each job
      for (const apiJob of apiJobs) {
        try {
          await this.processJob(apiJob, result);
        } catch (error) {
          console.error(`Error processing job ${apiJob.id}:`, error);
          result.status = 'partial';
        }
      }
      
      // Create fetch log
      await this.createFetchLog(params, result, savedQueryId);
      
    } catch (error) {
      result.status = 'error';
      result.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Still create a log for failed fetches
      await this.createFetchLog(
        queryBuilder.build(),
        result,
        savedQueryId
      );
      
      throw error;
    } finally {
      result.duration = Date.now() - startTime;
    }
    
    return result;
  }
  
  private async processJob(
    apiJob: FantasticJobsResponse,
    result: FetchResult
  ): Promise<void> {
    // Get or create organization
    const organizationId = await this.getOrCreateOrganization(apiJob, result);
    
    // Check if job already exists
    const existingJob = await this.prisma.job.findUnique({
      where: { externalId: apiJob.id },
    });
    
    if (existingJob) {
      // Update existing job
      await this.prisma.job.update({
        where: { externalId: apiJob.id },
        data: {
          dateValidThrough: apiJob.date_validthrough 
            ? new Date(apiJob.date_validthrough) 
            : null,
          title: apiJob.title,
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
          lastFetchedAt: new Date(),
        },
      });
      result.jobsUpdated++;
    } else {
      // Create new job
      await this.prisma.job.create({
        data: mapApiToJob(apiJob, organizationId),
      });
      result.jobsCreated++;
    }
  }
  
  private async getOrCreateOrganization(
    apiJob: FantasticJobsResponse,
    result: FetchResult
  ): Promise<string> {
    const orgKey = extractUniqueOrganizationKey(apiJob);
    
    // Check cache first
    if (this.organizationCache.has(orgKey)) {
      return this.organizationCache.get(orgKey)!;
    }
    
    // Try to find existing organization
    let organization = null;
    
    if (apiJob.linkedin_org_slug) {
      organization = await this.prisma.organization.findUnique({
        where: { linkedinSlug: apiJob.linkedin_org_slug },
      });
    }
    
    if (!organization && apiJob.domain_derived) {
      organization = await this.prisma.organization.findUnique({
        where: { domain: apiJob.domain_derived },
      });
    }
    
    if (!organization) {
      // Create new organization
      const orgData = mapApiToOrganization(apiJob);
      
      organization = await this.prisma.organization.create({
        data: orgData,
      });
      result.orgsCreated++;
    } else {
      // Update existing organization with any new data
      const updateData: any = {};
      
      // Only update fields that are null in the database but present in the API
      if (!organization.logo && apiJob.organization_logo) {
        updateData.logo = apiJob.organization_logo;
      }
      if (!organization.linkedinUrl && apiJob.linkedin_org_url) {
        updateData.linkedinUrl = apiJob.linkedin_org_url;
      }
      if (!organization.linkedinEmployees && apiJob.linkedin_org_employees) {
        updateData.linkedinEmployees = apiJob.linkedin_org_employees;
      }
      if (!organization.linkedinFollowers && apiJob.linkedin_org_followers) {
        updateData.linkedinFollowers = apiJob.linkedin_org_followers;
      }
      if (!organization.linkedinDescription && apiJob.linkedin_org_description) {
        updateData.linkedinDescription = apiJob.linkedin_org_description;
      }
      
      if (Object.keys(updateData).length > 0) {
        organization = await this.prisma.organization.update({
          where: { id: organization.id },
          data: updateData,
        });
        result.orgsUpdated++;
      }
    }
    
    // Cache the organization ID
    this.organizationCache.set(orgKey, organization.id);
    
    return organization.id;
  }
  
  private async createFetchLog(
    parameters: Record<string, any>,
    result: FetchResult,
    savedQueryId?: string
  ): Promise<void> {
    await this.prisma.fetchLog.create({
      data: {
        status: result.status,
        jobsFetched: result.jobsFetched,
        jobsCreated: result.jobsCreated,
        jobsUpdated: result.jobsUpdated,
        orgsCreated: result.orgsCreated,
        orgsUpdated: result.orgsUpdated,
        parameters,
        savedQueryId,
        errorMessage: result.errorMessage,
        duration: result.duration,
      },
    });
  }
  
  async preview(queryBuilder: QueryBuilder): Promise<any[]> {
    const params = queryBuilder.pagination(5, 0).build();
    const jobs = await this.apiClient.searchJobs(params);
    
    return Array.isArray(jobs) ? jobs.slice(0, 5) : [];
  }
}