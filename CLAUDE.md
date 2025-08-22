# Remarcable Jobs - Project Documentation

## Overview

Remarcable Jobs is a job board platform that fetches job listings from the Fantastic Jobs API and provides comprehensive management capabilities. This documentation is distributed across the codebase for context-specific guidance.

## Distributed Documentation

For detailed, context-specific documentation, see:

- **[/lib/fantastic-jobs/CLAUDE.md](./lib/fantastic-jobs/CLAUDE.md)** - API field mappings and integration
- **[/app/api/admin/queries/CLAUDE.md](./app/api/admin/queries/CLAUDE.md)** - Query execution and API routes
- **[/app/admin/jobs/CLAUDE.md](./app/admin/jobs/CLAUDE.md)** - Jobs management UI and bulk operations
- **[/prisma/CLAUDE.md](./prisma/CLAUDE.md)** - Database schema and field mappings

## Data Flow Overview

```
1. Fantastic Jobs API → Returns raw job data with specific field names
2. Query Execution → Fetches jobs via RapidAPI with field mapping
3. Data Processing → Transform API fields to database fields
4. Prisma ORM → Saves to PostgreSQL database
5. Admin UI → Manage jobs with bulk operations
```

## Quick Reference - Critical Field Names

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

## Most Common Field Mapping Mistakes

**CRITICAL - These cause 90% of issues:**

1. ❌ `company_name` → ✅ `organization`
2. ❌ `description` → ✅ `description_text`  
3. ❌ `employment_types` → ✅ `employment_type` (singular)
4. ❌ `date_valid_through` → ✅ `date_validthrough` (no underscore)
5. ❌ `cities` → ✅ `cities_derived` (when reading from API)
6. ❌ `linkedin_url` → ✅ `linkedin_org_url` (when reading from API)

## Job Lifecycle & Operations

### Job States:
- **Active**: `expiredAt = null` - Visible publicly
- **Expired**: `expiredAt = Date` - Hidden from public, visible in admin
- **Deleted**: Removed from database entirely

### Key Behaviors:
- Expired jobs are **excluded** from duplicate checks
- Re-importing expired jobs **reactivates** them (doesn't create duplicates)
- Deleting jobs **cleans up** orphaned organizations automatically

## Essential Commands

```bash
# Build and check for type errors before committing
npm run build

# Run database migrations
npx prisma migrate dev

# Check actual API response structure
cat sample-response.json | jq '.[0]' | head -50
```

## Where to Find Specific Information

- **API Field Names**: Check `/sample-response.json` or `/lib/fantastic-jobs/CLAUDE.md`
- **Database Schema**: See `/prisma/schema.prisma` or `/prisma/CLAUDE.md`
- **Query Execution Issues**: See `/app/api/admin/queries/CLAUDE.md`
- **UI/Bulk Operations**: See `/app/admin/jobs/CLAUDE.md`

## Important Files

- `/sample-response.json` - Actual API response example (ground truth for field names)
- `/app/api/admin/queries/[id]/execute/route.ts` - Main query execution (NOT /run)
- `/lib/fantastic-jobs/mapper.ts` - Field transformation logic
- `/prisma/schema.prisma` - Database structure