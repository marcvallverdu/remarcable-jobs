# Remarcable Jobs - Data Flow Documentation

## API to Database Field Mapping

This document describes the data flow from the Fantastic Jobs API to our database, including all field mappings.

## Data Flow Overview

```
1. Fantastic Jobs API → Returns raw job data with specific field names
2. JobsFetcher → Fetches jobs using API client
3. Mapper Functions → Transform API fields to database fields
4. Prisma → Saves to PostgreSQL database
```

## Critical Field Names from API

The API returns fields with these EXACT names (verified from sample-response.json):

### Job Fields
- `id` - Job unique identifier
- `date_posted` - When job was posted
- `date_created` - When job was created
- `date_validthrough` - Job expiration date (NOT date_valid_through)
- `title` - Job title
- `organization` - Company name (NOT company_name)
- `organization_url` - Company website
- `organization_logo` - Company logo URL
- `description_text` - Full job description (NOT description)
- `employment_type` - Array of employment types (NOT employment_types)
- `url` - Job application URL
- `source_type` - Type of source (ats, etc)
- `source` - Source system
- `source_domain` - Source domain

### Location Fields (all with _derived suffix)
- `cities_derived` - Array of cities
- `counties_derived` - Array of counties  
- `regions_derived` - Array of regions/states
- `countries_derived` - Array of countries
- `locations_derived` - Full location strings
- `timezones_derived` - Timezones
- `lats_derived` - Latitudes array
- `lngs_derived` - Longitudes array
- `remote_derived` - Boolean for remote work
- `domain_derived` - Company domain

### LinkedIn Organization Fields (all with linkedin_org_ prefix)
- `linkedin_org_url` - LinkedIn company URL
- `linkedin_org_slug` - LinkedIn slug (unique identifier)
- `linkedin_org_employees` - Employee count
- `linkedin_org_size` - Size category
- `linkedin_org_industry` - Industry
- `linkedin_org_type` - Company type
- `linkedin_org_foundeddate` - Founded date
- `linkedin_org_followers` - Follower count
- `linkedin_org_headquarters` - HQ location
- `linkedin_org_specialties` - Array of specialties
- `linkedin_org_locations` - Array of office locations
- `linkedin_org_description` - Company description

## Database Schema Fields

### Job Model
```prisma
model Job {
  id                String      // Internal ID
  externalId        String      // Maps from API 'id'
  datePosted        DateTime    // From date_posted
  dateCreated       DateTime    // From date_created
  dateValidThrough  DateTime?   // From date_validthrough
  title             String      // From title
  organizationId    String      // Foreign key to Organization
  
  // Location fields (without _derived suffix)
  cities            String[]    // From cities_derived
  counties          String[]    // From counties_derived
  regions           String[]    // From regions_derived
  countries         String[]    // From countries_derived
  locationsFull     String[]    // From locations_derived
  timezones         String[]    // From timezones_derived
  latitude          Float[]     // From lats_derived
  longitude         Float[]     // From lngs_derived
  isRemote          Boolean     // From remote_derived
  
  // Job details
  employmentType    String[]    // From employment_type
  salaryRaw         Json?       // From salary_raw
  url               String      // From url
  descriptionText   String      // From description_text
  
  // Source tracking
  sourceType        String?     // From source_type
  source            String?     // From source
  sourceDomain      String?     // From source_domain
}
```

### Organization Model
```prisma
model Organization {
  id                    String
  name                  String    // From 'organization'
  url                   String?   // From organization_url
  logo                  String?   // From organization_logo
  domain                String?   // From domain_derived
  
  // LinkedIn fields (without linkedin_org_ prefix)
  linkedinUrl           String?   // From linkedin_org_url
  linkedinSlug          String?   // From linkedin_org_slug
  linkedinEmployees     Int?      // From linkedin_org_employees
  linkedinSize          String?   // From linkedin_org_size
  linkedinIndustry      String?   // From linkedin_org_industry
  linkedinType          String?   // From linkedin_org_type
  linkedinFoundedDate   String?   // From linkedin_org_foundeddate
  linkedinFollowers     Int?      // From linkedin_org_followers
  linkedinHeadquarters  String?   // From linkedin_org_headquarters
  linkedinSpecialties   String[]  // From linkedin_org_specialties
  linkedinLocations     String[]  // From linkedin_org_locations
  linkedinDescription   String?   // From linkedin_org_description
}
```

## Mapper Functions

### mapApiToJob (lib/fantastic-jobs/mapper.ts)
Transforms API job fields to database fields:
- Removes `_derived` suffix from location fields
- Converts date strings to Date objects
- Maps `description_text` → `descriptionText`
- Maps `employment_type` → `employmentType`

### mapApiToOrganization (lib/fantastic-jobs/mapper.ts)
Transforms API organization fields to database fields:
- Maps `organization` → `name`
- Removes `linkedin_org_` prefix from LinkedIn fields
- Handles optional fields with null defaults

## Common Pitfalls to Avoid

1. **DO NOT** assume field names - always check sample-response.json
2. **DO NOT** use `company_name` - the API returns `organization`
3. **DO NOT** use `description` - the API returns `description_text`
4. **DO NOT** use `employment_types` - the API returns `employment_type` (singular)
5. **DO NOT** use `date_valid_through` - the API returns `date_validthrough` (no underscore)
6. **DO NOT** forget the `_derived` suffix on location fields from the API
7. **DO NOT** forget the `linkedin_org_` prefix on LinkedIn fields from the API

## Testing the Flow

To verify the data flow is working:

1. Create a query in the admin panel
2. Run preview to see raw API data
3. Save selected jobs
4. Check the database to verify all fields are populated correctly

## Files Involved in Data Flow

- `/lib/fantastic-jobs/types.ts` - Type definitions matching API response
- `/lib/fantastic-jobs/mapper.ts` - Field mapping functions
- `/lib/fantastic-jobs/fetcher.ts` - Fetches and saves jobs
- `/lib/fantastic-jobs/client.ts` - API client
- `/prisma/schema.prisma` - Database schema
- `/sample-response.json` - Example API response for reference

## Run Commands

When working with job fetching:
- Always run `npm run build` before committing to catch type errors
- Check `/sample-response.json` when unsure about field names
- Use the preview feature to see actual API responses before saving