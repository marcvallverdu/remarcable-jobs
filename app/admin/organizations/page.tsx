import { prisma } from '@/lib/db/prisma';

interface SearchParams {
  page?: string;
  search?: string;
}

async function getOrganizations(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const skip = (page - 1) * limit;
  
  const where = searchParams.search
    ? {
        OR: [
          { name: { contains: searchParams.search, mode: 'insensitive' as const } },
          { linkedinIndustry: { contains: searchParams.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.organization.count({ where }),
  ]);

  return {
    organizations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { organizations, total, page, totalPages } = await getOrganizations(searchParams);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <p className="mt-1 text-sm text-gray-600">
          Total: {total} organizations
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form method="get" className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={searchParams.search}
            placeholder="Search organizations..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <div key={org.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {org.logo && (
                  <img
                    src={org.logo}
                    alt={org.name}
                    className="h-12 w-12 mb-3 rounded"
                  />
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {org.name}
                </h3>
                {org.linkedinIndustry && (
                  <p className="mt-1 text-sm text-gray-500">
                    {org.linkedinIndustry}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-600">
                  {org._count.jobs} job{org._count.jobs !== 1 ? 's' : ''}
                </p>
                {org.linkedinEmployees && (
                  <p className="text-xs text-gray-500">
                    {org.linkedinEmployees} employees
                  </p>
                )}
                {org.linkedinSize && (
                  <p className="text-xs text-gray-500">
                    Size: {org.linkedinSize}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <a
                href={`/admin/organizations/${org.id}`}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                View Details
              </a>
              {org.url && (
                <a
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Website →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
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
                href={`?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Next
              </a>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}