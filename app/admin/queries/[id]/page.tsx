import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import EditQueryClient from './edit-client';

async function getQuery(id: string) {
  const query = await prisma.savedQuery.findUnique({
    where: { id },
    include: {
      fetchLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!query) {
    notFound();
  }

  return query;
}

export default async function EditQueryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const query = await getQuery(id);

  return <EditQueryClient query={query} />;
}