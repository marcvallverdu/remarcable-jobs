import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import RunQueryButton from './RunQueryButton';

async function getQueries(userId: string) {
  const queries = await prisma.savedQuery.findMany({
    where: { createdBy: userId },
    include: {
      _count: {
        select: { fetchLogs: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return queries;
}

export default async function AdminQueriesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const queries = await getQueries(session.user.id);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Queries</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your saved job search queries
          </p>
        </div>
        <Link
          href="/admin/queries/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create New Query
        </Link>
      </div>

      {queries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No saved queries yet.</p>
          <Link
            href="/admin/queries/new"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-900"
          >
            Create your first query →
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {queries.map((query) => (
              <li key={query.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600">
                          {query.name}
                        </p>
                        {query.isActive && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      {query.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {query.description}
                        </p>
                      )}
                      <div className="mt-2 text-sm text-gray-500">
                        <p>
                          Last run: {query.lastRun ? new Date(query.lastRun).toLocaleDateString() : 'Never'}
                        </p>
                        <p>
                          Results: {query.resultCount || 0} jobs | 
                          Executions: {query._count.fetchLogs}
                        </p>
                      </div>
                      
                      {/* Display query parameters */}
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.entries(query.parameters as Record<string, unknown>).map(([key, value]) => {
                          if (value && value !== '') {
                            return (
                              <span key={key} className="inline-block mr-2">
                                {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col gap-2">
                      <RunQueryButton queryId={query.id} />
                      <Link
                        href={`/admin/queries/${query.id}`}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}