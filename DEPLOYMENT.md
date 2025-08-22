# GitHub-Based Vercel Deployment Guide

## Overview

Deploy multiple job boards from a single GitHub repository using Vercel's GitHub integration. Each board gets its own Vercel project pointing to the same repo with different environment variables.

## Testing Route Isolation Locally

To test how deployments will behave in production:

```bash
# Test admin deployment
NEXT_PUBLIC_DEPLOYMENT_TYPE=admin NODE_ENV=production npm run build && npm run start
# Visit localhost:3000 - you'll be redirected to /admin
# Try /boards/tech-jobs - you'll get blocked

# Test board deployment
NEXT_PUBLIC_DEPLOYMENT_TYPE=board NEXT_PUBLIC_BOARD_SLUG=tech-jobs NODE_ENV=production npm run build && npm run start
# Visit localhost:3000 - you'll be redirected to /boards/tech-jobs
# Try /admin - you'll get 404
# Try /boards/remote-jobs - you'll get 404
```

## Initial Setup

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Add job board functionality"
git push origin main
```

### 2. Create Vercel Projects

For each job board and admin panel, create a separate Vercel project:

#### A. Admin Panel Deployment

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - **Project Name:** `remarcable-admin`
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=https://admin.yourdomain.com
   ```

5. Deploy!

#### B. Job Board Deployment (Repeat for Each Board)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the SAME GitHub repository
3. Configure:
   - **Project Name:** `tech-jobs-board` (or `remote-jobs-board`, etc.)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as is)
   
4. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=https://techboard.com
   
   # Board-specific variables (CRITICAL!)
   NEXT_PUBLIC_BOARD_SLUG=tech-jobs
   NEXT_PUBLIC_BOARD_NAME=Tech Jobs Board
   NEXT_PUBLIC_BASE_URL=https://techboard.com
   ```

5. Add Redirect Rules (in Vercel Project Settings → Redirects):
   ```json
   {
     "source": "/",
     "destination": "/boards/tech-jobs",
     "permanent": false
   }
   ```

6. Deploy!

## Environment Variables per Project

### Admin Panel (`remarcable-admin`)
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<hex-string-secret>
BETTER_AUTH_URL=https://admin.yourdomain.com
NEXT_PUBLIC_DEPLOYMENT_TYPE=admin
# This ensures only admin routes are accessible
# Admin sessions expire after 4 hours for security
# Session cookie name: admin-auth-session
```

### Tech Jobs Board (`tech-jobs-board`)
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<hex-string-secret>  # Can be same as admin
BETTER_AUTH_URL=https://techboard.com
NEXT_PUBLIC_DEPLOYMENT_TYPE=board
NEXT_PUBLIC_BOARD_SLUG=tech-jobs
NEXT_PUBLIC_BOARD_NAME=Tech Jobs Board
NEXT_PUBLIC_BASE_URL=https://techboard.com
# Board sessions last 30 days
# Session cookie name: board-tech-jobs-session
```

### Remote Jobs Board (`remote-jobs-board`)
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<hex-string-secret>  # Can be same as admin
BETTER_AUTH_URL=https://remoteboard.com
NEXT_PUBLIC_DEPLOYMENT_TYPE=board
NEXT_PUBLIC_BOARD_SLUG=remote-jobs
NEXT_PUBLIC_BOARD_NAME=Remote Jobs Board
NEXT_PUBLIC_BASE_URL=https://remoteboard.com
# Board sessions last 30 days
# Session cookie name: board-remote-jobs-session
```

## Authentication & Session Isolation

### How It Works

1. **Shared User Database**: All deployments share the same user table
2. **Isolated Sessions**: Each deployment uses different session cookies
   - Admin: `admin-auth-session` (4-hour expiry)
   - Tech Board: `board-tech-jobs-session` (30-day expiry)
   - Remote Board: `board-remote-jobs-session` (30-day expiry)

3. **User Types & Access Control**:
   - `isAdmin`: Boolean flag for admin users
   - `userType`: 'admin', 'employer', or 'candidate'
   - `boardAccess`: Array of board slugs user can access

### Security Features

- **Admin sessions expire quickly** (4 hours) for enhanced security
- **Board sessions last longer** (30 days) for user convenience
- **Cross-deployment protection**: Admin login doesn't work on boards
- **Board isolation**: Users on one board can't access another
- **Role verification**: Middleware checks user roles in production

### Generating Auth Secret

Generate a secure hex string for `BETTER_AUTH_SECRET`:
```bash
# Generate a 32-byte hex string
openssl rand -hex 32
```

Use the same secret across all deployments or different ones for complete isolation.

## Custom Domains

### For Each Vercel Project:

1. Go to Project Settings → Domains
2. Add your custom domain:
   - Admin: `admin.yourdomain.com`
   - Tech Board: `techboard.com` and `www.techboard.com`
   - Remote Board: `remoteboard.com` and `www.remoteboard.com`

