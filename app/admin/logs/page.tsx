import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

interface SearchParams {
  page?: string;
  status?: string;
  queryId?: string;
}

async function getLogs(userId: string, searchParams: SearchParams) {
  const page = parseInt(searchParams.page || '1');
  const limit = 50;
  const skip = (page - 1) * limit;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  
  // Filter by status
  if (searchParams.status) {
    where.status = searchParams.status;
  }
  
  // Filter by query
  if (searchParams.queryId) {
    where.savedQueryId = searchParams.queryId;
  } else {
    // Only show logs for queries created by this user
    where.savedQuery = {
      createdBy: userId,
    };
  }

  const [logs, total, queries] = await Promise.all([
    prisma.fetchLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        savedQuery: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.fetchLog.count({ where }),
    prisma.savedQuery.findMany({
      where: { createdBy: userId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    queries,
  };
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const { logs, total, page, totalPages, queries } = await getLogs(
    session.user.id,
    resolvedSearchParams
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fetch Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          View API fetch history and debug query execution
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <form method="get" className="flex gap-4 items-end">
          <div>
            <label htmlFor="queryId" className="block text-sm font-medium text-gray-700">
              Query
            </label>
            <select
              name="queryId"
              id="queryId"
              defaultValue={resolvedSearchParams.queryId}
              className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Queries</option>
              {queries.map((query) => (
                <option key={query.id} value={query.id}>
                  {query.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              id="status"
              defaultValue={resolvedSearchParams.status}
              className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Filter
          </button>
          
          <a
            href="/admin/logs"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear
          </a>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {logs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Query
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jobs Fetched
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.savedQuery ? (
                        <a
                          href={`/admin/queries/${log.savedQueryId}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {log.savedQuery.name}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.jobsFetched ? `${log.jobsFetched} jobs` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.duration ? `${log.duration}ms` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.errorMessage && (
                        <div className="max-w-xs">
                          <p className="text-red-600 truncate" title={log.errorMessage}>
                            {log.errorMessage}
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}${resolvedSearchParams.status ? `&status=${resolvedSearchParams.status}` : ''}${resolvedSearchParams.queryId ? `&queryId=${resolvedSearchParams.queryId}` : ''}`}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            <span className="px-3 py-2 text-sm font-medium text-gray-700">
              Page {page} of {totalPages} ({total} total logs)
            </span>
            {page < totalPages && (
              <a
                href={`?page=${page + 1}${resolvedSearchParams.status ? `&status=${resolvedSearchParams.status}` : ''}${resolvedSearchParams.queryId ? `&queryId=${resolvedSearchParams.queryId}` : ''}`}
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