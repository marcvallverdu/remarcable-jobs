# AI and LinkedIn Enhancement Implementation Plan

## Overview

After examining the Fantastic Jobs API documentation, current database schema, and sample API responses, I've identified opportunities to enhance our job platform with AI-powered fields and additional LinkedIn company data.

## Current Status Analysis

### ✅ Already Implemented (LinkedIn Company Fields)
Our current implementation captures most LinkedIn organization data:
- `linkedin_org_employees` → `linkedinEmployees`
- `linkedin_org_url` → `linkedinUrl`
- `linkedin_org_size` → `linkedinSize`
- `linkedin_org_industry` → `linkedinIndustry`
- `linkedin_org_followers` → `linkedinFollowers`
- `linkedin_org_headquarters` → `linkedinHeadquarters`
- `linkedin_org_type` → `linkedinType`
- `linkedin_org_foundeddate` → `linkedinFoundedDate`
- `linkedin_org_specialties` → `linkedinSpecialties`
- `linkedin_org_locations` → `linkedinLocations`
- `linkedin_org_description` → `linkedinDescription`
- `linkedin_org_slug` → `linkedinSlug`

### ❌ Missing LinkedIn Field
- `linkedin_org_slogan` - Company slogan (present in API response, missing from our schema)
- `linkedin_org_recruitment_agency_derived` - AI-detected recruitment agency flag

### ❌ Missing AI Fields (All New)
The following AI-powered fields are available via the API but not currently captured:

#### Salary Analysis
- `ai_salary_currency` - The salary currency (text)
- `ai_salary_value` - Single salary value (numeric)
- `ai_salary_minvalue` - Minimum salary in range (numeric)
- `ai_salary_maxvalue` - Maximum salary in range (numeric)
- `ai_salary_unittext` - Salary period: HOUR/DAY/WEEK/MONTH/YEAR (text)

#### Job Classification
- `ai_benefits` - Array of non-salary benefits (text[])
- `ai_experience_level` - Required experience: 0-2, 2-5, 5-10, or 10+ (text)
- `ai_work_arrangement` - Remote Solely/Remote OK/Hybrid/On-site (text)
- `ai_work_arrangement_office_days` - Days per week in office for hybrid (bigint)
- `ai_remote_location` - Specific remote location if applicable (text[])
- `ai_remote_location_derived` - Processed remote location data (text[])
- `ai_key_skills` - Key skills mentioned in job listing (text[])
- `ai_core_responsibilities` - 2-sentence summary of core responsibilities (text)
- `ai_requirements_summary` - 2-sentence summary of requirements (text)

#### Hiring Information
- `ai_hiring_manager_name` - Hiring manager name if present (text)
- `ai_hiring_manager_email_address` - Hiring manager email if present (text)

## Implementation Strategy

### Phase 1: Database Schema Updates

#### 1.1 Update Organization Model
```prisma
model Organization {
  // ... existing fields ...
  
  // Add missing LinkedIn fields
  linkedinSlogan                String?   // From linkedin_org_slogan
  linkedinRecruitmentAgency     Boolean?  // From linkedin_org_recruitment_agency_derived
}
```

#### 1.2 Update Job Model
```prisma
model Job {
  // ... existing fields ...
  
  // AI Salary Analysis
  aiSalaryCurrency             String?   // From ai_salary_currency
  aiSalaryValue                Float?    // From ai_salary_value
  aiSalaryMinValue             Float?    // From ai_salary_minvalue
  aiSalaryMaxValue             Float?    // From ai_salary_maxvalue
  aiSalaryUnitText             String?   // From ai_salary_unittext
  
  // AI Job Classification
  aiBenefits                   String[]  // From ai_benefits
  aiExperienceLevel            String?   // From ai_experience_level
  aiWorkArrangement            String?   // From ai_work_arrangement
  aiWorkArrangementOfficeDays  Int?      // From ai_work_arrangement_office_days
  aiRemoteLocation             String[]  // From ai_remote_location
  aiRemoteLocationDerived      String[]  // From ai_remote_location_derived
  aiKeySkills                  String[]  // From ai_key_skills
  aiCoreResponsibilities       String?   // From ai_core_responsibilities
  aiRequirementsSummary        String?   // From ai_requirements_summary
  
  // AI Hiring Information
  aiHiringManagerName          String?   // From ai_hiring_manager_name
  aiHiringManagerEmailAddress  String?   // From ai_hiring_manager_email_address
}
```

