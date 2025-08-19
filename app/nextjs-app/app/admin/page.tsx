import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './dashboard-client';

async function getStats() {
  const [totalJobs, totalOrganizations, remoteJobs, recentJobs] = await Promise.all([
    prisma.job.count(),
    prisma.organization.count(),
    prisma.job.count({ where: { isRemote: true } }),
    prisma.job.count({
      where: {
        datePosted: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const topOrganizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: { jobs: true },
      },
    },
    orderBy: {
      jobs: {
        _count: 'desc',
      },
    },
    take: 5,
  });

  return {
    totalJobs,
    totalOrganizations,
    remoteJobs,
    recentJobs,
    topOrganizations: topOrganizations.map((org) => ({
      id: org.id,
      name: org.name,
      logo: org.logo,
      jobCount: org._count.jobs,
    })),
  };
}

export default async function AdminDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const stats = await getStats();

  return <AdminDashboardClient stats={stats} />;
}