# Multi-Job-Board Platform Architecture

## Overview

This document outlines the architecture for a scalable multi-job-board platform built on Next.js 15, supporting multiple branded job boards from a single codebase with shared job data and board-specific customizations.

## Core Architecture Principles

1. **Single Codebase, Multiple Deployments**: One repository serving multiple job boards through environment-based configuration
2. **Direct Database Access**: Server Components with Prisma, eliminating unnecessary API layers
3. **Shared Data, Board-Specific Presentation**: Centralized job database with board-specific filtering and display
4. **Progressive Enhancement**: Start with 3-4 boards, scale to dozens without architectural changes

## Project Structure

```
remarcablejobs/
├── app/
│   ├── (admin)/                 # Admin panel (separate deployment)
│   │   ├── layout.tsx          # Admin layout with auth
│   │   ├── admin/              # Existing admin pages
│   │   └── api/                # Admin API endpoints
│   │
│   ├── (boards)/               # Job boards (shared code)
│   │   ├── layout.tsx         # Dynamic board layout
│   │   ├── [boardSlug]/       # Board-specific routing
│   │   │   ├── page.tsx       # Board homepage
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx   # Job listings
│   │   │   │   └── [id]/      # Job details
│   │   │   ├── post-job/      # Paid listing flow
│   │   │   ├── companies/     # Company directory
│   │   │   ├── blog/          # Board blog
│   │   │   └── candidates/    # Candidate profiles
│   │   └── components/        # Shared board components
│   │
│   ├── api/
│   │   └── v1/                # Public API (keep for external access)
│   │       ├── jobs/
│   │       ├── boards/
│   │       └── webhooks/      # Stripe, etc.
│   │
│   └── (auth)/                # Authentication pages
│       ├── login/
│       └── signup/
│
├── lib/
│   ├── db/
│   │   ├── prisma.ts         # Prisma client
│   │   └── queries/          # Reusable database queries
│   │
│   ├── services/             # Business logic
│   │   ├── job-board.ts      # Board-specific operations
│   │   ├── job-aggregator.ts # Job fetching logic
│   │   ├── payment.ts        # Stripe integration
│   │   └── candidate.ts      # Candidate management
│   │
│   ├── config/
│   │   ├── boards/           # Board configurations
│   │   │   ├── tech-jobs.ts
│   │   │   ├── remote-jobs.ts
│   │   │   └── startup-jobs.ts
│   │   └── get-board-config.ts
│   │
│   └── utils/
│       ├── theme.ts          # Dynamic theming
│       └── seo.ts            # SEO utilities
│
├── components/
│   ├── ui/                   # Shared UI components
│   ├── boards/               # Board-specific components
│   └── admin/                # Admin components
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
│
└── public/
    └── boards/               # Board-specific assets
        ├── tech-jobs/
        ├── remote-jobs/
        └── startup-jobs/
```

## Database Schema Extensions

### New Tables for Multi-Board Support

