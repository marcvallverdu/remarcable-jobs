# 🚨 Production Database Update Required

## New ApiToken Table Needs to be Created

### Option 1: Via Vercel Dashboard (Recommended)
If you have Vercel connected to your database:

1. **Trigger a redeployment** - Vercel may automatically run migrations
2. Check the deployment logs for migration status

### Option 2: Manual Migration (If Auto-Migration Fails)

Run these commands locally with your production DATABASE_URL:

```bash
# Set your production database URL (get from Neon dashboard)
export DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"

# Generate Prisma Client
npx prisma generate

# Push schema changes to production database
npx prisma db push --skip-generate

# Verify the migration worked
npx prisma db pull
```

### Option 3: Using Neon SQL Editor

If you prefer to run SQL directly in Neon dashboard:

```sql
-- Create ApiToken table
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- Create unique index on token
CREATE UNIQUE INDEX "ApiToken_token_key" ON "ApiToken"("token");

-- Create indexes for performance
CREATE INDEX "ApiToken_token_idx" ON "ApiToken"("token");
CREATE INDEX "ApiToken_userId_idx" ON "ApiToken"("userId");

-- Add foreign key constraint
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
```

## Verification Steps

After running the migration:

1. **Check table exists:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'ApiToken';
   ```

2. **Verify structure:**
   ```sql
   \d "ApiToken"
   ```

3. **Test in production:**
   - Login to admin panel
   - Navigate to API Tokens
   - Try creating a token
   - If successful, the migration worked!

## Important Notes

- The ApiToken table is required for the new API authentication to work
- Without this table, the /admin/api-tokens page will error
- API endpoints will still block requests (secure by default) but tokens can't be created

## Quick Command (Copy & Paste)

Replace `[YOUR_DATABASE_URL]` with your actual Neon connection string:

```bash
DATABASE_URL="[YOUR_DATABASE_URL]" npx prisma db push --skip-generate
```

---

Last Updated: 2025-08-20
Status: **ACTION REQUIRED**