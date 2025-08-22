export interface FantasticJobsResponse {
  id: string;
  date_posted: string;
  date_created: string;
  title: string;
  
  // Company/Organization fields (API returns company_* prefix)
  company_name: string;
  company_url?: string;
  company_logo?: string;
  company_linkedin_url?: string;
  company_linkedin_slug?: string;
  company_employees?: number;
  company_size?: string;
  company_industry?: string;
  company_type?: string;
  company_followers?: number;
  company_headquarters?: string;
  company_founded_date?: string;
  company_specialties?: string[];
  company_locations?: string[];
  company_description?: string;
  
  // Job details
  date_valid_through?: string;
  locations_raw?: LocationRaw[];
  locations_alt_raw?: LocationRaw[];
  location_type?: string;
  location_requirements_raw?: Record<string, unknown>;
  salary_raw?: Record<string, unknown>;
  employment_types?: string[];
  url: string;
  source_type?: string;
  source?: string;
  source_domain?: string;
  
  // Location derived fields
  cities?: string[];
  counties?: string[];
  regions?: string[];
  countries?: string[];
  locations_full?: string[];
  timezones?: string[];
  latitude?: number[];
  longitude?: number[];
  remote?: boolean;
  domain_derived?: string;
  
  // Description
  description: string;
}

export interface LocationRaw {
  "@type": "Place";
  address: {
    "@type": "PostalAddress";
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
}

export interface APIQueryParameters {
  // Pagination
  limit?: number; // 10-100, default 100
  offset?: number; // For pagination
  
  // Title filters
  title_filter?: string; // Google-like search on job title
  advanced_title_filter?: string; // Advanced title filter with operators
  
  // Location filters
  location_filter?: string; // Full names, can use OR
  
  // Description filters  
  description_filter?: string; // Google-like search on description
  advanced_description_filter?: string; // Advanced with operators
  
  // Organization filters
  organization_filter?: string; // Exact match, comma-delimited
  organization_exclusion_filter?: string; // Exclude organizations
  advanced_organization_filter?: string; // Advanced with operators
  
  // Other filters
  description_type?: 'text' | 'html'; // Type of description to return
  remote?: boolean; // true = remote only, false = non-remote only
  source?: string; // Filter by ATS source, comma-delimited
  date_filter?: string; // Greater than filter for date posted
  
  // AI-powered filters (BETA)
  include_ai?: boolean; // Include AI insights
  ai_employment_type_filter?: string; // FULL_TIME,PART_TIME,etc
  ai_work_arrangement_filter?: string; // On-site,Hybrid,Remote OK,etc
  ai_has_salary?: boolean; // Only jobs with salary info
  ai_experience_level_filter?: string; // 0-2,2-5,5-10,10+
  ai_visa_sponsorship_filter?: boolean; // Jobs with visa sponsorship
  
  // LinkedIn organization filters (BETA)
  include_li?: boolean; // Include LinkedIn company data
  li_organization_slug_filter?: string; // Filter by LinkedIn slug
  li_organization_slug_exclusion_filter?: string; // Exclude by slug
  li_industry_filter?: string; // Filter by LinkedIn industry
  li_organization_specialties_filter?: string; // Filter by specialties
  li_organization_description_filter?: string; // Filter by company description
  li_organization_employees_lte?: number; // Max employees
  li_organization_employees_gte?: number; // Min employees
}