### Phase 2: API Integration Updates

#### 2.1 Update TypeScript Types
File: `/lib/fantastic-jobs/types.ts`
- Add all missing AI fields to `FantasticJobsResponse` interface
- Add missing LinkedIn fields (`linkedin_org_slogan`, `linkedin_org_recruitment_agency_derived`)

#### 2.2 Update Mapper Functions
File: `/lib/fantastic-jobs/mapper.ts`
- Update `mapApiToOrganization()` to include missing LinkedIn fields
- Update `mapApiToJob()` to include all AI fields
- Handle null/undefined values appropriately for new fields

#### 2.3 Update API Query Parameters
File: `/lib/fantastic-jobs/types.ts`
- Ensure `include_ai: true` is set when we want AI fields
- Ensure `include_li: true` is set when we want LinkedIn fields (already implemented)

### Phase 3: Query Execution Updates

#### 3.1 Update Default Query Parameters
File: `/app/api/admin/queries/[id]/execute/route.ts`
- Ensure `include_ai: true` is included in API requests by default
- This will enable AI field population for all future queries

### Phase 4: Database Migration

#### 4.1 Create Prisma Migration
```bash
npx prisma migrate dev --name add-ai-linkedin-fields
```

#### 4.2 Update Existing Records (Optional)
- Consider re-fetching recent jobs to populate AI fields
- Could be done via background job or admin interface

### Phase 5: Admin Interface Updates

#### 5.1 Job Display Updates
File: `/app/admin/jobs/page.tsx` and related components
- Add AI fields to job detail views
- Consider grouping AI fields in expandable sections
- Show salary analysis prominently
- Display work arrangement and experience level

#### 5.2 Filtering and Search
- Add filters for AI-derived fields (experience level, work arrangement, etc.)
- Enable search by key skills
- Salary range filtering using AI-parsed values

### Phase 6: Public Job Board Enhancements

#### 6.1 Enhanced Job Listings
- Display structured salary information instead of raw salary text
- Show work arrangement prominently (Remote/Hybrid/On-site)
- Highlight key skills as tags
- Show experience level requirements clearly

#### 6.2 Advanced Filtering
- Filter by work arrangement
- Filter by experience level
- Salary range filtering
- Filter by specific skills

## Technical Considerations

### Data Quality
- AI fields may contain inaccuracies or be empty for some jobs
- Implement fallback logic to use raw fields when AI fields are missing
- Consider adding validation for AI-parsed salary data

### Performance
- Additional fields will increase database size
- Consider indexing frequently filtered AI fields
- Monitor query performance with new fields

### API Costs
- Setting `include_ai: true` may affect API costs (verify with Fantastic Jobs API)
- Monitor usage and costs after implementation

### Migration Strategy
- New fields should be optional to avoid breaking existing functionality
- Gradual rollout: enable for new queries first, then backfill existing data

## Testing Strategy

1. **Unit Tests**: Update mapper function tests
2. **Integration Tests**: Test API calls with AI fields enabled
3. **Database Tests**: Verify all new fields save correctly
4. **UI Tests**: Test new field display and filtering

## Rollout Plan

### Phase 1-2 (Week 1): Backend Implementation
- Database schema updates
- Mapper and type updates
- Enable AI fields in API calls

### Phase 3-4 (Week 2): Data Population
- Deploy migration
- Test with new job fetches
- Verify data quality

### Phase 5-6 (Week 3-4): UI Implementation
- Admin interface updates
- Public job board enhancements
- User testing

## Success Metrics

- AI field population rate (target: >80% of new jobs)
- User engagement with new filters
- Improved job search accuracy
- Reduced time to find relevant positions

## Risks and Mitigation

1. **AI Data Quality**: Implement validation and fallback logic
2. **Performance Impact**: Monitor and optimize queries
3. **API Rate Limits**: Respect API limits and implement retry logic
4. **User Confusion**: Clear labeling of AI-derived vs original data

## Next Steps

1. Review and approve this implementation plan
2. Create detailed development tickets for each phase
3. Set up development environment with API access for AI fields
4. Begin Phase 1 implementation

---

**Note**: This plan assumes AI fields are available in the API response when `include_ai: true` is set. Current sample data doesn't include AI fields, suggesting they may need to be explicitly enabled in API requests.