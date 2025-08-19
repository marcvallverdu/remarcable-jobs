'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Stats {
  totalJobs: number;
  totalOrganizations: number;
  remoteJobs: number;
  recentJobs: number;
  topOrganizations: Array<{
    id: string;
    name: string;
    logo: string | null;
    jobCount: number;
  }>;
}

interface Props {
  stats: Stats;
}

export default function AdminDashboardClient({ stats }: Props) {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Jobs
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.totalJobs}
                </dd>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Organizations
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.totalOrganizations}
                </dd>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Remote Jobs
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.remoteJobs}
                </dd>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Recent Jobs (7d)
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {stats.recentJobs}
                </dd>
              </div>
            </div>
          </div>

          {/* Top Organizations */}
          {stats.topOrganizations.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Top Organizations</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {stats.topOrganizations.map((org) => (
                    <li key={org.id}>
                      <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                        <div className="flex items-center">
                          {org.logo && (
                            <div className="relative h-10 w-10 mr-3 flex-shrink-0">
                              <Image
                                src={org.logo}
                                alt={org.name}
                                fill
                                className="rounded-full object-contain"
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{org.name}</p>
                            <p className="text-sm text-gray-500">{org.jobCount} jobs</p>
                          </div>
                        </div>
                        <Link
                          href={`/admin/organizations/${org.id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          View →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/admin/queries/new"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow block"
              >
                <h3 className="font-medium text-gray-900">Create New Query</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Build and save a new job search query
                </p>
              </Link>
              
              <Link
                href="/admin/queries"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow block"
              >
                <h3 className="font-medium text-gray-900">Manage Queries</h3>
                <p className="mt-2 text-sm text-gray-500">
                  View and manage your saved search queries
                </p>
              </Link>
              
              <Link
                href="/admin/jobs"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow block"
              >
                <h3 className="font-medium text-gray-900">Browse Jobs</h3>
                <p className="mt-2 text-sm text-gray-500">
                  View all jobs in the database
                </p>
              </Link>
              
              <Link
                href="/admin/organizations"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow block"
              >
                <h3 className="font-medium text-gray-900">Organizations</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Manage organization data
                </p>
              </Link>
              
              <Link
                href="/admin/logs"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow block"
              >
                <h3 className="font-medium text-gray-900">Fetch Logs</h3>
                <p className="mt-2 text-sm text-gray-500">
                  View API fetch history
                </p>
              </Link>
              
              <a
                href="/api/v1/stats"
                target="_blank"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow block"
              >
                <h3 className="font-medium text-gray-900">API Stats</h3>
                <p className="mt-2 text-sm text-gray-500">
                  View public API statistics
                </p>
              </a>
            </div>
          </div>
      </div>
    </div>
  );
}