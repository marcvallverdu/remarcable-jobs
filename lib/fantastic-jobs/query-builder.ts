import { APIQueryParameters } from './types';

export class QueryBuilder {
  private params: Record<string, any> = {};
  
  constructor(baseParams?: APIQueryParameters) {
    if (baseParams) {
      this.params = this.buildParams(baseParams);
    }
  }
  
  // Pagination methods
  pagination(limit: number = 100, offset: number = 0): QueryBuilder {
    this.params.limit = Math.max(10, Math.min(limit, 100)); // Enforce 10-100 range
    this.params.offset = Math.max(0, offset);
    return this;
  }
  
  // Title filter methods
  titleFilter(filter: string): QueryBuilder {
    if (filter && filter.trim()) {
      this.params.title_filter = filter.trim();
    }
    return this;
  }
  
  advancedTitleFilter(filter: string): QueryBuilder {
    if (filter && filter.trim()) {
      // Remove regular title_filter if using advanced
      delete this.params.title_filter;
      this.params.advanced_title_filter = filter.trim();
    }
    return this;
  }
  
  // Location filter methods
  locationFilter(location: string | string[]): QueryBuilder {
    if (location) {
      const locations = Array.isArray(location) ? location : [location];
      const validLocations = locations.filter(l => l && l.trim());
      if (validLocations.length > 0) {
        this.params.location_filter = validLocations.join(' OR ');
      }
    }
    return this;
  }
  
  // Description filter methods
  descriptionFilter(filter: string): QueryBuilder {
    if (filter && filter.trim()) {
      this.params.description_filter = filter.trim();
    }
    return this;
  }
  
  advancedDescriptionFilter(filter: string): QueryBuilder {
    if (filter && filter.trim()) {
      this.params.advanced_description_filter = filter.trim();
    }
    return this;
  }
  
  // Organization filter methods
  organizationFilter(orgs: string | string[]): QueryBuilder {
    if (orgs) {
      const organizations = Array.isArray(orgs) ? orgs : [orgs];
      const validOrgs = organizations.filter(o => o && o.trim());
      if (validOrgs.length > 0) {
        this.params.organization_filter = validOrgs.join(',');
      }
    }
    return this;
  }
  
  organizationExclusionFilter(orgs: string | string[]): QueryBuilder {
    if (orgs) {
      const organizations = Array.isArray(orgs) ? orgs : [orgs];
      const validOrgs = organizations.filter(o => o && o.trim());
      if (validOrgs.length > 0) {
        this.params.organization_exclusion_filter = validOrgs.join(',');
      }
    }
    return this;
  }
  
  advancedOrganizationFilter(filter: string): QueryBuilder {
    if (filter && filter.trim()) {
      this.params.advanced_organization_filter = filter.trim();
    }
    return this;
  }
  
  // Other filter methods
  descriptionType(type: 'text' | 'html'): QueryBuilder {
    this.params.description_type = type;
    return this;
  }
  
  remote(isRemote?: boolean): QueryBuilder {
    if (isRemote !== undefined) {
      this.params.remote = isRemote;
    }
    return this;
  }
  
  source(sources: string | string[]): QueryBuilder {
    if (sources) {
      const sourceList = Array.isArray(sources) ? sources : [sources];
      const validSources = sourceList.filter(s => s && s.trim());
      if (validSources.length > 0) {
        this.params.source = validSources.join(',');
      }
    }
    return this;
  }
  
  dateFilter(date: string | Date): QueryBuilder {
    if (date) {
      const dateStr = date instanceof Date 
        ? date.toISOString().split('T')[0]
        : date;
      this.params.date_filter = dateStr;
    }
    return this;
  }
  
  // AI filter methods
  includeAI(include: boolean = true): QueryBuilder {
    this.params.include_ai = include;
    return this;
  }
  
  aiEmploymentTypeFilter(types: string | string[]): QueryBuilder {
    if (types) {
      const typeList = Array.isArray(types) ? types : [types];
      const validTypes = typeList.filter(t => t && t.trim());
      if (validTypes.length > 0) {
        this.params.ai_employment_type_filter = validTypes.join(',');
      }
    }
    return this;
  }
  
  aiWorkArrangementFilter(arrangements: string | string[]): QueryBuilder {
    if (arrangements) {
      const arrangementList = Array.isArray(arrangements) ? arrangements : [arrangements];
      const validArrangements = arrangementList.filter(a => a && a.trim());
      if (validArrangements.length > 0) {
        this.params.ai_work_arrangement_filter = validArrangements.join(',');
      }
    }
    return this;
  }
  
