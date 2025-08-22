# Fantastic Jobs API Integration

## Critical Field Mapping Rules

This directory handles all interactions with the Fantastic Jobs API. The API returns specific field names that MUST be mapped correctly to our database schema.

## API Response Field Names (EXACT)

### Job Fields
- `id` - Job unique identifier
- `date_posted` - When job was posted
- `date_created` - When job was created  
- `date_validthrough` - Job expiration date (**NOT** `date_valid_through`)
- `title` - Job title
- `organization` - Company name (**NOT** `company_name`)
- `organization_url` - Company website
- `organization_logo` - Company logo URL
- `description_text` - Full job description (**NOT** `description`)
- `employment_type` - Array of employment types (**NOT** `employment_types`)
- `url` - Job application URL
- `source_type` - Type of source (ats, etc)
- `source` - Source system
- `source_domain` - Source domain
- `salary_raw` - Raw salary data
- `locations_raw` - Raw location data structure

### Location Fields (ALL have `_derived` suffix)
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

### LinkedIn Organization Fields (ALL have `linkedin_org_` prefix)
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

## Mapper Functions

### `mapApiToJob` (mapper.ts)
- Removes `_derived` suffix from location fields
- Converts date strings to Date objects
- Maps `description_text` → `descriptionText`
- Maps `employment_type` → `employmentType`

### `mapApiToOrganization` (mapper.ts)
- Maps `organization` → `name`
- Removes `linkedin_org_` prefix from LinkedIn fields
- Handles optional fields with null defaults

## Common Mistakes to Avoid

1. **NEVER** use `company_name` - the API returns `organization`
2. **NEVER** use `description` - the API returns `description_text`
3. **NEVER** use `employment_types` - the API returns `employment_type` (singular)
4. **NEVER** use `date_valid_through` - the API returns `date_validthrough` (no underscore)
5. **ALWAYS** include `_derived` suffix when reading location fields from API
6. **ALWAYS** include `linkedin_org_` prefix when reading LinkedIn fields from API
7. **ALWAYS** check `/sample-response.json` when unsure about field names

## Testing

To verify field mappings are working:
1. Check `/sample-response.json` for actual API response structure
2. Use the preview feature in admin panel to see raw API data
3. Verify all fields are populated correctly in database after saving