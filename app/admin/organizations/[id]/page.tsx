import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface SearchParams {
  page?: string;
  search?: string;
}

async function getOrganization(id: string, searchParams: SearchParams) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: { jobs: true },
      },
    },
  });

  if (!org) {
    notFound();
  }

  // Get paginated jobs for this organization
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const skip = (page - 1) * limit;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobWhere: any = { organizationId: id };
  
  if (searchParams.search) {
    jobWhere.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { descriptionText: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  const [jobs, totalJobs] = await Promise.all([
    prisma.job.findMany({
      where: jobWhere,
      skip,
      take: limit,
      orderBy: { datePosted: 'desc' },
    }),
    prisma.job.count({ where: jobWhere }),
  ]);

  return {
    organization: org,
    jobs,
    totalJobs,
    page,
    totalPages: Math.ceil(totalJobs / limit),
  };
}

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const { organization, jobs, totalJobs, page, totalPages } = await getOrganization(
    id,
    resolvedSearchParams
  );

  return (
    <div className="p-6">
      {/* Organization Header */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {organization.logo && (
              <div className="relative h-16 w-16 flex-shrink-0">
                <Image
                  src={organization.logo}
                  alt={organization.name}
                  fill
                  className="rounded object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
              {organization.linkedinIndustry && (
                <p className="text-sm text-gray-600 mt-1">{organization.linkedinIndustry}</p>
              )}
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>{totalJobs} total jobs</span>
                {organization.linkedinEmployees && (
                  <span>{organization.linkedinEmployees} employees</span>
                )}
                {organization.linkedinSize && (
                  <span>Size: {organization.linkedinSize}</span>
                )}
              </div>
            </div>
          </div>
          {organization.url && (
            <a
              href={organization.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-900 border border-indigo-600 rounded-md hover:bg-indigo-50"
            >
              Visit Website →
            </a>
          )}
        </div>

        {/* Organization Details Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Founded</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {organization.linkedinFoundedDate || 'Not specified'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Specialties</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {organization.linkedinSpecialties || 'Not specified'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {organization.linkedinType || 'Not specified'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Internal ID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">
              {organization.id}
            </dd>
          </div>
        </div>

        {organization.linkedinDescription && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">
              {organization.linkedinDescription}
            </dd>
          </div>
        )}
      </div>

      {/* Jobs Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Jobs ({totalJobs})
          </h2>
          <form method="get" className="flex gap-2">
            <input
              type="text"
              name="search"
              defaultValue={resolvedSearchParams.search}
              placeholder="Search jobs..."
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              Search
            </button>
            {resolvedSearchParams.search && (
              <a
                href={`/admin/organizations/${id}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Clear
              </a>
            )}
          </form>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No jobs found for this organization.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {jobs.map((job) => {
                const isExpired = job.expiredAt !== null;
                return (
                <li key={job.id} className={isExpired ? 'opacity-60 bg-gray-50' : ''}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link href={`/admin/jobs/${job.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                          {job.title}
                          {isExpired && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                              EXPIRED
                            </span>
                          )}
                        </Link>
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
                          {job.updatedAt && job.updatedAt !== job.createdAt && (
                            <> • Updated: {new Date(job.updatedAt).toLocaleDateString()}</>
                          )}
                          {isExpired && job.expiredAt && (
                            <span className="ml-3 text-red-600 font-medium">
                              • Expired: {new Date(job.expiredAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                        {job.descriptionText && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {job.descriptionText.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
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
                );
              })}
            </ul>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex space-x-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ''}`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Previous
                </a>
              )}
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={`?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ''}`}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Next
                </a>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Back to Organizations */}
      <div className="mt-6">
        <Link
          href="/admin/organizations"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Organizations
        </Link>
      </div>
    </div>
  );
}