  aiHasSalary(hasSalary: boolean): QueryBuilder {
    this.params.ai_has_salary = hasSalary;
    return this;
  }
  
  aiExperienceLevelFilter(levels: string | string[]): QueryBuilder {
    if (levels) {
      const levelList = Array.isArray(levels) ? levels : [levels];
      const validLevels = levelList.filter(l => l && l.trim());
      if (validLevels.length > 0) {
        this.params.ai_experience_level_filter = validLevels.join(',');
      }
    }
    return this;
  }
  
  aiVisaSponsorshipFilter(hasSponsorship: boolean): QueryBuilder {
    this.params.ai_visa_sponsorship_filter = hasSponsorship;
    return this;
  }
  
  // LinkedIn filter methods
  includeLinkedIn(include: boolean = true): QueryBuilder {
    this.params.include_li = include;
    return this;
  }
  
  liOrganizationSlugFilter(slugs: string | string[]): QueryBuilder {
    if (slugs) {
      const slugList = Array.isArray(slugs) ? slugs : [slugs];
      const validSlugs = slugList.filter(s => s && s.trim());
      if (validSlugs.length > 0) {
        this.params.li_organization_slug_filter = validSlugs.join(',');
      }
    }
    return this;
  }
  
  liOrganizationSlugExclusionFilter(slugs: string | string[]): QueryBuilder {
    if (slugs) {
      const slugList = Array.isArray(slugs) ? slugs : [slugs];
      const validSlugs = slugList.filter(s => s && s.trim());
      if (validSlugs.length > 0) {
        this.params.li_organization_slug_exclusion_filter = validSlugs.join(',');
      }
    }
    return this;
  }
  
  liIndustryFilter(industries: string | string[]): QueryBuilder {
    if (industries) {
      const industryList = Array.isArray(industries) ? industries : [industries];
      const validIndustries = industryList.filter(i => i && i.trim());
      if (validIndustries.length > 0) {
        this.params.li_industry_filter = validIndustries.join(',');
      }
    }
    return this;
  }
  
  liOrganizationSpecialtiesFilter(filter: string): QueryBuilder {
    if (filter && filter.trim()) {
      this.params.li_organization_specialties_filter = filter.trim();
    }
    return this;
  }
  
  liOrganizationDescriptionFilter(filter: string): QueryBuilder {
    if (filter && filter.trim()) {
      this.params.li_organization_description_filter = filter.trim();
    }
    return this;
  }
  
  liOrganizationEmployeesRange(min?: number, max?: number): QueryBuilder {
    if (min !== undefined && min >= 0) {
      this.params.li_organization_employees_gte = min;
    }
    if (max !== undefined && max >= 0) {
      this.params.li_organization_employees_lte = max;
    }
    return this;
  }
  
  // Build the final query parameters
  build(): Record<string, any> {
    const finalParams: Record<string, any> = {};
    
    // Process each parameter and convert booleans to strings where needed
    Object.entries(this.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // RapidAPI expects string 'true'/'false' for boolean params
        if (typeof value === 'boolean') {
          // Some boolean params should not be included in request when false
          const excludeWhenFalse = ['include_ai', 'include_li', 'ai_has_salary', 'ai_visa_sponsorship_filter'];
          if (excludeWhenFalse.includes(key) && !value) {
            return; // Skip this parameter
          }
          finalParams[key] = value.toString();
        } else {
          finalParams[key] = value;
        }
      }
    });
    
    return finalParams;
  }
  
  // Helper method to build from raw parameters object
  private buildParams(params: APIQueryParameters): Record<string, any> {
    const result: Record<string, any> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result[key] = value;
      }
    });
    
    return result;
  }
  
  // Static factory method to create from JSON
  static fromJSON(json: APIQueryParameters): QueryBuilder {
    return new QueryBuilder(json);
  }
  
  // Convert to JSON for storage
  toJSON(): APIQueryParameters {
    return { ...this.params } as APIQueryParameters;
  }
  
  // Clear all parameters
  clear(): QueryBuilder {
    this.params = {};
    return this;
  }
  
  // Check if any parameters are set
  hasParams(): boolean {
    return Object.keys(this.params).length > 0;
  }
  
  // Get a specific parameter value
  getParam(key: keyof APIQueryParameters): any {
    return this.params[key];
  }
  
  // Set a raw parameter (for advanced use)
  setParam(key: string, value: any): QueryBuilder {
    if (value !== undefined && value !== null) {
      this.params[key] = value;
    }
    return this;
  }
}