```prisma
// Existing tables: User, Job, Organization, JobBoard, etc.

model PaidJobListing {
  id                String      @id @default(cuid())
  jobBoardId        String
  jobBoard          JobBoard    @relation(fields: [jobBoardId], references: [id])
  
  // Link to existing job OR custom data
  jobId             String?     // If reusing aggregated job
  job               Job?        @relation(fields: [jobId], references: [id])
  
  // Custom job data (employer-posted)
  title             String?
  description       String?     @db.Text
  companyName       String?
  companyLogo       String?
  location          String?
  remoteType        String?     // remote, hybrid, onsite
  salaryMin         Int?
  salaryMax         Int?
  employmentType    String?
  applicationUrl    String?
  applicationEmail  String?
  
  // Listing metadata
  status            String      @default("draft") // draft, pending_payment, active, expired
  isPremium         Boolean     @default(false)
  isFeatured        Boolean     @default(false)
  featuredUntil     DateTime?
  
  // Payment tracking
  stripeSessionId   String?
  stripePaymentId   String?
  amountPaid        Decimal?
  currency          String?
  
  // Visibility
  publishedAt       DateTime?
  expiresAt         DateTime
  viewCount         Int         @default(0)
  applicationCount  Int         @default(0)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([jobBoardId, status])
  @@index([expiresAt])
}

model CandidateProfile {
  id                String      @id @default(cuid())
  userId            String      @unique
  user              User        @relation(fields: [userId], references: [id])
  
  // Profile data
  headline          String?
  bio               String?     @db.Text
  resumeUrl         String?
  linkedinUrl       String?
  githubUrl         String?
  portfolioUrl      String?
  
  // Professional info
  skills            String[]
  experience        Json?       // Array of experience objects
  education         Json?       // Array of education objects
  certifications    String[]
  
  // Preferences
  desiredRoles      String[]
  desiredLocations  String[]
  remotePreference  String?     // remote, hybrid, onsite, any
  salaryExpectation Json?       // {min, max, currency}
  availability      String?     // immediate, 2weeks, 1month, etc.
  
  // Privacy
  isPublic          Boolean     @default(false)
  hideFromCompanies String[]    // Company IDs to hide from
  
  // Board-specific profiles
  boardProfiles     BoardCandidateProfile[]
  applications      JobApplication[]
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

model BoardCandidateProfile {
  id                String      @id @default(cuid())
  candidateId       String
  candidate         CandidateProfile @relation(fields: [candidateId], references: [id])
  jobBoardId        String
  jobBoard          JobBoard    @relation(fields: [jobBoardId], references: [id])
  
  // Board-specific settings
  isVisible         Boolean     @default(true)
  customBio         String?     @db.Text
  featured          Boolean     @default(false)
  featuredUntil     DateTime?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@unique([candidateId, jobBoardId])
  @@index([jobBoardId, isVisible])
}

model JobApplication {
  id                String      @id @default(cuid())
  candidateId       String
  candidate         CandidateProfile @relation(fields: [candidateId], references: [id])
  
  // Can apply to either aggregated or paid job
  jobId             String?
  job               Job?        @relation(fields: [jobId], references: [id])
  paidListingId     String?
  paidListing       PaidJobListing? @relation(fields: [paidListingId], references: [id])
  
  coverLetter       String?     @db.Text
  status            String      @default("submitted") // submitted, viewed, shortlisted, rejected
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([candidateId])
  @@index([jobId])
  @@index([paidListingId])
}

model BlogPost {
  id                String      @id @default(cuid())
  jobBoardId        String
  jobBoard          JobBoard    @relation(fields: [jobBoardId], references: [id])
  
  slug              String
  title             String
  content           String      @db.Text
  excerpt           String?
  coverImage        String?
  
  authorId          String
  author            User        @relation(fields: [authorId], references: [id])
  
  categories        String[]
  tags              String[]
  
  status            String      @default("draft") // draft, published, archived
  publishedAt       DateTime?
  viewCount         Int         @default(0)
  
  // SEO
  metaTitle         String?
  metaDescription   String?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@unique([jobBoardId, slug])
  @@index([jobBoardId, status])
}

model BoardSettings {
  id                String      @id @default(cuid())
  jobBoardId        String      @unique
  jobBoard          JobBoard    @relation(fields: [jobBoardId], references: [id])
  
  // Display settings
  theme             Json        // {primaryColor, secondaryColor, fonts, etc.}
  customCss         String?     @db.Text
  logo              String?
  favicon           String?
  
  // Features
  features          Json        // {paidListings: true, candidates: true, blog: true}
  
  // Pricing (for paid listings)
  pricingTiers      Json?       // Array of {name, price, duration, features}
  stripePublicKey   String?
  stripeSecretKey   String?     // Encrypted
  
  // SEO & Meta
  metaTitle         String?
  metaDescription   String?
  ogImage           String?
  twitterHandle     String?
  
  // Content
  headerHtml        String?     @db.Text
  footerHtml        String?     @db.Text
  sidebarContent    String?     @db.Text
  
  // Email settings
  emailFrom         String?
  emailReplyTo      String?
  
  // Analytics
  googleAnalyticsId String?
  plausibleDomain   String?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

## Service Layer Architecture

### JobBoardService - Core Business Logic

```typescript
// lib/services/job-board.ts
import { prisma } from '@/lib/db/prisma'
import { cache } from 'react'

