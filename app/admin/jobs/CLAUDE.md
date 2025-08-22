# Jobs Management UI

## Overview

This directory contains the admin interface for managing jobs. It provides comprehensive job management capabilities including viewing, sorting, filtering, and bulk operations.

## Components

### `page.tsx` - Jobs List Page (Server Component)
- Fetches jobs with filters and pagination
- Supports sorting by multiple fields
- Renders the client component with initial data

### `jobs-management-client.tsx` - Interactive Jobs List (Client Component)
- Multi-select functionality with checkboxes
- Bulk operations (expire, reactivate, delete)
- Real-time UI updates
- Sorting and filtering controls

### `[id]/job-detail-client.tsx` - Individual Job Details
- View full job information
- Expire/Reactivate individual jobs
- Delete with double confirmation
- Manage job board assignments

## Job Lifecycle Management

### States:
1. **Active**: Normal job, visible publicly
2. **Expired**: Hidden from public, visible in admin
3. **Deleted**: Permanently removed from database

### Operations:

#### Expire
- Sets `expiredAt` to current date
- Job remains in database
- Can be reactivated later
- Excluded from duplicate checks

#### Reactivate
- Sets `expiredAt` to null
- Makes job visible again
- Available for expired jobs only

#### Delete
- **PERMANENT** - removes from database
- Requires double confirmation (popup + type "DELETE")
- Cleans up orphaned organizations
- Cannot be undone

## Bulk Operations

All bulk operations support multiple job selection:

```javascript
// Expire selected jobs
POST /api/admin/jobs/bulk-expire
Body: { jobIds: ["id1", "id2", ...] }

// Reactivate selected jobs  
POST /api/admin/jobs/bulk-unexpire
Body: { jobIds: ["id1", "id2", ...] }

// Delete selected jobs (with confirmation)
POST /api/admin/jobs/bulk-delete
Body: { jobIds: ["id1", "id2", ...] }
```

## Sorting Options

Available sort fields:
- `datePosted_desc` - Posted Date (Newest) 
- `datePosted_asc` - Posted Date (Oldest)
- `createdAt_desc` - Date Added (Newest) - DEFAULT
- `createdAt_asc` - Date Added (Oldest)
- `title_asc` - Title (A-Z)
- `title_desc` - Title (Z-A)

## Important UI Behaviors

1. **Selection State**: Preserved during operations, cleared after success
2. **Optimistic Updates**: UI updates immediately, then syncs with server
3. **Error Recovery**: Operations can be retried if they fail
4. **Confirmation Dialogs**: Delete requires typing "DELETE" for safety

## Common Tasks

### Adding New Bulk Operation:
1. Create API route in `/api/admin/jobs/bulk-[action]/`
2. Add handler function in `jobs-management-client.tsx`
3. Add button to bulk actions bar
4. Handle optimistic UI updates

### Adding New Sort Option:
1. Add to `sortByOptions` array in client component
2. Ensure field exists in Prisma schema
3. Handle in `page.tsx` orderBy logic

## Best Practices

1. **Always confirm destructive actions** (delete)
2. **Show operation counts** in success messages
3. **Handle race conditions** in bulk operations
4. **Preserve user context** (filters, sort) after operations
5. **Provide clear visual feedback** for selected items