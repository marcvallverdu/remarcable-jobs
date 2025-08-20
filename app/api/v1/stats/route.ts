import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateBearerToken, unauthorizedResponse } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  // Validate API token
  const tokenValidation = await validateBearerToken(request);
  if (!tokenValidation.valid) {
    return unauthorizedResponse(tokenValidation.error);
  }

  try {
    const [
      totalJobs,
      totalOrganizations,
      remoteJobs,
      recentJobs,
      topLocations,
      topOrganizations,
      employmentTypes,
    ] = await Promise.all([
      prisma.job.count({ where: { expiredAt: null } }),
      prisma.organization.count(),
      prisma.job.count({ where: { isRemote: true, expiredAt: null } }),
      prisma.job.count({
        where: {
          datePosted: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          expiredAt: null,
        },
      }),
      prisma.job.findMany({
        select: { cities: true },
        where: { expiredAt: null },
        take: 1000,
      }).then((jobs) => {
        const locationCounts = new Map<string, number>();
        jobs.forEach((job) => {
          job.cities.forEach((city) => {
            locationCounts.set(city, (locationCounts.get(city) || 0) + 1);
          });
        });
        return Array.from(locationCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([city, count]) => ({ city, count }));
      }),
      prisma.organization.findMany({
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
        take: 10,
      }),
      prisma.job.findMany({
        select: { employmentType: true },
        where: { expiredAt: null },
        take: 1000,
      }).then((jobs) => {
        const typeCounts = new Map<string, number>();
        jobs.forEach((job) => {
          job.employmentType.forEach((type) => {
            typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
          });
        });
        return Array.from(typeCounts.entries()).map(([type, count]) => ({
          type,
          count,
        }));
      }),
    ]);
    
    return NextResponse.json({
      totalJobs,
      totalOrganizations,
      remoteJobs,
      recentJobs,
      topLocations,
      topOrganizations: topOrganizations.map((org) => ({
        id: org.id,
        name: org.name,
        logo: org.logo,
        jobCount: org._count.jobs,
      })),
      employmentTypes,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}