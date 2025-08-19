'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import JobSelectionModal from '../job-selection-modal';

// Complete list of parameters from RapidAPI documentation
const API_ENDPOINTS = [
  { value: 'active-ats-7d', label: 'Active ATS - Last 7 Days', path: '/active-ats-7d' },
  { value: 'active-ats-24h', label: 'Active ATS - Last 24 Hours', path: '/active-ats-24h' },
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia',
  'Netherlands', 'Spain', 'Italy', 'Sweden', 'Switzerland', 'India', 'Singapore',
  'Japan', 'Brazil', 'Mexico', 'Ireland', 'Poland', 'Austria', 'Belgium'
];

const EMPLOYMENT_TYPES = [
  'full_time', 'part_time', 'contractor', 'intern', 'temporary'
];

const SENIORITY_LEVELS = [
  'no_experience', 'entry_level', 'associate', 'mid_senior_level', 'director', 'executive'
];

export default function NewQueryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJobModal, setShowJobModal] = useState(false);
  const [fullJobResults, setFullJobResults] = useState<Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    remote?: boolean;
    datePosted?: string;
    isDuplicate?: boolean;
  }>>([]);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    jobCount?: number;
    duplicates?: number;
    newJobs?: number;
    error?: string;
    jobs?: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      remote?: boolean;
      datePosted?: string;
      isDuplicate?: boolean;
    }>;
    totalPages?: number;
    currentPage?: number;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    endpoint: 'active-ats-7d',
    isActive: true,
    parameters: {
      // Basic Search parameters
      query: '',
      title: '',
      company: '',
      location: '',
      country: '',
      
      // Advanced Search parameters
      advanced_title_filter: '',
      advanced_description_filter: '',
      advanced_organization_filter: '',
      
      // Filters
      employment_types: [] as string[],
      seniority_levels: [] as string[],
      remote: '',
      description_type: 'text' as 'text' | 'html',
      source: '',
      
      // Pagination
      limit: 10,
      offset: 0,
      
      // Date filters
      date_posted: '',
      date_filter: '',
      
      // Exclusion filters
      exclude_job_boards: false,
      companies_exclude: '',
      title_exclude: '',
      organization_exclusion_filter: '',
      
      // AI-powered filters (BETA)
      include_ai: false,
      ai_employment_type_filter: '',
      ai_work_arrangement_filter: '',
      ai_has_salary: false,
      ai_experience_level_filter: '',
      ai_visa_sponsorship_filter: false,
      
      // LinkedIn filters
      include_li: false,
      li_organization_slug_filter: '',
      li_organization_slug_exclusion_filter: '',
      li_industry_filter: '',
      li_organization_specialties_filter: '',
      li_organization_description_filter: '',
      li_organization_employees_gte: undefined as number | undefined,
      li_organization_employees_lte: undefined as number | undefined,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create query');
      }

      const data = await response.json();
      router.push(`/admin/queries/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTestQuery = async () => {
    setTestLoading(true);
    setError('');
    setTestResults(null);

    try {
      const response = await fetch('/api/admin/queries/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: formData.endpoint,
          parameters: formData.parameters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test query');
      }

      const data = await response.json();
      setTestResults(data);
      
      // Fetch full job data for modal
      if (data.success && data.jobs) {
        setFullJobResults(data.jobs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setTestLoading(false);
    }
  };

  const handleEmploymentTypeToggle = (type: string) => {
    const types = formData.parameters.employment_types;
    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        employment_types: types.includes(type)
          ? types.filter(t => t !== type)
          : [...types, type],
      },
    });
  };

  const handleSeniorityLevelToggle = (level: string) => {
    const levels = formData.parameters.seniority_levels;
    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        seniority_levels: levels.includes(level)
          ? levels.filter(l => l !== level)
          : [...levels, level],
      },
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Query</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure a job search query using the Active Jobs DB API
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Query Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Senior React Developer Jobs"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="What jobs does this query search for?"
                />
              </div>

              <div>
                <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700">
                  API Endpoint *
                </label>
                <select
                  name="endpoint"
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {API_ENDPOINTS.map((endpoint) => (
                    <option key={endpoint.value} value={endpoint.value}>
                      {endpoint.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select the time range for fetching jobs
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active (Enable scheduled fetching)
                </label>
              </div>
            </div>

            {/* Basic Search Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Search Parameters</h3>
              
              <div>
                <label htmlFor="query" className="block text-sm font-medium text-gray-700">
                  Search Query
                </label>
                <input
                  type="text"
                  name="query"
                  id="query"
                  value={formData.parameters.query}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, query: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., React Developer, Python, Machine Learning"
                />
                <p className="mt-1 text-xs text-gray-500">
                  General search query across job listings
                </p>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.parameters.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, title: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Senior Engineer, Product Manager"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company"
                  id="company"
                  value={formData.parameters.company}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, company: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Google, Microsoft, Apple"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.parameters.location}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, location: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., San Francisco, New York, London"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <select
                  name="country"
                  id="country"
                  value={formData.parameters.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, country: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Countries</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  ATS Source
                </label>
                <input
                  type="text"
                  name="source"
                  id="source"
                  value={formData.parameters.source}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, source: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., greenhouse, lever (comma-separated)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Filter by specific ATS platforms
                </p>
              </div>
            </div>

            {/* Advanced Search Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Advanced Search (with Operators)</h3>
              
              <div>
                <label htmlFor="advanced_title_filter" className="block text-sm font-medium text-gray-700">
                  Advanced Title Filter
                </label>
                <input
                  type="text"
                  name="advanced_title_filter"
                  id="advanced_title_filter"
                  value={formData.parameters.advanced_title_filter}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, advanced_title_filter: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='e.g., "senior engineer" AND (React OR Vue)'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supports AND, OR, NOT operators and quotes for exact phrases
                </p>
              </div>

              <div>
                <label htmlFor="advanced_description_filter" className="block text-sm font-medium text-gray-700">
                  Advanced Description Filter
                </label>
                <textarea
                  name="advanced_description_filter"
                  id="advanced_description_filter"
                  rows={2}
                  value={formData.parameters.advanced_description_filter}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, advanced_description_filter: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='e.g., "5 years experience" AND (Python OR Java) NOT intern'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Advanced search within job descriptions
                </p>
              </div>

              <div>
                <label htmlFor="advanced_organization_filter" className="block text-sm font-medium text-gray-700">
                  Advanced Organization Filter
                </label>
                <input
                  type="text"
                  name="advanced_organization_filter"
                  id="advanced_organization_filter"
                  value={formData.parameters.advanced_organization_filter}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, advanced_organization_filter: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder='e.g., (Google OR Meta) NOT "Google Cloud"'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Advanced organization/company search with operators
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>

              <div>
                <label htmlFor="remote" className="block text-sm font-medium text-gray-700">
                  Remote Work
                </label>
                <select
                  name="remote"
                  id="remote"
                  value={formData.parameters.remote}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, remote: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Remote Only</option>
                  <option value="false">On-site Only</option>
                </select>
              </div>

              <div>
                <label htmlFor="description_type" className="block text-sm font-medium text-gray-700">
                  Description Format
                </label>
                <select
                  name="description_type"
                  id="description_type"
                  value={formData.parameters.description_type}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, description_type: e.target.value as 'text' | 'html' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="text">Plain Text</option>
                  <option value="html">HTML</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Format for job descriptions in the results
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employment Types
                </label>
                <div className="mt-2 space-y-2">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <label key={type} className="inline-flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={formData.parameters.employment_types.includes(type)}
                        onChange={() => handleEmploymentTypeToggle(type)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{type.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Seniority Levels
                </label>
                <div className="mt-2 space-y-2">
                  {SENIORITY_LEVELS.map((level) => (
                    <label key={level} className="inline-flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={formData.parameters.seniority_levels.includes(level)}
                        onChange={() => handleSeniorityLevelToggle(level)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{level.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="date_posted" className="block text-sm font-medium text-gray-700">
                  Date Posted Filter
                </label>
                <select
                  name="date_posted"
                  id="date_posted"
                  value={formData.parameters.date_posted}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, date_posted: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Any time</option>
                  <option value="today">Today</option>
                  <option value="3days">Last 3 days</option>
                  <option value="week">Last week</option>
                  <option value="month">Last month</option>
                </select>
              </div>

              <div>
                <label htmlFor="date_filter" className="block text-sm font-medium text-gray-700">
                  Date Filter (Greater Than)
                </label>
                <input
                  type="date"
                  name="date_filter"
                  id="date_filter"
                  value={formData.parameters.date_filter}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, date_filter: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Only show jobs posted after this date
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="exclude_job_boards"
                  checked={formData.parameters.exclude_job_boards}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, exclude_job_boards: e.target.checked }
                  })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="exclude_job_boards" className="ml-2 block text-sm text-gray-900">
                  Exclude job board aggregators
                </label>
              </div>
            </div>

            {/* AI-Powered Filters (BETA) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                AI-Powered Filters <span className="text-sm font-normal text-gray-500">(BETA)</span>
              </h3>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include_ai"
                  checked={formData.parameters.include_ai}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, include_ai: e.target.checked }
                  })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="include_ai" className="ml-2 block text-sm text-gray-900">
                  Enable AI-powered insights and filters
                </label>
              </div>

              {formData.parameters.include_ai && (
                <>
                  <div>
                    <label htmlFor="ai_employment_type_filter" className="block text-sm font-medium text-gray-700">
                      AI Employment Type Filter
                    </label>
                    <input
                      type="text"
                      name="ai_employment_type_filter"
                      id="ai_employment_type_filter"
                      value={formData.parameters.ai_employment_type_filter}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, ai_employment_type_filter: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="FULL_TIME,PART_TIME,CONTRACT,INTERNSHIP,TEMPORARY"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Comma-separated employment types detected by AI
                    </p>
                  </div>

                  <div>
                    <label htmlFor="ai_work_arrangement_filter" className="block text-sm font-medium text-gray-700">
                      AI Work Arrangement Filter
                    </label>
                    <input
                      type="text"
                      name="ai_work_arrangement_filter"
                      id="ai_work_arrangement_filter"
                      value={formData.parameters.ai_work_arrangement_filter}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, ai_work_arrangement_filter: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="On-site,Hybrid,Remote OK,Remote"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Comma-separated work arrangements
                    </p>
                  </div>

                  <div>
                    <label htmlFor="ai_experience_level_filter" className="block text-sm font-medium text-gray-700">
                      AI Experience Level Filter
                    </label>
                    <input
                      type="text"
                      name="ai_experience_level_filter"
                      id="ai_experience_level_filter"
                      value={formData.parameters.ai_experience_level_filter}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, ai_experience_level_filter: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="0-2,2-5,5-10,10+"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Years of experience (comma-separated ranges)
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ai_has_salary"
                      checked={formData.parameters.ai_has_salary}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, ai_has_salary: e.target.checked }
                      })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="ai_has_salary" className="ml-2 block text-sm text-gray-900">
                      Only show jobs with salary information
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ai_visa_sponsorship_filter"
                      checked={formData.parameters.ai_visa_sponsorship_filter}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, ai_visa_sponsorship_filter: e.target.checked }
                      })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="ai_visa_sponsorship_filter" className="ml-2 block text-sm text-gray-900">
                      Only show jobs with visa sponsorship
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* LinkedIn Filters */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">LinkedIn-Specific Filters</h3>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include_li"
                  checked={formData.parameters.include_li}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, include_li: e.target.checked }
                  })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="include_li" className="ml-2 block text-sm text-gray-900">
                  Enable LinkedIn-specific filters
                </label>
              </div>

              {formData.parameters.include_li && (
                <>
                  <div>
                    <label htmlFor="li_organization_slug_filter" className="block text-sm font-medium text-gray-700">
                      LinkedIn Organization Slugs (Include)
                    </label>
                    <input
                      type="text"
                      name="li_organization_slug_filter"
                      id="li_organization_slug_filter"
                      value={formData.parameters.li_organization_slug_filter}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, li_organization_slug_filter: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="google,microsoft,meta (comma-separated)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      LinkedIn company URL slugs to include
                    </p>
                  </div>

                  <div>
                    <label htmlFor="li_organization_slug_exclusion_filter" className="block text-sm font-medium text-gray-700">
                      LinkedIn Organization Slugs (Exclude)
                    </label>
                    <input
                      type="text"
                      name="li_organization_slug_exclusion_filter"
                      id="li_organization_slug_exclusion_filter"
                      value={formData.parameters.li_organization_slug_exclusion_filter}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, li_organization_slug_exclusion_filter: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="amazon,oracle (comma-separated)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      LinkedIn company URL slugs to exclude
                    </p>
                  </div>

                  <div>
                    <label htmlFor="li_industry_filter" className="block text-sm font-medium text-gray-700">
                      LinkedIn Industries
                    </label>
                    <input
                      type="text"
                      name="li_industry_filter"
                      id="li_industry_filter"
                      value={formData.parameters.li_industry_filter}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, li_industry_filter: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Software Development,Financial Services (comma-separated)"
                    />
                  </div>

                  <div>
                    <label htmlFor="li_organization_specialties_filter" className="block text-sm font-medium text-gray-700">
                      Organization Specialties Filter
                    </label>
                    <input
                      type="text"
                      name="li_organization_specialties_filter"
                      id="li_organization_specialties_filter"
                      value={formData.parameters.li_organization_specialties_filter}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, li_organization_specialties_filter: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder='e.g., "machine learning" OR "artificial intelligence"'
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Search within company specialties
                    </p>
                  </div>

                  <div>
                    <label htmlFor="li_organization_description_filter" className="block text-sm font-medium text-gray-700">
                      Organization Description Filter
                    </label>
                    <input
                      type="text"
                      name="li_organization_description_filter"
                      id="li_organization_description_filter"
                      value={formData.parameters.li_organization_description_filter}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: { ...formData.parameters, li_organization_description_filter: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder='e.g., "Fortune 500" AND technology'
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Search within company descriptions
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="li_organization_employees_gte" className="block text-sm font-medium text-gray-700">
                        Min Employees
                      </label>
                      <input
                        type="number"
                        name="li_organization_employees_gte"
                        id="li_organization_employees_gte"
                        value={formData.parameters.li_organization_employees_gte || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: { 
                            ...formData.parameters, 
                            li_organization_employees_gte: e.target.value ? parseInt(e.target.value) : undefined 
                          }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g., 100"
                      />
                    </div>

                    <div>
                      <label htmlFor="li_organization_employees_lte" className="block text-sm font-medium text-gray-700">
                        Max Employees
                      </label>
                      <input
                        type="number"
                        name="li_organization_employees_lte"
                        id="li_organization_employees_lte"
                        value={formData.parameters.li_organization_employees_lte || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: { 
                            ...formData.parameters, 
                            li_organization_employees_lte: e.target.value ? parseInt(e.target.value) : undefined 
                          }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g., 10000"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Exclusions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Exclusions</h3>

              <div>
                <label htmlFor="companies_exclude" className="block text-sm font-medium text-gray-700">
                  Exclude Companies
                </label>
                <input
                  type="text"
                  name="companies_exclude"
                  id="companies_exclude"
                  value={formData.parameters.companies_exclude}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, companies_exclude: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Comma-separated list of companies to exclude"
                />
              </div>

              <div>
                <label htmlFor="organization_exclusion_filter" className="block text-sm font-medium text-gray-700">
                  Organization Exclusion Filter
                </label>
                <input
                  type="text"
                  name="organization_exclusion_filter"
                  id="organization_exclusion_filter"
                  value={formData.parameters.organization_exclusion_filter}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, organization_exclusion_filter: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Exact organization names to exclude (comma-separated)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Exact match organization names to exclude from results
                </p>
              </div>

              <div>
                <label htmlFor="title_exclude" className="block text-sm font-medium text-gray-700">
                  Exclude Title Keywords
                </label>
                <input
                  type="text"
                  name="title_exclude"
                  id="title_exclude"
                  value={formData.parameters.title_exclude}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, title_exclude: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., intern, junior (comma-separated)"
                />
              </div>
            </div>

            {/* Pagination */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pagination</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="limit" className="block text-sm font-medium text-gray-700">
                    Results Per Page
                  </label>
                  <input
                    type="number"
                    name="limit"
                    id="limit"
                    min="10"
                    max="100"
                    value={formData.parameters.limit}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: { ...formData.parameters, limit: parseInt(e.target.value) || 10 }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    10-100 results per page
                  </p>
                </div>

                <div>
                  <label htmlFor="offset" className="block text-sm font-medium text-gray-700">
                    Offset
                  </label>
                  <input
                    type="number"
                    name="offset"
                    id="offset"
                    min="0"
                    value={formData.parameters.offset}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: { ...formData.parameters, offset: parseInt(e.target.value) || 0 }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Skip this many results (for pagination)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/queries')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTestQuery}
                disabled={testLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {testLoading ? 'Testing...' : 'Test Query'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Query'}
              </button>
            </div>
          </form>
        </div>

        {/* Test Results Sidebar */}
        <div className="lg:col-span-1">
          {testResults && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test Results</h3>
              
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {testResults.success ? (
                      <span className="text-green-600">✓ Success</span>
                    ) : (
                      <span className="text-red-600">✗ Failed</span>
                    )}
                  </dd>
                </div>

                {testResults.jobCount !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Jobs Found</dt>
                    <dd className="mt-1 text-sm text-gray-900">{testResults.jobCount}</dd>
                  </div>
                )}

                {testResults.duplicates !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Duplicates</dt>
                    <dd className="mt-1 text-sm text-gray-900">{testResults.duplicates}</dd>
                  </div>
                )}

                {testResults.error && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Error</dt>
                    <dd className="mt-1 text-sm text-red-600">{testResults.error}</dd>
                  </div>
                )}

                {testResults.jobs && testResults.jobs.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">Sample Jobs</dt>
                    <dd className="space-y-2">
                      {testResults.jobs.slice(0, 3).map((job, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                          <div className="font-medium">{job.title}</div>
                          <div className="text-gray-500">{job.company}</div>
                          <div className="text-gray-500">{job.location}</div>
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
              </div>

              {testResults.success && testResults.jobCount && testResults.jobCount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => setShowJobModal(true)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    Select Jobs to Save ({testResults.newJobs || 0} new)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Job Selection Modal */}
      <JobSelectionModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        jobs={fullJobResults}
        onSave={async (selectedJobIds, saveAll) => {
          // For new query, we'll save jobs after creating the query
          setShowJobModal(false);
          
          // Create the query first
          try {
            const response = await fetch('/api/admin/queries', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(formData),
            });

            if (!response.ok) {
              throw new Error('Failed to create query');
            }

            const query = await response.json();
            
            // Now execute the query to save selected jobs
            const executeResponse = await fetch(`/api/admin/queries/${query.id}/execute`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                saveJobs: true,
                selectedJobIds: saveAll ? [] : selectedJobIds,
              }),
            });

            if (!executeResponse.ok) {
              throw new Error('Failed to save jobs');
            }

            const result = await executeResponse.json();
            alert(`Successfully saved ${result.jobsCreated} jobs!`);
            router.push(`/admin/queries/${query.id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
          }
        }}
        queryName={formData.name || 'Test Query'}
      />
    </div>
  );
}