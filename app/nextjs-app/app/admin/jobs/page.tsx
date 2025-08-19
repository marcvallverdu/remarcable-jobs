import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';

interface SearchParams {
  page?: string;
  search?: string;
  organization?: string;
  remote?: string;
  dateFrom?: string;
  dateTo?: string;
}

async function getJobs(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const skip = (page - 1) * limit;
  
  const where: Record<string, unknown> = {};
  
  // Search filter
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { descriptionText: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }
  
  // Organization filter
  if (searchParams.organization) {
    where.organizationId = searchParams.organization;
  }
  
  // Remote filter
  if (searchParams.remote === 'true') {
    where.isRemote = true;
  } else if (searchParams.remote === 'false') {
    where.isRemote = false;
  }
  
  // Date range filter
  if (searchParams.dateFrom || searchParams.dateTo) {
    where.datePosted = {};
    if (searchParams.dateFrom) {
      where.datePosted.gte = new Date(searchParams.dateFrom);
    }
    if (searchParams.dateTo) {
      where.datePosted.lte = new Date(searchParams.dateTo);
    }
  }

  const [jobs, total, organizations] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      include: {
        organization: true,
      },
      orderBy: { datePosted: 'desc' },
    }),
    prisma.job.count({ where }),
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    jobs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    organizations,
  };
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { jobs, total, page, totalPages, organizations } = await getJobs(searchParams);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Total: {total} jobs
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <form method="get" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear Filters
            </Link>
          </div>
        </form>
      </div>

      {/* Jobs Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {jobs.map((job) => (
            <li key={job.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link href={`/admin/jobs/${job.id}`} className="text-sm font-medium text-indigo-600 truncate hover:text-indigo-900">
                      {job.title}
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
                    <p className="mt-1 text-xs text-gray-500">
                      Posted: {new Date(job.datePosted).toLocaleDateString()}
                    </p>
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
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
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
                href={`?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
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