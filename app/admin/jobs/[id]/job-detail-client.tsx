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
  
  // AI-powered analysis fields
  aiSalaryCurrency: string | null;
  aiSalaryValue: number | null;
  aiSalaryMinValue: number | null;
  aiSalaryMaxValue: number | null;
  aiSalaryUnitText: string | null;
  aiBenefits: string[];
  aiExperienceLevel: string | null;
  aiWorkArrangement: string | null;
  aiWorkArrangementOfficeDays: number | null;
  aiRemoteLocation: string[];
  aiRemoteLocationDerived: string[];
  aiKeySkills: string[];
  aiCoreResponsibilities: string | null;
  aiRequirementsSummary: string | null;
  aiHiringManagerName: string | null;
  aiHiringManagerEmailAddress: string | null;
  aiWorkingHours: number | null;
  aiEmploymentType: string[];
  aiJobLanguage: string | null;
  aiVisaSponsorship: boolean | null;
  
  organization: {
    id: string;
    name: string;
    logo: string | null;
    url: string | null;
    linkedinIndustry: string | null;
    linkedinSlogan: string | null;
    linkedinRecruitmentAgency: boolean | null;
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
  const [deleting, setDeleting] = useState(false);
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

  const handleUnexpire = async () => {
    if (!job.expiredAt) {
      alert('This job is not expired.');
      return;
    }

    if (!confirm(`Are you sure you want to reactivate the job "${job.title}"? This will make it visible in public listings again.`)) {
      return;
    }

    setExpiring(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/jobs/bulk-unexpire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobIds: [job.id],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reactivate job');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setExpiring(false);
    }
  };

  const handleDelete = async () => {
    const confirmMessage = `⚠️ WARNING: This will PERMANENTLY delete the job "${job.title}".\n\nThis action cannot be undone. The job will be completely removed from the database.\n\nAre you absolutely sure?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // Double confirmation for delete
    const secondConfirm = prompt(`Type "DELETE" to confirm permanent deletion of this job:`);
    if (secondConfirm !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/jobs/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobIds: [job.id],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete job');
      }

      alert('Job successfully deleted');
      router.push('/admin/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  const formatAISalary = () => {
    // Use AI-parsed salary data first if available
    if (job.aiSalaryCurrency || job.aiSalaryValue || job.aiSalaryMinValue || job.aiSalaryMaxValue) {
      const parts = [];
      
      if (job.aiSalaryMinValue && job.aiSalaryMaxValue) {
        parts.push(`$${job.aiSalaryMinValue.toLocaleString()} - $${job.aiSalaryMaxValue.toLocaleString()}`);
      } else if (job.aiSalaryValue) {
        parts.push(`$${job.aiSalaryValue.toLocaleString()}`);
      }
      
      if (job.aiSalaryUnitText) {
        parts.push(`per ${job.aiSalaryUnitText.toLowerCase()}`);
      }
      
      if (job.aiSalaryCurrency && job.aiSalaryCurrency !== 'USD') {
        parts.push(`(${job.aiSalaryCurrency})`);
      }
      
      return parts.length > 0 ? parts.join(' ') : null;
    }
    
    // Fallback to raw salary data
    if (!job.salaryRaw) return null;
    try {
      if (typeof job.salaryRaw === 'string') {
        return job.salaryRaw;
      }
      return JSON.stringify(job.salaryRaw);
    } catch {
      return null;
    }
  };

  const getWorkArrangementColor = (arrangement: string | null) => {
    if (!arrangement) return 'bg-gray-100 text-gray-800';
    switch (arrangement.toLowerCase()) {
      case 'remote solely':
        return 'bg-green-100 text-green-800';
      case 'remote ok':
        return 'bg-blue-100 text-blue-800';
      case 'hybrid':
        return 'bg-purple-100 text-purple-800';
      case 'on-site':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceLevelColor = (level: string | null) => {
    if (!level) return 'bg-gray-100 text-gray-800';
    switch (level) {
      case '0-2':
        return 'bg-green-100 text-green-800';
      case '2-5':
        return 'bg-blue-100 text-blue-800';
      case '5-10':
        return 'bg-purple-100 text-purple-800';
      case '10+':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          {job.expiredAt ? (
            <button
              onClick={handleUnexpire}
              disabled={expiring}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {expiring ? 'Processing...' : 'Reactivate Job'}
            </button>
          ) : (
            <button
              onClick={handleExpire}
              disabled={expiring}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {expiring ? 'Expiring...' : 'Expire Job'}
            </button>
          )}
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

              {formatAISalary() && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Salary Range 
                    {(job.aiSalaryCurrency || job.aiSalaryValue || job.aiSalaryMinValue || job.aiSalaryMaxValue) && (
                      <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        AI Parsed
                      </span>
                    )}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{formatAISalary()}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* AI Insights */}
          {(job.aiExperienceLevel || job.aiWorkArrangement || job.aiKeySkills.length > 0 || job.aiCoreResponsibilities || job.aiRequirementsSummary || job.aiBenefits.length > 0) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-lg font-medium text-gray-900">AI-Powered Analysis</h2>
                </div>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Powered by AI
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {job.aiExperienceLevel && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700 mb-1">Experience Level</dt>
                    <dd>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExperienceLevelColor(job.aiExperienceLevel)}`}>
                        {job.aiExperienceLevel} years
                      </span>
                    </dd>
                  </div>
                )}

                {job.aiWorkArrangement && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700 mb-1">Work Arrangement</dt>
                    <dd>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWorkArrangementColor(job.aiWorkArrangement)}`}>
                        {job.aiWorkArrangement}
                      </span>
                      {job.aiWorkArrangementOfficeDays && job.aiWorkArrangement?.toLowerCase() === 'hybrid' && (
                        <span className="ml-2 text-xs text-gray-600">
                          ({job.aiWorkArrangementOfficeDays} days/week in office)
                        </span>
                      )}
                    </dd>
                  </div>
                )}

                {job.aiWorkingHours && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700 mb-1">Working Hours</dt>
                    <dd className="text-sm text-gray-900">{job.aiWorkingHours} hours/week</dd>
                  </div>
                )}

                {job.aiJobLanguage && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700 mb-1">Job Language</dt>
                    <dd className="text-sm text-gray-900">{job.aiJobLanguage}</dd>
                  </div>
                )}

                {job.aiVisaSponsorship !== null && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700 mb-1">Visa Sponsorship</dt>
                    <dd>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.aiVisaSponsorship ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {job.aiVisaSponsorship ? 'Available' : 'Not Available'}
                      </span>
                    </dd>
                  </div>
                )}

                {job.aiEmploymentType.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700 mb-1">AI Employment Type</dt>
                    <dd className="text-sm text-gray-900 capitalize">{job.aiEmploymentType.join(', ').replace(/_/g, ' ')}</dd>
                  </div>
                )}
              </div>

              {job.aiKeySkills.length > 0 && (
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-700 mb-2">Key Skills Identified</dt>
                  <dd className="flex flex-wrap gap-2">
                    {job.aiKeySkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-white text-gray-800 border border-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              {job.aiBenefits.length > 0 && (
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-700 mb-2">Benefits Identified</dt>
                  <dd>
                    <ul className="text-sm text-gray-900 space-y-1">
                      {job.aiBenefits.map((benefit, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}

              {job.aiCoreResponsibilities && (
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-700 mb-1">Core Responsibilities Summary</dt>
                  <dd className="text-sm text-gray-900 p-3 bg-white rounded border">{job.aiCoreResponsibilities}</dd>
                </div>
              )}

              {job.aiRequirementsSummary && (
                <div className="mb-4">
                  <dt className="text-sm font-medium text-gray-700 mb-1">Requirements Summary</dt>
                  <dd className="text-sm text-gray-900 p-3 bg-white rounded border">{job.aiRequirementsSummary}</dd>
                </div>
              )}

              {(job.aiHiringManagerName || job.aiHiringManagerEmailAddress) && (
                <div>
                  <dt className="text-sm font-medium text-gray-700 mb-1">Hiring Manager Contact</dt>
                  <dd className="text-sm text-gray-900">
                    {job.aiHiringManagerName && <div>Name: {job.aiHiringManagerName}</div>}
                    {job.aiHiringManagerEmailAddress && <div>Email: {job.aiHiringManagerEmailAddress}</div>}
                  </dd>
                </div>
              )}
            </div>
          )}

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
                {job.organization.linkedinSlogan && (
                  <p className="text-sm text-gray-400 mt-1 italic">&ldquo;{job.organization.linkedinSlogan}&rdquo;</p>
                )}
                {job.organization.linkedinRecruitmentAgency && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                    Recruitment Agency
                  </span>
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