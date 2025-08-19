'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import JobSelectionModal from '../job-selection-modal';

// Constants
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

interface FetchLog {
  id: string;
  status: string;
  jobsFetched: number;
  jobsCreated: number;
  errorMessage: string | null;
  createdAt: Date;
}

interface Query {
  id: string;
  name: string;
  description: string | null;
  parameters: unknown;
  isActive: boolean;
  lastRun: Date | null;
  resultCount: number | null;
  createdAt: Date;
  updatedAt: Date;
  fetchLogs: FetchLog[];
}

export default function EditQueryClient({ query }: { query: Query }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobResults, setJobResults] = useState<Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    remote?: boolean;
    datePosted?: string;
    isDuplicate?: boolean;
  }>>([]);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params = query.parameters as any || {};
  
  const [formData, setFormData] = useState({
    name: query.name,
    description: query.description || '',
    isActive: query.isActive,
    endpoint: params.endpoint || 'active-ats-7d',
    parameters: {
      // Basic Search parameters
      query: params.query || '',
      title: params.title || '',
      company: params.company || '',
      location: params.location || '',
      country: params.country || '',
      
      // Advanced Search parameters
      advanced_title_filter: params.advanced_title_filter || '',
      advanced_description_filter: params.advanced_description_filter || '',
      advanced_organization_filter: params.advanced_organization_filter || '',
      
      // Filters
      employment_types: params.employment_types || [],
      seniority_levels: params.seniority_levels || [],
      remote: params.remote || '',
      description_type: params.description_type || 'text',
      source: params.source || '',
      
      // Pagination
      limit: params.limit || 10,
      offset: params.offset || 0,
      
      // Date filters
      date_posted: params.date_posted || '',
      date_filter: params.date_filter || '',
      
      // Exclusion filters
      exclude_job_boards: params.exclude_job_boards || false,
      companies_exclude: params.companies_exclude || '',
      title_exclude: params.title_exclude || '',
      organization_exclusion_filter: params.organization_exclusion_filter || '',
      
      // AI-powered filters (BETA)
      include_ai: params.include_ai || false,
      ai_employment_type_filter: params.ai_employment_type_filter || '',
      ai_work_arrangement_filter: params.ai_work_arrangement_filter || '',
      ai_has_salary: params.ai_has_salary || false,
      ai_experience_level_filter: params.ai_experience_level_filter || '',
      ai_visa_sponsorship_filter: params.ai_visa_sponsorship_filter || false,
      
      // LinkedIn filters
      include_li: params.include_li || false,
      li_organization_slug_filter: params.li_organization_slug_filter || '',
      li_organization_slug_exclusion_filter: params.li_organization_slug_exclusion_filter || '',
      li_industry_filter: params.li_industry_filter || '',
      li_organization_specialties_filter: params.li_organization_specialties_filter || '',
      li_organization_description_filter: params.li_organization_description_filter || '',
      li_organization_employees_gte: params.li_organization_employees_gte || undefined,
      li_organization_employees_lte: params.li_organization_employees_lte || undefined,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/queries/${query.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parameters: {
            endpoint: formData.endpoint,
            ...formData.parameters,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update query');
      }

      setSuccess('Query updated successfully');
      setTimeout(() => router.push('/admin/queries'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this query?')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/queries/${query.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete query');
      }

      router.push('/admin/queries');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setError('');
    setSuccess('');
    setJobResults([]);

    try {
      // Test the query to get jobs
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
        throw new Error(errorData.error || 'Failed to run query');
      }

      const result = await response.json();
      
      if (result.success && result.jobs) {
        setJobResults(result.jobs);
        setShowJobModal(true);
        setSuccess(`Found ${result.jobCount} jobs (${result.newJobs || 0} new, ${result.duplicates || 0} duplicates)`);
      } else {
        setError('No jobs found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRunning(false);
    }
  };

  const handleEmploymentTypeToggle = (type: string) => {
    const types = formData.parameters.employment_types;
    setFormData({
      ...formData,
      parameters: {
        ...formData.parameters,
        employment_types: types.includes(type)
          ? types.filter((t: string) => t !== type)
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
          ? levels.filter((l: string) => l !== level)
          : [...levels, level],
      },
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Query</h1>
          <p className="mt-1 text-sm text-gray-600">
            Modify your saved job search query
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={running}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {running ? 'Running...' : 'Run Query'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
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
                />
              </div>

              <div>
                <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700">
                  API Endpoint
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
                  value={formData.parameters.query}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, query: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., React Developer, Python"
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.parameters.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, title: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.parameters.company}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, company: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.parameters.location}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, location: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <select
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
                  value={formData.parameters.description_type}
                  onChange={(e) => setFormData({
                    ...formData,
                    parameters: { ...formData.parameters, description_type: e.target.value }
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
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Fetch Logs Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Executions</h3>
            
            {query.fetchLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No executions yet</p>
            ) : (
              <div className="space-y-3">
                {query.fetchLogs.map((log) => (
                  <div key={log.id} className="border-l-4 border-gray-200 pl-3">
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${
                        log.status === 'success' ? 'text-green-600' : 
                        log.status === 'partial' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {log.status === 'success' ? '✓ Success' : 
                         log.status === 'partial' ? '⚠ Partial' : '✗ Failed'}
                      </span>
                      <span className="text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Fetched: {log.jobsFetched} • Saved: {log.jobsCreated}
                    </p>
                    {log.errorMessage && (
                      <p className="text-sm text-red-600 mt-1 truncate" title={log.errorMessage}>
                        {log.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Query Info</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(query.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">
                  {new Date(query.updatedAt).toLocaleDateString()}
                </dd>
              </div>
              {query.lastRun && (
                <div>
                  <dt className="text-gray-500">Last Run</dt>
                  <dd className="text-gray-900">
                    {new Date(query.lastRun).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {query.resultCount !== null && (
                <div>
                  <dt className="text-gray-500">Last Result Count</dt>
                  <dd className="text-gray-900">{query.resultCount} jobs</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Job Selection Modal */}
      <JobSelectionModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        jobs={jobResults}
        onSave={async (selectedJobIds, saveAll) => {
          setShowJobModal(false);
          setLoading(true);
          
          try {
            const response = await fetch(`/api/admin/queries/${query.id}/execute`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                saveJobs: true,
                selectedJobIds: saveAll ? [] : selectedJobIds,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to save jobs');
            }

            const result = await response.json();
            setSuccess(`Successfully saved ${result.jobsCreated} jobs, created ${result.orgsCreated} new organizations`);
            
            // Refresh the page to show updated logs
            setTimeout(() => window.location.reload(), 2000);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
          } finally {
            setLoading(false);
          }
        }}
        queryName={query.name}
      />
    </div>
  );
}