export class JobBoardService {
  constructor(private boardSlug: string) {}

  // Cache at request level
  getBoard = cache(async () => {
    return prisma.jobBoard.findUnique({
      where: { slug: this.boardSlug },
      include: { settings: true }
    })
  })

  async getJobs(params: {
    page?: number
    limit?: number
    location?: string
    remote?: boolean
    search?: string
  }) {
    const board = await this.getBoard()
    if (!board) throw new Error('Board not found')

    // Get both aggregated and paid jobs
    const [aggregatedJobs, paidListings] = await Promise.all([
      this.getAggregatedJobs(board.id, params),
      this.getPaidListings(board.id, params)
    ])

    // Merge and sort by featured/date
    return this.mergeAndSortJobs(aggregatedJobs, paidListings)
  }

  private async getAggregatedJobs(boardId: string, filters: any) {
    return prisma.job.findMany({
      where: {
        jobBoards: {
          some: { jobBoardId: boardId }
        },
        expiredAt: null,
        ...this.buildJobFilters(filters)
      },
      include: {
        organization: true,
        jobBoards: {
          where: { jobBoardId: boardId }
        }
      },
      orderBy: { datePosted: 'desc' },
      take: filters.limit || 20,
      skip: ((filters.page || 1) - 1) * (filters.limit || 20)
    })
  }

  private async getPaidListings(boardId: string, filters: any) {
    return prisma.paidJobListing.findMany({
      where: {
        jobBoardId: boardId,
        status: 'active',
        expiresAt: { gte: new Date() },
        ...this.buildPaidListingFilters(filters)
      },
      include: {
        job: { include: { organization: true } }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { publishedAt: 'desc' }
      ]
    })
  }

  async createPaidListing(data: CreatePaidListingInput) {
    // Implementation for creating paid listings with Stripe
  }

