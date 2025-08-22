import { prisma } from '@/lib/db/prisma';
import JobsManagementClient from './jobs-management-client';

interface SearchParams {
  page?: string;
  search?: string;
  organization?: string;
  remote?: string;
  dateFrom?: string;
  dateTo?: string;
  showExpired?: string;
  sortBy?: string;
}

async function getJobs(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const skip = (page - 1) * limit;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  
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
  
  // Expired jobs filter - admin can choose to include or exclude
  if (searchParams.showExpired === 'only') {
    where.expiredAt = { not: null };
  } else if (searchParams.showExpired !== 'true') {
    // By default, only show active jobs unless explicitly requested
    where.expiredAt = null;
  }

  // Parse sort parameter
  const sortBy = searchParams.sortBy || 'createdAt_desc';
  const [sortField, sortOrder] = sortBy.split('_') as [string, 'asc' | 'desc'];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any = {};
  orderBy[sortField] = sortOrder;

  const [jobs, total, organizations] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      include: {
        organization: true,
      },
      orderBy,
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
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const { jobs, total, page, totalPages, organizations } = await getJobs(resolvedSearchParams);

  return (
    <JobsManagementClient
      initialJobs={jobs}
      total={total}
      page={page}
      totalPages={totalPages}
      organizations={organizations}
      searchParams={resolvedSearchParams}
    />
  );
}