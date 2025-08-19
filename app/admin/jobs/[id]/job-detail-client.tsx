'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Job {
  id: string;
  externalId: string;
  url: string;
  title: string;
  descriptionText: string;
  cities: string[];
  counties: string[];
  regions: string[];
  countries: string[];
  locationsFull: string[];
  timezones: string[];
  latitude: number[];
  longitude: number[];
  isRemote: boolean;
  datePosted: Date;
  dateCreated: Date;
  dateValidThrough: Date | null;
  employmentType: string[];
  salaryRaw: Record<string, unknown> | null;
  sourceType: string | null;
  source: string | null;
  sourceDomain: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  lastFetchedAt: Date | null;
  organization: {
    id: string;
    name: string;
    logo: string | null;
    url: string | null;
    linkedinIndustry: string | null;
  };
}

export default function JobDetailClient({ job }: { job: Job }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the job "${job.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete job');
      }

      router.push('/admin/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  const formatSalary = () => {
    if (!job.salaryRaw) return null;
    // salaryRaw is a JSON field that might contain salary information
    // The structure depends on your API response format
    try {
      if (typeof job.salaryRaw === 'string') {
        return job.salaryRaw;
      }
      // Add more parsing logic here based on your actual data structure
      return JSON.stringify(job.salaryRaw);
    } catch {
      return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
            <Link href={`/admin/organizations/${job.organizationId}`} className="hover:text-indigo-600">
              {job.organization.name}
            </Link>
            {job.organization.linkedinIndustry && (
              <span>• {job.organization.linkedinIndustry}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            View Original →
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Job'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Job Details</h2>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.isRemote && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                      Remote
                    </span>
                  )}
                  {job.cities.length > 0 && job.cities.join(', ')}
                  {job.cities.length === 0 && !job.isRemote && 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Regions/Countries</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {job.regions.length > 0 && `${job.regions.join(', ')}`}
                  {job.regions.length === 0 && job.countries.length > 0 && job.countries.join(', ')}
                  {job.regions.length === 0 && job.countries.length === 0 && 'Not specified'}
                </dd>
              </div>

              {job.counties.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Counties</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.counties.join(', ')}</dd>
                </div>
              )}

              {job.locationsFull.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Full Locations</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.locationsFull.join(' • ')}</dd>
                </div>
              )}

              {job.employmentType.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{job.employmentType.join(', ')}</dd>
                </div>
              )}

              {formatSalary() && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Salary Range</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatSalary()}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
            
            {job.descriptionText ? (
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {job.descriptionText}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No description available</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Organization Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
            
            <div className="space-y-3">
              {job.organization.logo && (
                <div className="relative h-16 w-16 flex-shrink-0">
                  <Image
                    src={job.organization.logo}
                    alt={job.organization.name}
                    fill
                    className="rounded object-contain"
                  />
                </div>
              )}
              
              <div>
                <Link
                  href={`/admin/organizations/${job.organizationId}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                >
                  {job.organization.name}
                </Link>
                {job.organization.linkedinIndustry && (
                  <p className="text-sm text-gray-500 mt-1">{job.organization.linkedinIndustry}</p>
                )}
              </div>

              {job.organization.url && (
                <a
                  href={job.organization.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-gray-600 hover:text-gray-900"
                >
                  Visit Website →
                </a>
              )}

              <Link
                href={`/admin/jobs?organization=${job.organizationId}`}
                className="inline-block text-sm text-indigo-600 hover:text-indigo-900"
              >
                View all jobs from this org
              </Link>
            </div>
          </div>

          {/* Dates & Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
            
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Posted Date</dt>
                <dd className="text-gray-900">
                  {new Date(job.datePosted).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              
              <div>
                <dt className="text-gray-500">Created Date</dt>
                <dd className="text-gray-900">
                  {new Date(job.dateCreated).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              
              {job.dateValidThrough && (
                <div>
                  <dt className="text-gray-500">Valid Through</dt>
                  <dd className="text-gray-900">
                    {new Date(job.dateValidThrough).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              )}
              
              {job.lastFetchedAt && (
                <div>
                  <dt className="text-gray-500">Last Fetched</dt>
                  <dd className="text-gray-900">
                    {new Date(job.lastFetchedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              )}
              
              {job.source && (
                <div>
                  <dt className="text-gray-500">Source</dt>
                  <dd className="text-gray-900">{job.source}</dd>
                </div>
              )}
              
              {job.sourceType && (
                <div>
                  <dt className="text-gray-500">Source Type</dt>
                  <dd className="text-gray-900">{job.sourceType}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-gray-500">External ID</dt>
                <dd className="text-gray-900 font-mono text-xs break-all">{job.externalId}</dd>
              </div>
              
              <div>
                <dt className="text-gray-500">Internal ID</dt>
                <dd className="text-gray-900 font-mono text-xs break-all">{job.id}</dd>
              </div>
              
              <div>
                <dt className="text-gray-500">Created At</dt>
                <dd className="text-gray-900">
                  {new Date(job.createdAt).toLocaleString()}
                </dd>
              </div>
              
              <div>
                <dt className="text-gray-500">Updated At</dt>
                <dd className="text-gray-900">
                  {new Date(job.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Back Navigation */}
      <div className="mt-6">
        <Link
          href="/admin/jobs"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Jobs
        </Link>
      </div>
    </div>
  );
}