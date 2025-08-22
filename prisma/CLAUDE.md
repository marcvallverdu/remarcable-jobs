# Database Schema Documentation

## Overview

This directory contains the Prisma schema defining our PostgreSQL database structure. The schema maps API fields to database columns with specific transformations.

## Key Models

### Job Model
Stores job listings with all details from the API.

#### Important Fields:
- `externalId` - UNIQUE - Maps from API `id` field
- `expiredAt` - NULL = active, Date = expired (hidden from public)
- `dateValidThrough` - From API `date_validthrough` (no underscore!)
- `descriptionText` - From API `description_text` (not `description`)
- `locationsRaw` - JSON field for raw location data
- Location arrays - All WITHOUT `_derived` suffix in database

#### Field Mappings from API:
```
API Field                 → Database Field
----------------------------------------------
id                       → externalId
date_posted              → datePosted
date_created             → dateCreated  
date_validthrough        → dateValidThrough
description_text         → descriptionText
employment_type          → employmentType
cities_derived           → cities
counties_derived         → counties
regions_derived          → regions
countries_derived        → countries
locations_derived        → locationsFull
timezones_derived        → timezones
lats_derived            → latitude
lngs_derived            → longitude
remote_derived          → isRemote
salary_raw              → salaryRaw
locations_raw           → locationsRaw
```

### Organization Model
Stores company information with LinkedIn enrichment.

#### Important Fields:
- `domain` - UNIQUE - From API `domain_derived`
- `linkedinSlug` - UNIQUE - From API `linkedin_org_slug`
- LinkedIn fields - All WITHOUT `linkedin_org_` prefix in database

#### Field Mappings from API:
```
API Field                      → Database Field
----------------------------------------------
organization                   → name
organization_url               → url
organization_logo              → logo
domain_derived                 → domain
linkedin_org_url               → linkedinUrl
linkedin_org_slug              → linkedinSlug
linkedin_org_employees         → linkedinEmployees
linkedin_org_size              → linkedinSize
linkedin_org_industry          → linkedinIndustry
linkedin_org_type              → linkedinType
linkedin_org_foundeddate       → linkedinFoundedDate
linkedin_org_followers         → linkedinFollowers
linkedin_org_headquarters      → linkedinHeadquarters
linkedin_org_specialties       → linkedinSpecialties
linkedin_org_locations         → linkedinLocations
linkedin_org_description       → linkedinDescription
```

## Unique Constraints

### Critical Constraints:
1. `Job.externalId` - Prevents duplicate jobs
2. `Organization.domain` - One org per domain
3. `Organization.linkedinSlug` - One org per LinkedIn profile

### Handling Constraint Violations:
- Check for existing records before insert
- Use `findFirst` with OR conditions for organizations
- Handle race conditions with try-catch on create

## Relationships

```
Organization (1) ← → (N) Job
    ↓                      ↓
    (N)                    (N)
JobBoardOrganization   JobBoardJob
    ↓                      ↓
    (1)                    (1)
JobBoard ← ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## Migration Best Practices

1. **Always backup production data** before migrations
2. **Test migrations locally** first
3. **Check for data dependencies** before adding constraints
4. **Use optional fields** when adding new columns to existing tables

## Common Queries

### Find active jobs:
```prisma
where: { expiredAt: null }
```

### Find expired jobs:
```prisma
where: { expiredAt: { not: null } }
```

### Find organization by multiple fields:
```prisma
where: {
  OR: [
    { linkedinSlug: "company-slug" },
    { domain: "company.com" },
    { name: "Company Name" }
  ]
}
```

### Clean orphaned organizations:
```prisma
where: {
  jobs: {
    none: {}
  }
}
```

## Important Notes

1. **NEVER** change unique constraints without checking existing data
2. **ALWAYS** handle both null and empty arrays for array fields
3. **Remember** expired jobs are excluded from duplicate checks
4. **Use** transactions for multi-table operations
5. **Consider** cascade deletes carefully (currently only on JobBoard relations)