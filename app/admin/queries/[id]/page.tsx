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
  params: { id: string };
}) {
  const query = await getQuery(params.id);

  return <EditQueryClient query={query} />;
}