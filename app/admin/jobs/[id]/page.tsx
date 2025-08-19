import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import JobDetailClient from './job-detail-client';

async function getJob(id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      organization: true,
    },
  });

  if (!job) {
    notFound();
  }

  return job;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  return <JobDetailClient job={job} />;
}