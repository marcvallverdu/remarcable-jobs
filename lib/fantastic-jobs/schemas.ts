import { z } from 'zod';

// Comprehensive schema for all API query parameters
export const apiQuerySchema = z.object({
  // Pagination
  limit: z.number().min(10).max(100).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  
  // Title filters
  title_filter: z.string().optional(),
  advanced_title_filter: z.string().optional(),
  
  // Location filters
  location_filter: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  
  // Description filters
  description_filter: z.string().optional(),
  advanced_description_filter: z.string().optional(),
  
  // Organization filters
  organization_filter: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  organization_exclusion_filter: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  advanced_organization_filter: z.string().optional(),
  
  // Other filters
  description_type: z.enum(['text', 'html']).optional(),
  remote: z.boolean().optional(),
  source: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  date_filter: z.string().optional(),
  
  // AI-powered filters
  include_ai: z.boolean().optional(),
  ai_employment_type_filter: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  ai_work_arrangement_filter: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  ai_has_salary: z.boolean().optional(),
  ai_experience_level_filter: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  ai_visa_sponsorship_filter: z.boolean().optional(),
  
  // LinkedIn organization filters
  include_li: z.boolean().optional().default(true),
  li_organization_slug_filter: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  li_organization_slug_exclusion_filter: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  li_industry_filter: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  li_organization_specialties_filter: z.string().optional(),
  li_organization_description_filter: z.string().optional(),
  li_organization_employees_lte: z.number().min(0).optional(),
  li_organization_employees_gte: z.number().min(0).optional(),
});

// Schema for preview requests (extends base with savedQueryId)
export const previewRequestSchema = apiQuerySchema;

// Schema for execute requests (extends base with savedQueryId)
export const executeRequestSchema = apiQuerySchema.extend({
  savedQueryId: z.string().optional(),
});

// Employment type enum
export const EmploymentTypeEnum = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACTOR',
  'TEMPORARY',
  'INTERN',
  'VOLUNTEER',
  'PER_DIEM',
  'OTHER'
]);

// Work arrangement enum
export const WorkArrangementEnum = z.enum([
  'On-site',
  'Hybrid',
  'Remote OK',
  'Remote Solely'
]);

// Experience level enum
export const ExperienceLevelEnum = z.enum([
  '0-2',
  '2-5',
  '5-10',
  '10+'
]);

// ATS sources
export const ATSSourceEnum = z.enum([
  'ashby',
  'bamboohr',
  'breezy',
  'careerplug',
  'comeet',
  'csod',
  'dayforce',
  'eightfold',
  'freshteam',
  'greenhouse',
  'gohire',
  'hirehive',
  'hiringthing',
  'icims',
  'jazzhr',
  'jobvite',
  'join.com',
  'lever.co',
  'oraclecloud',
  'paycom',
  'paylocity',
  'personio',
  'phenompeople',
  'pinpoint',
  'polymer',
  'recruitee',
  'recooty',
  'rippling',
  'smartrecruiters',
  'successfactors',
  'teamtailor',
  'trakstar',
  'workable',
  'workday',
  'zoho'
]);

export type APIQueryParams = z.infer<typeof apiQuerySchema>;
export type PreviewRequest = z.infer<typeof previewRequestSchema>;
export type ExecuteRequest = z.infer<typeof executeRequestSchema>;