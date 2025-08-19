# Remarcable Jobs

A comprehensive job aggregation and management platform built with Next.js, featuring advanced search capabilities powered by RapidAPI's job search endpoints.

## Features

### 🔍 Advanced Job Search
- **Boolean Search Operators**: Use AND, OR, NOT operators for precise job searches
- **AI-Powered Filters**: Leverage AI to detect employment types, experience levels, and work arrangements
- **LinkedIn Integration**: Filter by company size, industry, and LinkedIn-specific attributes
- **Smart Exclusions**: Exclude specific companies, job boards, or title keywords

### 📊 Data Management
- **Organization Tracking**: Automatically extract and manage company information
- **Job Deduplication**: Intelligent duplicate detection system
- **Fetch Logging**: Comprehensive logging of all API interactions
- **Batch Processing**: Efficient handling of large job datasets

### 🎯 Query Management
- **Saved Queries**: Create and save complex search queries for reuse
- **Scheduled Fetching**: Automated job fetching with configurable schedules
- **Query Testing**: Test queries before saving to ensure desired results
- **Job Selection**: Selective saving of search results

## Tech Stack

- **Frontend**: Next.js 15.4, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (easily switchable to PostgreSQL/MySQL)
- **API Integration**: RapidAPI Job Search endpoints
- **Authentication**: NextAuth.js

## Project Structure

```
remarcable-jobs/
├── app/
│   └── nextjs-app/
│       ├── app/              # Next.js app directory
│       │   ├── admin/         # Admin dashboard pages
│       │   ├── api/           # API routes
│       │   └── auth/          # Authentication pages
│       ├── components/        # Reusable React components
│       ├── lib/              # Utility libraries
│       │   └── fantastic-jobs/ # RapidAPI client
│       ├── prisma/           # Database schema and migrations
│       └── public/           # Static assets
├── plan.md                   # Project planning document
└── sample-response.json      # API response examples
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- RapidAPI account with access to job search API

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/remarcable-jobs.git
cd remarcable-jobs
```

2. Install dependencies:
```bash
cd app/nextjs-app
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
RAPIDAPI_KEY="your-rapidapi-key"
RAPIDAPI_HOST="active-jobs-db.p.rapidapi.com"
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Key Features Implementation

### Advanced Search Filters

The platform supports comprehensive RapidAPI parameters including:

- **Basic Search**: Query, title, company, location, country
- **Advanced Filters**: Boolean operators for complex searches
- **AI Filters**: Employment type, work arrangement, salary info, visa sponsorship
- **LinkedIn Filters**: Company size, industry, specialties
- **Pagination**: Flexible limit/offset controls

### Query Builder

The `QueryBuilder` class provides a fluent interface for constructing API queries:

```typescript
const query = new QueryBuilder()
  .titleFilter("Senior Engineer")
  .locationFilter("San Francisco")
  .remote(true)
  .aiEmploymentTypeFilter(["FULL_TIME"])
  .build();
```

## API Endpoints

### Admin API
- `GET /api/admin/queries` - List all saved queries
- `POST /api/admin/queries` - Create new query
- `PUT /api/admin/queries/[id]` - Update existing query
- `DELETE /api/admin/queries/[id]` - Delete query
- `POST /api/admin/queries/[id]/execute` - Execute saved query

### Public API (v1)
- `GET /api/v1/jobs` - Search jobs with filters
- `GET /api/v1/organizations` - List organizations
- `GET /api/v1/stats` - Platform statistics

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Database Management
```bash
# Create migration
npx prisma migrate dev --name your-migration-name

# View database
npx prisma studio
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Job data powered by [RapidAPI](https://rapidapi.com/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)