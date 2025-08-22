import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Building2, Briefcase, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic';

interface BoardPageProps {
  params: Promise<{ boardSlug: string }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    location?: string;
    remote?: string;
  }>;
}

async function getBoardJobs(
  boardSlug: string, 
  params: {
    page?: number;
    search?: string;
    location?: string;
    remote?: boolean;
  } = {}
) {
  const board = await prisma.jobBoard.findUnique({
    where: { slug: boardSlug, isActive: true },
    select: { id: true, name: true, description: true, primaryColor: true },
  });

  if (!board) return null;

  const page = params.page || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    jobBoards: {
      some: { jobBoardId: board.id }
    },
    expiredAt: null,
  };

  // Add search filters
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { descriptionText: { contains: params.search, mode: 'insensitive' } },
      { organization: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  if (params.location) {
    where.OR = [
      { cities: { has: params.location } },
      { regions: { has: params.location } },
      { countries: { has: params.location } },
    ];
  }

  if (params.remote !== undefined) {
    where.isRemote = params.remote;
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        organization: true,
        jobBoards: {
          where: { jobBoardId: board.id },
          select: { featured: true, pinnedUntil: true }
        }
      },
      orderBy: [
        { jobBoards: { _count: 'desc' } }, // Featured jobs first
        { datePosted: 'desc' }
      ],
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    board,
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const page = parseInt(resolvedSearchParams.page || '1');
  const remote = resolvedSearchParams.remote === 'true' ? true : 
                  resolvedSearchParams.remote === 'false' ? false : 
                  undefined;

  const result = await getBoardJobs(resolvedParams.boardSlug, {
    page,
    search: resolvedSearchParams.search,
    location: resolvedSearchParams.location,
    remote,
  });

  if (!result) {
    notFound();
  }

  const { board, jobs, pagination } = result;

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">{board.name}</h1>
        {board.description && (
          <p className="text-gray-600">{board.description}</p>
        )}
        <div className="mt-4 text-sm text-gray-500">
          {pagination.total} jobs available
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <form className="flex flex-wrap gap-4">
          <input
            type="text"
            name="search"
            placeholder="Search jobs..."
            defaultValue={resolvedSearchParams.search}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="location"
            placeholder="Location..."
            defaultValue={resolvedSearchParams.location}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="remote"
            defaultValue={resolvedSearchParams.remote || ''}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Jobs</option>
            <option value="true">Remote Only</option>
            <option value="false">On-site Only</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: board.primaryColor || '#3B82F6' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {jobs.map((job) => {
          const boardJob = job.jobBoards[0];
          const isFeatured = boardJob?.featured;
          const isPinned = boardJob?.pinnedUntil && new Date(boardJob.pinnedUntil) > new Date();

          return (
            <Link
              key={job.id}
              href={`/boards/${resolvedParams.boardSlug}/jobs/${job.id}`}
              className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 ${
                isFeatured ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {job.organization.logo && (
                      <img
                        src={job.organization.logo}
                        alt={job.organization.name}
                        className="w-12 h-12 rounded object-contain"
                      />
                    )}
                    <div>
                      <h2 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                        {job.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {job.organization.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-3">
                    {job.cities.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.cities.slice(0, 2).join(', ')}
                        {job.cities.length > 2 && ` +${job.cities.length - 2} more`}
                      </span>
                    )}
                    
                    {job.isRemote && (
                      <span className="flex items-center gap-1 text-green-600">
                        <MapPin className="w-3 h-3" />
                        Remote
                      </span>
                    )}

                    {job.employmentType.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {job.employmentType[0]}
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(job.datePosted), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Job description preview */}
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {job.descriptionText.substring(0, 200)}...
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {isFeatured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Featured
                    </span>
                  )}
                  {isPinned && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Pinned
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        {jobs.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No jobs found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ''}${resolvedSearchParams.location ? `&location=${resolvedSearchParams.location}` : ''}${resolvedSearchParams.remote ? `&remote=${resolvedSearchParams.remote}` : ''}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          
          <span className="px-4 py-2">
            Page {page} of {pagination.totalPages}
          </span>
          
          {page < pagination.totalPages && (
            <Link
              href={`?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ''}${resolvedSearchParams.location ? `&location=${resolvedSearchParams.location}` : ''}${resolvedSearchParams.remote ? `&remote=${resolvedSearchParams.remote}` : ''}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}