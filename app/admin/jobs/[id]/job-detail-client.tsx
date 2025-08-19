'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

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
  salaryRaw: unknown;
  sourceType: string | null;
  source: string | null;
  sourceDomain: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  lastFetchedAt: Date | null;
  expiredAt: Date | null;
  organization: {
    id: string;
    name: string;
    logo: string | null;
    url: string | null;
    linkedinIndustry: string | null;
  };
}

interface JobBoard {
  id: string;
  name: string;
  slug: string;
  isAssigned: boolean;
  featured: boolean;
  pinnedUntil: Date | null;
}

export default function JobDetailClient({ job }: { job: Job }) {
  const router = useRouter();
  const [expiring, setExpiring] = useState(false);
  const [error, setError] = useState('');
  const [boards, setBoards] = useState<JobBoard[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);

  useEffect(() => {
    fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBoards = async () => {
    setLoadingBoards(true);
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}/boards`);
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoadingBoards(false);
    }
  };

  const toggleBoardAssignment = async (boardId: string, currentlyAssigned: boolean) => {
    if (currentlyAssigned) {
      // Remove from board
      try {
        const response = await fetch(`/api/admin/jobs/${job.id}/boards?boardId=${boardId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setBoards(boards.map(b => 
            b.id === boardId ? { ...b, isAssigned: false, featured: false } : b
          ));
        }
      } catch (error) {
        console.error('Failed to remove from board:', error);
      }
    } else {
      // Add job to board
      try {
        const response = await fetch(`/api/admin/jobs/${job.id}/boards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boardId }),
        });
        if (response.ok) {
          setBoards(boards.map(b => 
            b.id === boardId ? { ...b, isAssigned: true } : b
          ));
          
          // Also add the organization to the board (without adding all its jobs)
          try {
            await fetch(`/api/admin/boards/${boardId}/organizations`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                organizationId: job.organizationId,
                isFeatured: false
              }),
            });
          } catch (error) {
            console.error('Failed to add organization to board:', error);
            // Don't fail the whole operation if org addition fails
          }
        }
      } catch (error) {
        console.error('Failed to add to board:', error);
      }
    }
  };

  const toggleFeatured = async (boardId: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          boardId,
          featured: !currentFeatured,
        }),
      });
      if (response.ok) {
        setBoards(boards.map(b => 
          b.id === boardId ? { ...b, featured: !currentFeatured } : b
        ));
      }
    } catch (error) {
      console.error('Failed to update featured status:', error);
    }
  };

  const handleExpire = async () => {
    if (job.expiredAt) {
      alert('This job is already expired.');
      return;
    }

    if (!confirm(`Are you sure you want to expire the job "${job.title}"? Expired jobs will be hidden from public listings but remain visible in the admin panel.`)) {
      return;
    }

    setExpiring(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to expire job');
      }

      router.push('/admin/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setExpiring(false);
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
    <div className={`p-6 ${job.expiredAt ? 'opacity-75' : ''}`}>
      {/* Expired Job Banner */}
      {job.expiredAt && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                <strong>This job has been expired</strong> and is no longer visible in public listings. 
                Expired on: {new Date(job.expiredAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

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
            onClick={handleExpire}
            disabled={expiring || job.expiredAt !== null}
            className={`px-4 py-2 rounded-md disabled:opacity-50 ${
              job.expiredAt
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {job.expiredAt
              ? 'Job Expired'
              : expiring
              ? 'Expiring...'
              : 'Expire Job'}
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
              
              {job.expiredAt && (
                <div>
                  <dt className="text-gray-500">Expired At</dt>
                  <dd className="text-red-600 font-medium">
                    {new Date(job.expiredAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Job Boards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Boards</h3>
            
            {loadingBoards ? (
              <div className="text-sm text-gray-500">Loading boards...</div>
            ) : (
              <div className="space-y-3">
                {/* Assigned boards */}
                {boards.filter(b => b.isAssigned).length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Assigned To</p>
                    <div className="space-y-2 mb-3">
                      {boards.filter(b => b.isAssigned).map(board => (
                        <div key={board.id} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/boards/${board.id}`}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                            >
                              {board.name}
                            </Link>
                            {board.featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleFeatured(board.id, board.featured)}
                              className={`px-2 py-1 rounded text-xs ${
                                board.featured
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-white border text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {board.featured ? 'Featured' : 'Feature'}
                            </button>
                            <button
                              onClick={() => toggleBoardAssignment(board.id, true)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Available boards */}
                {boards.filter(b => !b.isAssigned).length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {boards.filter(b => b.isAssigned).length > 0 ? 'Also Available' : 'Available Boards'}
                    </p>
                    <div className="space-y-2">
                      {boards.filter(b => !b.isAssigned).map(board => (
                        <div key={board.id} className="flex items-center justify-between py-2 px-3 border rounded hover:bg-gray-50">
                          <div>
                            <div className="text-sm font-medium">{board.name}</div>
                            <div className="text-xs text-gray-500">/{board.slug}</div>
                          </div>
                          <button
                            onClick={() => toggleBoardAssignment(board.id, false)}
                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {boards.length === 0 && (
                  <p className="text-sm text-gray-500">No job boards have been created yet</p>
                )}
              </div>
            )}
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