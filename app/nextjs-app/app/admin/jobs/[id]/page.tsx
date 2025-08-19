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
  params: { id: string };
}) {
  const job = await getJob(params.id);

  return <JobDetailClient job={job} />;
}