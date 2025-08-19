# 🔧 Vercel Environment Variables Setup

## Critical Environment Variables for Production

Copy and paste these **EXACTLY** into your Vercel dashboard at:
https://vercel.com/[your-username]/[your-project]/settings/environment-variables

### Required Variables:

```
DATABASE_URL
```
Value: Your new Neon PostgreSQL connection string (from Neon dashboard)

```
BETTER_AUTH_SECRET
```
Value: Generate using: `openssl rand -base64 32`
Example: `xGnvL8qB3KD7nh4FjE2wqPRzV6mJc9aYsT5uH0iNbZo=`

```
BETTER_AUTH_URL
```
Value: `https://remarcablejobs.com` (or your actual domain)

```
NEXT_PUBLIC_APP_URL
```
Value: `https://remarcablejobs.com` (or your actual domain)

```
NODE_ENV
```
Value: `production`

```
ENABLE_RATE_LIMITING
```
Value: `true`

### Optional Variables (if using job fetching):

```
RAPIDAPI_KEY
```
Value: Your RapidAPI key (if you have one)

```
RAPIDAPI_HOST
```
Value: `active-jobs-db.p.rapidapi.com`

## Important Notes:

1. **BETTER_AUTH_SECRET** - This MUST be set or authentication will fail silently
2. **BETTER_AUTH_URL** and **NEXT_PUBLIC_APP_URL** - Must match your actual deployment URL
3. Make sure there are no trailing slashes on URLs
4. After adding variables, redeploy your application

## Troubleshooting Login Issues:

1. **Check Browser Console** - Open DevTools (F12) and look for errors
2. **Verify URLs** - Make sure BETTER_AUTH_URL matches your deployment URL exactly
3. **Test Locally** - Try with these in `.env.local`:
   ```
   BETTER_AUTH_SECRET=test-secret-for-local-development
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Check Network Tab** - Look for the `/api/auth/sign-in` request:
   - If it's 404: Auth routes aren't working
   - If it's 500: Database or configuration issue
   - If it times out: URL configuration mismatch

## Quick Debug Steps:

1. Visit: `https://remarcablejobs.com/api/health` - Should return `{"status":"healthy"}`
2. Visit: `https://remarcablejobs.com/api/auth/test` - Should return auth status
3. Check Vercel Function Logs for errors

## After Setting Variables:

1. Go to Vercel Dashboard
2. Trigger a new deployment (or push a commit)
3. Wait for deployment to complete
4. Test login again

---

Last Updated: 2025-08-19