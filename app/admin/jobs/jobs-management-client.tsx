'use client';

import { useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
}

interface Job {
  id: string;
  title: string;
  url: string;
  datePosted: Date | string;
  createdAt: Date | string;
  expiredAt: Date | string | null;
  cities: string[];
  isRemote: boolean;
  organization: Organization;
}

interface JobsManagementClientProps {
  initialJobs: Job[];
  total: number;
  page: number;
  totalPages: number;
  organizations: Organization[];
  searchParams: {
    search?: string;
    organization?: string;
    remote?: string;
    dateFrom?: string;
    showExpired?: string;
    sortBy?: string;
  };
}

export default function JobsManagementClient({
  initialJobs,
  total,
  page,
  totalPages,
  organizations,
  searchParams,
}: JobsManagementClientProps) {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState(initialJobs);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedJobs(new Set(jobs.map(job => job.id)));
    } else {
      setSelectedJobs(new Set());
    }
  }, [jobs]);

  const handleSelectJob = useCallback((jobId: string, checked: boolean) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  }, []);

  const handleBulkExpire = useCallback(async () => {
    if (selectedJobs.size === 0) {
      alert('Please select jobs to expire');
      return;
    }

    if (!confirm(`Are you sure you want to expire ${selectedJobs.size} job(s)?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/jobs/bulk-expire', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobIds: Array.from(selectedJobs),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to expire jobs');
        }

        const result = await response.json();
        
        // Update local state
        setJobs(prevJobs => 
          prevJobs.map(job => 
            selectedJobs.has(job.id) 
              ? { ...job, expiredAt: new Date().toISOString() }
              : job
          )
        );
        
        // Clear selection
        setSelectedJobs(new Set());
        
        alert(`Successfully expired ${result.count} job(s)`);
        
        // Refresh the page to get updated data
        router.refresh();
      } catch (error) {
        console.error('Error expiring jobs:', error);
        alert('Failed to expire jobs. Please try again.');
      }
    });
  }, [selectedJobs, router]);

  const handleBulkUnexpire = useCallback(async () => {
    if (selectedJobs.size === 0) {
      alert('Please select jobs to reactivate');
      return;
    }

    if (!confirm(`Are you sure you want to reactivate ${selectedJobs.size} job(s)?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/jobs/bulk-unexpire', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobIds: Array.from(selectedJobs),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to reactivate jobs');
        }

        const result = await response.json();
        
        // Update local state
        setJobs(prevJobs => 
          prevJobs.map(job => 
            selectedJobs.has(job.id) 
              ? { ...job, expiredAt: null }
              : job
          )
        );
        
        // Clear selection
        setSelectedJobs(new Set());
        
        alert(`Successfully reactivated ${result.count} job(s)`);
        
        // Refresh the page to get updated data
        router.refresh();
      } catch (error) {
        console.error('Error reactivating jobs:', error);
        alert('Failed to reactivate jobs. Please try again.');
      }
    });
  }, [selectedJobs, router]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedJobs.size === 0) {
      alert('Please select jobs to delete');
      return;
    }

    const confirmMessage = `⚠️ WARNING: This will PERMANENTLY delete ${selectedJobs.size} job(s).\n\nThis action cannot be undone. Deleted jobs will be completely removed from the database.\n\nAre you absolutely sure?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // Double confirmation for delete
    const secondConfirm = prompt(`Type "DELETE" to confirm permanent deletion of ${selectedJobs.size} job(s):`);
    if (secondConfirm !== 'DELETE') {
      alert('Deletion cancelled');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/jobs/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobIds: Array.from(selectedJobs),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete jobs');
        }

        const result = await response.json();
        
        // Remove deleted jobs from local state
        setJobs(prevJobs => 
          prevJobs.filter(job => !selectedJobs.has(job.id))
        );
        
        // Clear selection
        setSelectedJobs(new Set());
        
        alert(`Successfully deleted ${result.count} job(s)${result.orphanedOrgsDeleted > 0 ? ` and cleaned up ${result.orphanedOrgsDeleted} orphaned organization(s)` : ''}`);
        
        // Refresh the page to get updated data
        router.refresh();
      } catch (error) {
        console.error('Error deleting jobs:', error);
        alert('Failed to delete jobs. Please try again.');
      }
    });
  }, [selectedJobs, router]);

  const sortByOptions = [
    { value: 'datePosted_desc', label: 'Posted Date (Newest)' },
    { value: 'datePosted_asc', label: 'Posted Date (Oldest)' },
    { value: 'createdAt_desc', label: 'Date Added (Newest)' },
    { value: 'createdAt_asc', label: 'Date Added (Oldest)' },
    { value: 'title_asc', label: 'Title (A-Z)' },
    { value: 'title_desc', label: 'Title (Z-A)' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Total: {total} jobs
          {selectedJobs.size > 0 && (
            <span className="ml-2 text-indigo-600 font-medium">
              ({selectedJobs.size} selected)
            </span>
          )}
        </p>
      </div>

      {/* Bulk Actions */}
      {selectedJobs.size > 0 && (
        <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-indigo-700">
              {selectedJobs.size} job(s) selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleBulkExpire}
                disabled={isPending}
                className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                Expire Selected
              </button>
              <button
                onClick={handleBulkUnexpire}
                disabled={isPending}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Reactivate Selected
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedJobs(new Set())}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <form method="get" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <input
                type="text"
                name="search"
                id="search"
                defaultValue={searchParams.search}
                placeholder="Title or description..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Organization */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <select
                name="organization"
                id="organization"
                defaultValue={searchParams.organization}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Remote */}
            <div>
              <label htmlFor="remote" className="block text-sm font-medium text-gray-700">
                Remote
              </label>
              <select
                name="remote"
                id="remote"
                defaultValue={searchParams.remote}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All</option>
                <option value="true">Remote Only</option>
                <option value="false">On-site Only</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
                Posted From
              </label>
              <input
                type="date"
                name="dateFrom"
                id="dateFrom"
                defaultValue={searchParams.dateFrom}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Sort By */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <select
                name="sortBy"
                id="sortBy"
                defaultValue={searchParams.sortBy || 'createdAt_desc'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {sortByOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Expired */}
            <div>
              <label htmlFor="showExpired" className="block text-sm font-medium text-gray-700">
                Show Expired
              </label>
              <select
                name="showExpired"
                id="showExpired"
                defaultValue={searchParams.showExpired}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Active Only</option>
                <option value="true">Include Expired</option>
                <option value="only">Expired Only</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Apply Filters
            </button>
            <Link
              href="/admin/jobs"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 inline-block"
            >
              Clear Filters
            </Link>
          </div>
        </form>
      </div>

      {/* Jobs Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {/* Select All Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedJobs.size === jobs.length && jobs.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Select All</span>
          </label>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {jobs.map((job) => {
            const isExpired = job.expiredAt !== null;
            const isSelected = selectedJobs.has(job.id);
            const createdDate = new Date(job.createdAt);
            const postedDate = new Date(job.datePosted);
            
            return (
              <li key={job.id} className={`${isExpired ? 'opacity-60 bg-gray-50' : ''} ${isSelected ? 'bg-indigo-50' : ''}`}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectJob(job.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Link href={`/admin/jobs/${job.id}`} className="text-sm font-medium text-indigo-600 truncate hover:text-indigo-900">
                            {job.title}
                            {isExpired && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                EXPIRED
                              </span>
                            )}
                          </Link>
                          <p className="mt-1 text-sm text-gray-900">
                            {job.organization.name}
                          </p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>
                              {job.cities.join(', ') || 'Location not specified'}
                            </span>
                            {job.isRemote && (
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Remote
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            <span>Posted: {postedDate.toLocaleDateString()}</span>
                            <span className="ml-3 text-indigo-600">
                              Added: {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString()}
                            </span>
                            {isExpired && job.expiredAt && (
                              <span className="ml-3 text-red-600 font-medium">
                                Expired: {new Date(job.expiredAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                          <Link
                            href={`/admin/jobs/${job.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            View Details
                          </Link>
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            Original →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.sortBy ? `&sortBy=${searchParams.sortBy}` : ''}`}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            <span className="px-3 py-2 text-sm font-medium text-gray-700">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.sortBy ? `&sortBy=${searchParams.sortBy}` : ''}`}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}