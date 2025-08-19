'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Star, Clock, Briefcase, Users } from 'lucide-react';

interface JobBoard {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  logo: string | null;
  primaryColor: string | null;
  domain: string | null;
  jobs: {
    id: string;
    featured: boolean;
    pinnedUntil: string | null;
    job: {
      id: string;
      title: string;
      organization: {
        id: string;
        name: string;
      };
    };
  }[];
  organizations: {
    id: string;
    isFeatured: boolean;
    tier: string | null;
    organization: {
      id: string;
      name: string;
      logo: string | null;
    };
  }[];
  _count: {
    jobs: number;
    organizations: number;
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function JobBoardDetailPage({ params }: Props) {
  const { id } = use(params);
  const [board, setBoard] = useState<JobBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddJobsModal, setShowAddJobsModal] = useState(false);
  const [showAddOrgsModal, setShowAddOrgsModal] = useState(false);

  useEffect(() => {
    fetchBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/admin/boards/${id}`);
      if (response.ok) {
        const data = await response.json();
        setBoard(data);
      }
    } catch (error) {
      console.error('Failed to fetch job board:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeJobFromBoard = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/boards/${id}/jobs?jobId=${jobId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchBoard();
      }
    } catch (error) {
      console.error('Failed to remove job:', error);
    }
  };

  const removeOrgFromBoard = async (orgId: string) => {
    try {
      const response = await fetch(`/api/admin/boards/${id}/organizations?organizationId=${orgId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchBoard();
      }
    } catch (error) {
      console.error('Failed to remove organization:', error);
    }
  };

  const toggleJobFeatured = async (jobId: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/boards/${id}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          featured: !currentFeatured,
        }),
      });
      
      if (response.ok) {
        fetchBoard();
      }
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
    }
  };

  const toggleOrgFeatured = async (orgId: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/boards/${id}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          isFeatured: !currentFeatured,
        }),
      });
      
      if (response.ok) {
        fetchBoard();
      }
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading job board...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Job board not found</p>
          <Link href="/admin/boards" className="text-blue-600 hover:text-blue-700">
            Back to Job Boards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/boards" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Job Boards
        </Link>
        
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold">{board.name}</h1>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded inline-block mt-2">/{board.slug}</code>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              board.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {board.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          {board.description && (
            <p className="text-gray-600 mb-4">{board.description}</p>
          )}
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{board._count.jobs} total jobs</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{board._count.organizations} total organizations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Jobs on this Board</h2>
          <button
            onClick={() => setShowAddJobsModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Jobs
          </button>
        </div>
        
        <div className="bg-white border rounded-lg overflow-hidden">
          {board.jobs.length > 0 ? (
            <div className="divide-y">
              {board.jobs.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/jobs/${item.job.id}`} className="font-medium hover:text-blue-600">
                        {item.job.title}
                      </Link>
                      {item.featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      {item.pinnedUntil && new Date(item.pinnedUntil) > new Date() && (
                        <Clock className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{item.job.organization.name}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleJobFeatured(item.job.id, item.featured)}
                      className={`px-3 py-1 rounded text-sm ${
                        item.featured
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.featured ? 'Featured' : 'Feature'}
                    </button>
                    <button
                      onClick={() => removeJobFromBoard(item.job.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No jobs assigned to this board yet
            </div>
          )}
        </div>
      </div>

      {/* Organizations Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Organizations on this Board</h2>
          <button
            onClick={() => setShowAddOrgsModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Organizations
          </button>
        </div>
        
        <div className="bg-white border rounded-lg overflow-hidden">
          {board.organizations.length > 0 ? (
            <div className="divide-y">
              {board.organizations.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {item.organization.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.organization.logo}
                        alt={item.organization.name}
                        className="w-10 h-10 rounded object-contain"
                      />
                    )}
                    <div>
                      <Link href={`/admin/organizations/${item.organization.id}`} className="font-medium hover:text-blue-600">
                        {item.organization.name}
                      </Link>
                      {item.tier && (
                        <p className="text-sm text-gray-500">Tier: {item.tier}</p>
                      )}
                    </div>
                    {item.isFeatured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleOrgFeatured(item.organization.id, item.isFeatured)}
                      className={`px-3 py-1 rounded text-sm ${
                        item.isFeatured
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.isFeatured ? 'Featured' : 'Feature'}
                    </button>
                    <button
                      onClick={() => removeOrgFromBoard(item.organization.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No organizations assigned to this board yet
            </div>
          )}
        </div>
      </div>

      {/* Add Jobs Modal */}
      {showAddJobsModal && (
        <AddJobsModal
          boardId={id}
          onClose={() => setShowAddJobsModal(false)}
          onSuccess={() => {
            setShowAddJobsModal(false);
            fetchBoard();
          }}
        />
      )}

      {/* Add Organizations Modal */}
      {showAddOrgsModal && (
        <AddOrgsModal
          boardId={id}
          onClose={() => setShowAddOrgsModal(false)}
          onSuccess={() => {
            setShowAddOrgsModal(false);
            fetchBoard();
          }}
        />
      )}
    </div>
  );
}

function AddJobsModal({
  boardId,
  onClose,
  onSuccess,
}: {
  boardId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [jobs, setJobs] = useState<{ id: string; title: string; organization: { name: string } }[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/v1/jobs?limit=100');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedJobs.length === 0) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/boards/${boardId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: selectedJobs }),
      });
      
      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to add jobs:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Add Jobs to Board</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500">Loading jobs...</div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <label key={job.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedJobs([...selectedJobs, job.id]);
                      } else {
                        setSelectedJobs(selectedJobs.filter(id => id !== job.id));
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{job.title}</div>
                    <div className="text-sm text-gray-500">{job.organization.name}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            disabled={submitting || selectedJobs.length === 0}
          >
            Add {selectedJobs.length} Job{selectedJobs.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddOrgsModal({
  boardId,
  onClose,
  onSuccess,
}: {
  boardId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [orgs, setOrgs] = useState<{ id: string; name: string; logo?: string | null; _count: { jobs: number } }[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      const response = await fetch('/api/v1/organizations?limit=100');
      if (response.ok) {
        const data = await response.json();
        setOrgs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedOrgs.length === 0) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/boards/${boardId}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationIds: selectedOrgs }),
      });
      
      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to add organizations:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Add Organizations to Board</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500">Loading organizations...</div>
          ) : (
            <div className="space-y-2">
              {orgs.map((org) => (
                <label key={org.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOrgs.includes(org.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrgs([...selectedOrgs, org.id]);
                      } else {
                        setSelectedOrgs(selectedOrgs.filter(id => id !== org.id));
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    {org.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="w-8 h-8 rounded object-contain"
                      />
                    )}
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-sm text-gray-500">{org._count.jobs} jobs</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            disabled={submitting || selectedOrgs.length === 0}
          >
            Add {selectedOrgs.length} Organization{selectedOrgs.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}