  async getStats() {
    const board = await this.getBoard()
    if (!board) throw new Error('Board not found')

    const [jobCount, companyCount, recentJobs] = await Promise.all([
      prisma.jobBoardJob.count({ where: { jobBoardId: board.id } }),
      prisma.jobBoardOrganization.count({ where: { jobBoardId: board.id } }),
      prisma.job.count({
        where: {
          jobBoards: { some: { jobBoardId: board.id } },
          datePosted: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ])

    return { jobCount, companyCount, recentJobs }
  }
}
```

## Board Configuration System

### Board Configuration Files

```typescript
// lib/config/boards/tech-jobs.ts
import { BoardConfig } from '@/types/board'

export const techJobsConfig: BoardConfig = {
  slug: 'tech-jobs',
  name: 'Tech Jobs Board',
  domain: 'techboard.com',
  
  theme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    fontFamily: 'Inter',
    borderRadius: '8px',
  },
  
  features: {
    paidListings: true,
    candidateProfiles: true,
    blog: true,
    companies: true,
    emailAlerts: true,
  },
  
  seo: {
    title: 'Tech Jobs - Find Your Next Tech Role',
    description: 'Discover the latest tech jobs from top companies',
    ogImage: '/boards/tech-jobs/og-image.png',
  },
  
  pricing: {
    basic: {
      name: 'Basic Listing',
      price: 99,
      duration: 30,
      features: ['30 day listing', 'Company logo', 'Direct applications'],
    },
    featured: {
      name: 'Featured Listing',
      price: 299,
      duration: 30,
      features: ['30 day listing', 'Featured badge', 'Top placement', 'Weekly bumps'],
    },
  },
  
  categories: [
    'Frontend', 'Backend', 'Full Stack', 'DevOps', 
    'Data Science', 'Mobile', 'AI/ML', 'Security'
  ],
}
```

### Dynamic Board Configuration Loader

```typescript
// lib/config/get-board-config.ts
import { cache } from 'react'
import { prisma } from '@/lib/db/prisma'

// Import all board configs
const boardConfigs = {
  'tech-jobs': () => import('./boards/tech-jobs'),
  'remote-jobs': () => import('./boards/remote-jobs'),
  'startup-jobs': () => import('./boards/startup-jobs'),
}

export const getBoardConfig = cache(async (slugOrDomain: string) => {
  // First, try to get from database (for dynamic settings)
  const board = await prisma.jobBoard.findFirst({
    where: {
      OR: [
        { slug: slugOrDomain },
        { domain: slugOrDomain }
      ]
    },
    include: { settings: true }
  })
  
  if (!board) return null
  
  // Load static config
  const configModule = await boardConfigs[board.slug]?.()
  const staticConfig = configModule?.default || configModule?.[`${board.slug}Config`]
  
  // Merge static config with database settings
  return {
    ...staticConfig,
    ...board,
    theme: {
      ...staticConfig?.theme,
      ...board.settings?.theme,
    },
    features: {
      ...staticConfig?.features,
      ...board.settings?.features,
    },
  }
})
```

## Deployment Strategy

### GitHub-Based Vercel Deployment (Recommended)

The recommended approach is to use GitHub-based deployment with multiple Vercel projects pointing to the same repository:

1. **Single GitHub Repository** → Multiple Vercel Projects
2. **Each Vercel project** has different environment variables
3. **Automatic deployments** on push to main
4. **Preview deployments** for every PR

Benefits:
- No configuration files needed in repo
- Automatic CI/CD pipeline
- Easy rollbacks
- Team collaboration
- Preview URLs for testing

See `DEPLOYMENT-GITHUB.md` for detailed setup instructions.

### Environment Variables per Board

```env
# .env.techboard
NEXT_PUBLIC_BOARD_SLUG=tech-jobs
NEXT_PUBLIC_BOARD_DOMAIN=techboard.com
NEXT_PUBLIC_BOARD_NAME="Tech Jobs Board"
DATABASE_URL=postgresql://...
STRIPE_PUBLIC_KEY=pk_live_tech_...
STRIPE_SECRET_KEY=sk_live_tech_...
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=techboard.com

# .env.remoteboard
NEXT_PUBLIC_BOARD_SLUG=remote-jobs
NEXT_PUBLIC_BOARD_DOMAIN=remoteboard.com
NEXT_PUBLIC_BOARD_NAME="Remote Jobs Board"
DATABASE_URL=postgresql://... # Same database
STRIPE_PUBLIC_KEY=pk_live_remote_...
STRIPE_SECRET_KEY=sk_live_remote_...
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=remoteboard.com
```

### Vercel Configuration

```json
// vercel.techboard.json
{
  "name": "tech-jobs-board",
  "alias": ["techboard.com", "www.techboard.com"],
  "env": {
    "NEXT_PUBLIC_BOARD_SLUG": "tech-jobs"
  },
  "buildCommand": "npm run build:board",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "functions": {
    "app/api/v1/jobs/route.ts": {
      "maxDuration": 10
    }
  }
}
```

### Deployment Scripts

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "dev:tech": "NEXT_PUBLIC_BOARD_SLUG=tech-jobs next dev",
    "dev:remote": "NEXT_PUBLIC_BOARD_SLUG=remote-jobs next dev",
    
    "build": "prisma generate && next build",
    "build:board": "prisma generate && next build",
    
    "deploy:tech": "vercel --prod -c vercel.techboard.json",
    "deploy:remote": "vercel --prod -c vercel.remoteboard.json",
    "deploy:startup": "vercel --prod -c vercel.startupboard.json",
    "deploy:admin": "vercel --prod -c vercel.admin.json",
    
    "deploy:all": "npm run deploy:tech && npm run deploy:remote && npm run deploy:startup && npm run deploy:admin"
  }
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Extend database schema with new tables
- [ ] Create board configuration system
- [ ] Set up service layer architecture
- [ ] Implement dynamic theming system
- [ ] Create base board layout component

### Phase 2: Board Routing & Display (Week 1-2)
- [ ] Implement `[boardSlug]` routing
- [ ] Create job listing pages with Server Components
- [ ] Build job detail pages
- [ ] Add company directory
- [ ] Implement search and filtering

### Phase 3: Paid Listings (Week 2-3)
- [ ] Integrate Stripe for payments
- [ ] Build employer posting flow
- [ ] Create listing management dashboard
- [ ] Implement featured/premium job display
- [ ] Add email notifications

### Phase 4: Candidate Features (Week 3-4)
- [ ] Build candidate registration
- [ ] Create profile management
- [ ] Implement job applications
- [ ] Add saved jobs functionality
- [ ] Build candidate dashboard

### Phase 5: Content & Blog (Week 4)
- [ ] Create blog system
- [ ] Build blog editor for admins
- [ ] Add static pages support
- [ ] Implement SEO optimizations
- [ ] Add sitemap generation

### Phase 6: Analytics & Optimization (Week 5)
- [ ] Add view tracking
- [ ] Implement analytics dashboard
- [ ] Optimize performance
- [ ] Add caching layers
- [ ] Set up monitoring

## Performance Optimizations

### Caching Strategy

```typescript
// Use React cache for request-level caching
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

// Request-level cache (dedupes within single request)
export const getBoardJobs = cache(async (boardSlug: string) => {
  return jobBoardService.getJobs()
})

// Long-term cache with revalidation
export const getCachedBoardJobs = unstable_cache(
  async (boardSlug: string) => {
    return jobBoardService.getJobs()
  },
  ['board-jobs'],
  {
    revalidate: 300, // 5 minutes
    tags: [`board-${boardSlug}`]
  }
)
```

### Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_job_boards_jobs ON job_board_job(job_board_id, created_at DESC);
CREATE INDEX idx_paid_listings_active ON paid_job_listing(job_board_id, status, expires_at);
CREATE INDEX idx_jobs_search ON job USING gin(to_tsvector('english', title || ' ' || description_text));
```

## Security Considerations

1. **API Authentication**: Keep bearer token auth for external API access
2. **Payment Security**: Use Stripe's secure payment flow, never store card details
3. **Data Isolation**: Ensure board-specific data cannot leak between boards
4. **Rate Limiting**: Implement rate limiting on public endpoints
5. **Input Validation**: Use Zod schemas for all user inputs

## Monitoring & Analytics

### Key Metrics to Track

- Jobs posted per board
- Page views and unique visitors
- Application conversion rates
- Revenue from paid listings
- API usage and performance
- Search queries and patterns

### Recommended Tools

- **Analytics**: Plausible or PostHog (privacy-focused)
- **Monitoring**: Vercel Analytics + Sentry
- **Database**: Prisma Pulse for real-time monitoring
- **Uptime**: Better Uptime or Uptime Robot

## Future Enhancements

1. **Email Alerts**: Job alert system for candidates
2. **ATS Integration**: Connect with popular ATS systems
3. **Mobile Apps**: React Native apps per board
4. **AI Features**: Job matching, resume parsing
5. **White Label**: Allow customers to create their own boards
6. **API Marketplace**: Sell API access to job data

## Conclusion

This architecture provides a solid foundation for building and scaling multiple job boards from a single codebase. The key principles of code reuse, direct database access, and environment-based configuration ensure maintainability while allowing for board-specific customization.

Start with Phase 1 and iterate based on user feedback. The modular design allows for easy addition of new features without disrupting existing functionality.