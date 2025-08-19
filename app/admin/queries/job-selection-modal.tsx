'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote?: boolean;
  datePosted?: string;
  isDuplicate?: boolean;
  employment_types?: string[];
  salary?: Record<string, unknown>;
  description?: string;
}

interface JobSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  onSave: (selectedJobIds: string[], saveAll: boolean) => Promise<void>;
  queryName?: string;
}

export default function JobSelectionModal({
  isOpen,
  onClose,
  jobs,
  onSave,
  queryName,
}: JobSelectionModalProps) {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'duplicate'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter jobs that are not duplicates by default
  useEffect(() => {
    if (jobs.length > 0) {
      const nonDuplicateJobs = jobs.filter(job => !job.isDuplicate);
      setSelectedJobs(new Set(nonDuplicateJobs.map(job => job.id)));
      setSelectAll(nonDuplicateJobs.length === jobs.length);
    }
  }, [jobs]);

  if (!isOpen) return null;

  const filteredJobs = jobs.filter(job => {
    // Apply duplicate filter
    if (filter === 'new' && job.isDuplicate) return false;
    if (filter === 'duplicate' && !job.isDuplicate) return false;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search) ||
        job.location.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  const newJobsCount = jobs.filter(job => !job.isDuplicate).length;
  const duplicatesCount = jobs.filter(job => job.isDuplicate).length;

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filteredJobs.filter(job => !job.isDuplicate).map(job => job.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleJobToggle = (jobId: string, isDuplicate: boolean) => {
    if (isDuplicate) return; // Don't allow selecting duplicates
    
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(Array.from(selectedJobs), false);
      onClose();
    } catch (error) {
      console.error('Error saving jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Save all non-duplicate jobs
      const nonDuplicateIds = jobs.filter(job => !job.isDuplicate).map(job => job.id);
      await onSave(nonDuplicateIds, true);
      onClose();
    } catch (error) {
      console.error('Error saving jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Select Jobs to Save
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {queryName ? `Query: ${queryName}` : 'Test Query Results'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="px-6 py-3 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span className="font-medium">Total: {jobs.length} jobs</span>
                <span className="text-green-600">New: {newJobsCount}</span>
                <span className="text-orange-600">Duplicates: {duplicatesCount}</span>
                <span className="text-blue-600">Selected: {selectedJobs.size}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded ${
                    filter === 'all' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('new')}
                  className={`px-3 py-1 text-sm rounded ${
                    filter === 'new' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  New Only
                </button>
                <button
                  onClick={() => setFilter('duplicate')}
                  className={`px-3 py-1 text-sm rounded ${
                    filter === 'duplicate' 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Duplicates
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Job List */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Select all new jobs
                </span>
              </label>
            </div>

            <div className="space-y-2">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-3 border rounded-lg ${
                    job.isDuplicate 
                      ? 'bg-orange-50 border-orange-200 opacity-60' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedJobs.has(job.id)}
                      onChange={() => handleJobToggle(job.id, job.isDuplicate || false)}
                      disabled={job.isDuplicate}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {job.title}
                            {job.isDuplicate && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                                Duplicate
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <span>{job.location}</span>
                            {job.remote && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                Remote
                              </span>
                            )}
                            {job.employment_types && job.employment_types.length > 0 && (
                              <span>{job.employment_types.join(', ')}</span>
                            )}
                            {job.datePosted && (
                              <span>Posted: {new Date(job.datePosted).toLocaleDateString()}</span>
                            )}
                          </div>
                          {job.description && (
                            <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No jobs found matching your filters.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {selectedJobs.size === 0 
                  ? 'No jobs selected' 
                  : `${selectedJobs.size} job${selectedJobs.size !== 1 ? 's' : ''} selected`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={loading || newJobsCount === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : `Save All New (${newJobsCount})`}
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || selectedJobs.size === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : `Save Selected (${selectedJobs.size})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}