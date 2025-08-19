# Production Deployment Guide

## 🔒 Security Audit Results

### ✅ Completed Security Checks

1. **Authentication & Authorization**
   - ✅ All admin routes check for `isAdmin` flag
   - ✅ Session validation on all protected endpoints
   - ✅ Better Auth integration for secure authentication

2. **API Security**
   - ✅ Public API endpoints are read-only
   - ✅ Expired jobs automatically filtered from public APIs
   - ✅ No sensitive data exposed in public endpoints

3. **Database Security**
   - ✅ Using Prisma ORM (prevents SQL injection)
   - ✅ Parameterized queries throughout
   - ✅ No raw SQL queries found

### ⚠️ Security Recommendations

1. **Rate Limiting** - Implement rate limiting for public APIs
2. **CORS Configuration** - Configure CORS for your domain
3. **Headers Security** - Add security headers (CSP, HSTS, etc.)
4. **API Keys** - Consider adding API key authentication for public endpoints
5. **Monitoring** - Set up error tracking and monitoring

## 🚀 Production Deployment Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] PostgreSQL database provisioned
- [ ] Domain name configured
- [ ] SSL certificate ready

### Step 1: Environment Setup

Create a `.env.production` file with these variables:

```bash
# Database (Use connection pooling for production)
DATABASE_URL="[REDACTED - Use environment variable from Vercel/hosting dashboard]"

# Authentication
BETTER_AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
BETTER_AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Optional: RapidAPI for job data
RAPIDAPI_KEY="your-rapidapi-key"
RAPIDAPI_HOST="active-jobs-db.p.rapidapi.com"

# Production settings
NODE_ENV="production"
```

**Generate secure secret:**
```bash
openssl rand -base64 32
```

### Step 2: Database Setup

1. **Create Production Database:**
```bash
# Connect to your PostgreSQL server
psql -h your-host -U your-user

# Create database
CREATE DATABASE jobboard_prod;
```

2. **Run Migrations:**
```bash
# Set production database URL
export DATABASE_URL="[your-production-database-url]"

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: Run seed for initial admin user
npx prisma db seed
```

3. **Backup Strategy:**
- Set up automated daily backups
- Test restore procedures
- Keep at least 7 days of backups

### Step 3: Build and Deploy

#### Option A: Vercel Deployment (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Configure Environment Variables:**
- Go to Vercel Dashboard > Settings > Environment Variables
- Add all variables from `.env.production`

4. **Configure Domain:**
- Add custom domain in Vercel Dashboard
- Update DNS records

#### Option B: Self-Hosted (VPS/Docker)

1. **Build Application:**
```bash
npm run build
```

2. **Create Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

3. **Deploy with Docker:**
```bash
docker build -t jobboard .
docker run -p 3000:3000 --env-file .env.production jobboard
```

4. **Use PM2 for Process Management:**
```bash
npm install -g pm2
pm2 start npm --name "jobboard" -- start
pm2 save
pm2 startup
```

### Step 4: Security Hardening

1. **Install Security Packages:**
```bash
npm install helmet rate-limiter-flexible
```

2. **Add to `middleware.ts`:**
```typescript
import { rateLimiter } from './lib/rate-limiter';

export async function middleware(request: NextRequest) {
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/v1')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await rateLimiter.consume(ip);
    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }
}
```

3. **Configure CORS (in `next.config.js`):**
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### Step 5: Monitoring & Maintenance

1. **Set up Monitoring:**
   - Use Vercel Analytics (if on Vercel)
   - Or integrate Sentry for error tracking:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

2. **Set up Logging:**
   - Use structured logging with winston or pino
   - Centralize logs with services like LogDNA or Datadog

3. **Health Checks:**
   Create `/api/health` endpoint:
   ```typescript
   export async function GET() {
     try {
       await prisma.$queryRaw`SELECT 1`;
       return NextResponse.json({ status: 'healthy' });
     } catch {
       return NextResponse.json({ status: 'unhealthy' }, { status: 503 });
     }
   }
   ```

### Step 6: Performance Optimization

1. **Enable ISR for Static Pages:**
```typescript
export const revalidate = 3600; // Revalidate every hour
```

2. **Add Database Indexes:**
```prisma
model Job {
  @@index([datePosted])
  @@index([organizationId])
  @@index([expiredAt])
}
```

3. **Configure Caching:**
   - Use Redis for session storage
   - Cache API responses with appropriate TTL

### Step 7: Backup & Recovery

1. **Database Backups:**
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

2. **Application Backups:**
   - Use Git tags for releases
   - Keep previous versions for rollback

### Step 8: Go Live Checklist

- [ ] SSL certificate installed and working
- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] Admin user created
- [ ] Rate limiting configured
- [ ] CORS configured for your domain
- [ ] Monitoring set up
- [ ] Backup system tested
- [ ] Health check endpoint working
- [ ] Test all critical user flows
- [ ] DNS propagated
- [ ] Custom domain working

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   - Check connection string format
   - Ensure SSL mode is correct
   - Verify network/firewall rules

2. **Build Failures:**
   - Clear `.next` folder
   - Ensure all dependencies are installed
   - Check Node version compatibility

3. **Authentication Issues:**
   - Verify BETTER_AUTH_SECRET is set
   - Check BETTER_AUTH_URL matches your domain
   - Ensure cookies are enabled for your domain

## 📊 Performance Benchmarks

Target metrics for production:
- Page Load: < 2 seconds
- API Response: < 200ms
- Database Queries: < 50ms
- Uptime: > 99.9%

## 🚨 Emergency Procedures

1. **Rollback Procedure:**
```bash
git checkout previous-tag
npm run build
pm2 restart jobboard
```

2. **Database Restore:**
```bash
psql $DATABASE_URL < backup_20240115.sql
```

3. **Emergency Contacts:**
- Database Admin: [contact]
- DevOps Lead: [contact]
- On-call Engineer: [contact]

## 📝 Post-Deployment

1. **Monitor for 24 hours:**
   - Check error logs
   - Monitor performance metrics
   - Watch database connections

2. **Document any issues and resolutions**

3. **Schedule regular maintenance windows**

4. **Set up automated testing for critical paths**

---

## Quick Commands Reference

```bash
# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npx prisma migrate deploy

# Check database connection
npx prisma db pull

# View production logs (PM2)
pm2 logs jobboard

# Restart application (PM2)
pm2 restart jobboard

# Monitor application (PM2)
pm2 monit
```

## Security Contacts

Report security issues to: security@yourdomain.com

Last updated: [Current Date]
Version: 1.0.0