import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Briefcase, Building2, ArrowRight } from 'lucide-react';

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic';

async function getActiveBoards() {
  const boards = await prisma.jobBoard.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          jobs: true,
          organizations: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return boards;
}

export default async function BoardsListingPage() {
  const boards = await getActiveBoards();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Job Boards
          </h1>
          <p className="text-xl text-gray-600">
            Browse our specialized job boards to find opportunities in your field
          </p>
        </div>

        {/* Boards Grid */}
        {boards.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.slug}`}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group"
              >
                {/* Board Header with Logo or Color */}
                <div 
                  className="h-32 flex items-center justify-center"
                  style={{ 
                    backgroundColor: board.primaryColor || '#3B82F6',
                  }}
                >
                  {board.logo ? (
                    <img 
                      src={board.logo} 
                      alt={board.name}
                      className="h-16 w-auto"
                    />
                  ) : (
                    <Briefcase className="w-12 h-12 text-white" />
                  )}
                </div>

                {/* Board Content */}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {board.name}
                  </h2>
                  
                  {board.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {board.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{board._count.jobs} jobs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{board._count.organizations} companies</span>
                    </div>
                  </div>

                  {/* View Board Link */}
                  <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all">
                    <span>View Board</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Job Boards Available
            </h2>
            <p className="text-gray-600 mb-6">
              Job boards are being set up. Please check back soon!
            </p>
            <Link
              href="/admin/boards"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <span>Go to Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}