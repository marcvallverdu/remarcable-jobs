'use client';

import { useState } from 'react';
import Link from 'next/link';

type EndpointSection = 'jobs' | 'organizations' | 'boards' | 'stats';

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState<EndpointSection>('jobs');
  const [baseUrl, setBaseUrl] = useState('https://yoursite.com');

  const sections = [
    { id: 'jobs' as const, label: 'Jobs' },
    { id: 'organizations' as const, label: 'Organizations' },
    { id: 'boards' as const, label: 'Job Boards' },
    { id: 'stats' as const, label: 'Statistics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700">
                ← Home
              </Link>
              <nav className="flex gap-6">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                  Admin Panel
                </Link>
                <Link href="/admin/boards" className="text-gray-600 hover:text-gray-900">
                  Manage Boards
                </Link>
                <span className="text-gray-900 font-medium">
                  API Docs
                </span>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
          <p className="mt-2 text-gray-600">
            Complete reference for the Job Board API v1. All endpoints are publicly accessible and return JSON responses.
          </p>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">Base URL:</span>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="px-2 py-1 text-sm border rounded"
                placeholder="https://yoursite.com"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Endpoints</h2>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {activeSection === 'jobs' && (
              <>
                <EndpointCard
                  method="GET"
                  path="/api/v1/jobs"
                  title="List Jobs"
                  description="Retrieve a paginated list of active jobs with optional filtering"
                  queryParams={[
                    { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
                    { name: 'limit', type: 'number', required: false, description: 'Items per page (max: 100, default: 20)' },
                    { name: 'boardSlug', type: 'string', required: false, description: 'Filter by job board slug' },
                    { name: 'location', type: 'string', required: false, description: 'Filter by city, region, or country' },
                    { name: 'remote', type: 'boolean', required: false, description: 'Filter for remote jobs' },
                    { name: 'employmentType', type: 'string', required: false, description: 'Filter by employment type (full-time, part-time, contract, etc.)' },
                    { name: 'search', type: 'string', required: false, description: 'Search in job title and description' },
                    { name: 'organizationId', type: 'string', required: false, description: 'Filter by organization ID' },
                  ]}
                  responseExample={`{
  "data": [
    {
      "id": "cuid123",
      "externalId": "job-456",
      "title": "Senior Software Engineer",
      "url": "https://example.com/jobs/123",
      "datePosted": "2024-01-15T10:00:00Z",
      "dateCreated": "2024-01-15T10:00:00Z",
      "dateValidThrough": "2024-02-15T10:00:00Z",
      "cities": ["San Francisco", "New York"],
      "counties": [],
      "regions": ["California", "New York"],
      "countries": ["United States"],
      "locationsFull": ["San Francisco, CA, USA", "New York, NY, USA"],
      "isRemote": true,
      "employmentType": ["full-time"],
      "salaryRaw": {
        "min": 150000,
        "max": 200000,
        "currency": "USD",
        "period": "yearly"
      },
      "descriptionText": "We are looking for a senior software engineer...",
      "organization": {
        "id": "org123",
        "name": "Tech Company Inc",
        "logo": "https://example.com/logo.png",
        "domain": "techcompany.com"
      },
      "sourceType": "api",
      "source": "company-website",
      "sourceDomain": "techcompany.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}`}
                  baseUrl={baseUrl}
                />

                <EndpointCard
                  method="GET"
                  path="/api/v1/jobs/search"
                  title="Search Jobs"
                  description="Advanced search with full-text search capabilities"
                  queryParams={[
                    { name: 'q', type: 'string', required: true, description: 'Search query' },
                    { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
                    { name: 'limit', type: 'number', required: false, description: 'Items per page (max: 100, default: 20)' },
                    { name: 'boardSlug', type: 'string', required: false, description: 'Filter by job board slug' },
                  ]}
                  responseExample={`{
  "data": [...],
  "pagination": {...},
  "searchInfo": {
    "query": "react developer",
    "totalResults": 45
  }
}`}
                  baseUrl={baseUrl}
                />

                <EndpointCard
                  method="GET"
                  path="/api/v1/jobs/{id}"
                  title="Get Single Job"
                  description="Retrieve detailed information about a specific job"
                  pathParams={[
                    { name: 'id', type: 'string', required: true, description: 'Job ID' },
                  ]}
                  responseExample={`{
  "id": "cuid123",
  "externalId": "job-456",
  "title": "Senior Software Engineer",
  "url": "https://example.com/jobs/123",
  "datePosted": "2024-01-15T10:00:00Z",
  "dateCreated": "2024-01-15T10:00:00Z",
  "dateValidThrough": "2024-02-15T10:00:00Z",
  "cities": ["San Francisco"],
  "regions": ["California"],
  "countries": ["United States"],
  "locationsFull": ["San Francisco, CA, USA"],
  "timezones": ["America/Los_Angeles"],
  "latitude": [37.7749],
  "longitude": [-122.4194],
  "isRemote": true,
  "employmentType": ["full-time"],
  "salaryRaw": {...},
  "descriptionText": "Full job description...",
  "organization": {
    "id": "org123",
    "name": "Tech Company Inc",
    "logo": "https://example.com/logo.png",
    "domain": "techcompany.com",
    "url": "https://techcompany.com",
    "linkedinUrl": "https://linkedin.com/company/techcompany",
    "linkedinIndustry": "Computer Software"
  }
}`}
                  baseUrl={baseUrl}
                />
              </>
            )}

            {activeSection === 'organizations' && (
              <>
                <EndpointCard
                  method="GET"
                  path="/api/v1/organizations"
                  title="List Organizations"
                  description="Retrieve a paginated list of organizations"
                  queryParams={[
                    { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
                    { name: 'limit', type: 'number', required: false, description: 'Items per page (max: 100, default: 20)' },
                    { name: 'boardSlug', type: 'string', required: false, description: 'Filter by job board slug' },
                    { name: 'search', type: 'string', required: false, description: 'Search in organization name and industry' },
                  ]}
                  responseExample={`{
  "data": [
    {
      "id": "org123",
      "name": "Tech Company Inc",
      "url": "https://techcompany.com",
      "logo": "https://example.com/logo.png",
      "domain": "techcompany.com",
      "linkedinUrl": "https://linkedin.com/company/techcompany",
      "linkedinSlug": "techcompany",
      "linkedinEmployees": 5000,
      "linkedinSize": "1001-5000",
      "linkedinIndustry": "Computer Software",
      "linkedinType": "Public Company",
      "linkedinFoundedDate": "2010",
      "linkedinFollowers": 50000,
      "linkedinHeadquarters": "San Francisco, CA",
      "linkedinSpecialties": ["SaaS", "Cloud Computing", "AI"],
      "linkedinLocations": ["San Francisco", "New York", "London"],
      "linkedinDescription": "Leading technology company...",
      "_count": {
        "jobs": 15
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}`}
                  baseUrl={baseUrl}
                />

                <EndpointCard
                  method="GET"
                  path="/api/v1/organizations/{id}"
                  title="Get Single Organization"
                  description="Retrieve detailed information about a specific organization"
                  pathParams={[
                    { name: 'id', type: 'string', required: true, description: 'Organization ID' },
                  ]}
                  responseExample={`{
  "id": "org123",
  "name": "Tech Company Inc",
  "url": "https://techcompany.com",
  "logo": "https://example.com/logo.png",
  "domain": "techcompany.com",
  "linkedinUrl": "https://linkedin.com/company/techcompany",
  "linkedinSlug": "techcompany",
  "linkedinEmployees": 5000,
  "linkedinSize": "1001-5000",
  "linkedinIndustry": "Computer Software",
  "linkedinType": "Public Company",
  "linkedinFoundedDate": "2010",
  "linkedinFollowers": 50000,
  "linkedinHeadquarters": "San Francisco, CA",
  "linkedinSpecialties": ["SaaS", "Cloud Computing", "AI"],
  "linkedinLocations": ["San Francisco", "New York", "London"],
  "linkedinDescription": "Leading technology company...",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}`}
                  baseUrl={baseUrl}
                />

                <EndpointCard
                  method="GET"
                  path="/api/v1/organizations/{id}/jobs"
                  title="Get Organization Jobs"
                  description="Retrieve all jobs for a specific organization"
                  pathParams={[
                    { name: 'id', type: 'string', required: true, description: 'Organization ID' },
                  ]}
                  queryParams={[
                    { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
                    { name: 'limit', type: 'number', required: false, description: 'Items per page (max: 100, default: 20)' },
                  ]}
                  responseExample={`{
  "data": [...],
  "pagination": {...}
}`}
                  baseUrl={baseUrl}
                />
              </>
            )}

            {activeSection === 'boards' && (
              <EndpointCard
                method="GET"
                path="/api/v1/boards"
                title="List Job Boards"
                description="Retrieve all active job boards"
                queryParams={[
                  { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
                  { name: 'limit', type: 'number', required: false, description: 'Items per page (max: 100, default: 20)' },
                  { name: 'activeOnly', type: 'boolean', required: false, description: 'Only show active boards (default: true)' },
                ]}
                responseExample={`{
  "data": [
    {
      "id": "board123",
      "slug": "remote-work",
      "name": "Remote Work",
      "description": "Jobs that can be done from anywhere",
      "isActive": true,
      "logo": "https://example.com/board-logo.png",
      "primaryColor": "#3B82F6",
      "domain": "remotework.example.com",
      "_count": {
        "jobs": 150,
        "organizations": 45
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}`}
                baseUrl={baseUrl}
              />
            )}

            {activeSection === 'stats' && (
              <EndpointCard
                method="GET"
                path="/api/v1/stats"
                title="Get Statistics"
                description="Retrieve aggregate statistics about jobs and organizations"
                queryParams={[
                  { name: 'boardSlug', type: 'string', required: false, description: 'Filter statistics by job board' },
                ]}
                responseExample={`{
  "totalJobs": 1250,
  "totalOrganizations": 150,
  "jobsByEmploymentType": {
    "full-time": 800,
    "part-time": 200,
    "contract": 150,
    "internship": 100
  },
  "jobsByLocation": {
    "United States": 900,
    "United Kingdom": 200,
    "Canada": 150
  },
  "remoteJobs": 450,
  "recentJobs": 125,
  "topOrganizations": [
    {
      "id": "org123",
      "name": "Tech Company Inc",
      "jobCount": 25
    }
  ],
  "lastUpdated": "2024-01-15T10:00:00Z"
}`}
                baseUrl={baseUrl}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t pt-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">Important Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>All endpoints exclude expired jobs by default (jobs with expiredAt field set)</li>
              <li>Rate limiting may apply - please implement appropriate retry logic</li>
              <li>Dates are returned in ISO 8601 format (UTC timezone)</li>
              <li>Pagination uses page-based navigation with configurable page sizes</li>
              <li>Board filtering requires an active job board with a valid slug</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EndpointCardProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  pathParams?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  queryParams?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responseExample: string;
  baseUrl: string;
}

function EndpointCard({
  method,
  path,
  title,
  description,
  pathParams = [],
  queryParams = [],
  responseExample,
  baseUrl,
}: EndpointCardProps) {
  const [showExample, setShowExample] = useState(false);

  const methodColors = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded ${methodColors[method]}`}>
                {method}
              </span>
              <code className="text-sm font-mono text-gray-900">{path}</code>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
          <button
            onClick={() => setShowExample(!showExample)}
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            {showExample ? 'Hide' : 'Show'} Example
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <code className="text-xs text-gray-700">
            {baseUrl}{path.replace('{id}', ':id')}
          </code>
        </div>
      </div>

      {(pathParams.length > 0 || queryParams.length > 0) && (
        <div className="p-6 border-b">
          {pathParams.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Path Parameters</h4>
              <div className="space-y-2">
                {pathParams.map((param) => (
                  <div key={param.name} className="flex items-start gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{param.name}</code>
                    <div className="flex-1">
                      <span className="text-xs text-gray-600">{param.type}</span>
                      {param.required && (
                        <span className="ml-2 text-xs text-red-600">required</span>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {queryParams.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Query Parameters</h4>
              <div className="space-y-2">
                {queryParams.map((param) => (
                  <div key={param.name} className="flex items-start gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{param.name}</code>
                    <div className="flex-1">
                      <span className="text-xs text-gray-600">{param.type}</span>
                      {param.required && (
                        <span className="ml-2 text-xs text-red-600">required</span>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showExample && (
        <div className="p-6 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Response Example</h4>
          <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            {responseExample}
          </pre>
        </div>
      )}
    </div>
  );
}