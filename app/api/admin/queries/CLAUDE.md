# Query API Routes

## Overview

This directory contains API routes for managing and executing saved job search queries.

## Routes

### `/[id]/execute/route.ts` - Main Query Execution
**This is the primary route for running queries and fetching jobs.**

- Makes direct calls to RapidAPI
- Handles job saving with duplicate detection
- Supports expired job reactivation
- Manages organization creation/updates

#### Key Features:
1. **Duplicate Detection**: Only checks against active jobs (expired jobs excluded)
2. **Job Reactivation**: If an expired job is re-imported, it updates the existing record
3. **Organization Deduplication**: Checks by LinkedIn slug, domain, AND name
4. **Race Condition Handling**: Safely handles concurrent organization creation

#### Request Body:
```json
{
  "saveJobs": true,           // Whether to save fetched jobs
  "selectedJobIds": []         // Empty array = save all, or specific IDs
}
```

#### Response:
```json
{
  "success": true,
  "jobsFetched": 10,          // Total jobs from API
  "jobsCreated": 5,           // New jobs added
  "jobsReactivated": 2,       // Expired jobs reactivated
  "duplicatesSkipped": 3,     // Active jobs skipped
  "orgsCreated": 1,           // New organizations
  "orgsUpdated": 2            // Organizations updated with LinkedIn data
}
```

### `/[id]/run/route.ts` - Legacy Route
**DEPRECATED - Do not use. Use `/execute` instead.**

This route uses outdated JobsFetcher pattern and doesn't properly handle field mappings.

## Field Mapping in Execute Route

The execute route builds query parameters for RapidAPI:

### Query Parameter Mappings:
- `title` → `title_filter`
- `location` → `location_filter`
- `company` → `organization_filter` (NOT company_filter!)
- `query` → `description_filter`

### Important Notes:
1. **Always use execute route** for running queries
2. **Check field mappings** match API expectations (see /lib/fantastic-jobs/CLAUDE.md)
3. **Handle errors gracefully** - API rate limits return 429 status

## Common Issues & Solutions

### Issue: "Failed to run query"
- Check RapidAPI credentials in environment variables
- Verify endpoint exists in API_ENDPOINTS map
- Check for rate limiting (429 errors)

### Issue: Jobs not saving
- Verify field mappings are correct
- Check for unique constraint violations on organizations
- Ensure dates are valid (date_posted, date_created)

### Issue: Duplicates being created
- Expired jobs should be excluded from duplicate check
- Organization lookup must check domain AND LinkedIn slug
- Use the expiredJobsMap for reactivation logic