3. Configure DNS as instructed by Vercel:
   - A record: `76.76.21.21`
   - CNAME for www: `cname.vercel-dns.com`

## Deployment Workflow

### Automatic Deployments

Once connected to GitHub:
- **Push to main** → All projects redeploy automatically
- **Create PR** → Get preview URLs for all projects
- **Merge PR** → Production updates across all boards

### Manual Redeploy

If needed, in Vercel Dashboard:
1. Go to specific project
2. Click "Redeploy"
3. Choose "Redeploy with existing Build Cache" for faster deploys

## Managing Multiple Projects

### Vercel Dashboard Organization

Create a clear naming convention:
```
remarcable-admin          (Admin Panel)
remarcable-board-tech     (Tech Jobs)
remarcable-board-remote   (Remote Jobs)
remarcable-board-startup  (Startup Jobs)
```

### Environment Variable Management

Use Vercel's environment variable UI:
1. Project Settings → Environment Variables
2. Add variables for Production/Preview/Development
3. Use "Copy from another project" feature for common vars

### Monitoring

Each project has separate:
- Analytics
- Function logs  
- Error tracking
- Performance metrics

## Adding a New Board

1. **Create board in admin panel**
   ```
   Slug: designer-jobs
   Name: Designer Jobs Board
   ```

2. **Create new Vercel project**
   - Import same GitHub repo
   - Name: `remarcable-board-designer`
   
3. **Configure environment variables**
   ```env
   NEXT_PUBLIC_BOARD_SLUG=designer-jobs
   NEXT_PUBLIC_BOARD_NAME=Designer Jobs Board
   # Plus all common variables
   ```

4. **Add redirect rule**
   ```json
   {
     "source": "/",
     "destination": "/boards/designer-jobs",
     "permanent": false
   }
   ```

5. **Deploy and configure domain**

## Branch Strategy

### Recommended Git Workflow

```
main (production)
├── develop (staging)
└── feature/[feature-name] (development)
```

### Vercel Configuration

1. **Production:** Deploys from `main`
2. **Preview:** Deploys from all other branches
3. **Ignored Branches:** Configure in Project Settings if needed

## Optimization Tips

### 1. Shared Build Cache
Vercel automatically shares build cache between deployments from the same repo, making subsequent deployments faster.

### 2. Environment Variable Groups
For variables used across all projects:
- Create them in each project
- Use consistent naming
- Consider using Vercel's Team environment variables (Enterprise)

### 3. Deployment Hooks
Create deployment hooks for external triggers:
1. Project Settings → Git → Deploy Hooks
2. Create unique URL for each project
3. Trigger with: `curl -X POST <hook-url>`

## Rollback Strategy

If something goes wrong:
1. Go to Vercel project dashboard
2. Click on "Deployments" tab
3. Find last working deployment
4. Click "..." menu → "Promote to Production"
5. Instant rollback!

## Cost Optimization

### Single Repo Benefits:
- **One GitHub repo** = easier maintenance
- **Shared codebase** = no duplication
- **Vercel pricing** = per-seat, not per-project
- **Build minutes** = shared across team

### Recommended Plan:
- **Hobby:** Good for testing (1-2 boards)
- **Pro:** Production ready (unlimited projects)
- **Enterprise:** Custom domains, SLA, support

## Troubleshooting

### Board Shows Wrong Content
- Check `NEXT_PUBLIC_BOARD_SLUG` in Vercel dashboard
- Ensure it matches slug in database
- Redeploy after changing env vars

### 404 Errors on Routes
- Check redirect rules in Vercel settings
- Verify board is active in database
- Check build logs for errors

### Slow Deployments
- Use "Redeploy with existing Build Cache"
- Check if node_modules is being cached
- Optimize build command if needed

## Security Considerations

1. **Database URL:** Mark as sensitive in Vercel
2. **API Keys:** Use different keys per environment
3. **Preview Deployments:** Consider password protection
4. **Environment Variables:** Never commit to GitHub

## Monitoring Setup

For each Vercel project:
1. Enable Analytics (built-in)
2. Set up Error tracking (Sentry integration)
3. Configure Uptime monitoring (Better Uptime)
4. Add custom logging (Axiom, Logtail)

## Success Checklist

- [ ] GitHub repo connected to multiple Vercel projects
- [ ] Each project has correct environment variables
- [ ] Redirects configured for board projects
- [ ] Custom domains configured and working
- [ ] Automatic deployments working on git push
- [ ] Preview deployments working for PRs
- [ ] Monitoring and analytics enabled

## Next Steps

1. Test with one board first
2. Verify automatic deployments work
3. Add remaining boards one by one
4. Configure custom domains
5. Set up monitoring
6. Document board-specific configurations