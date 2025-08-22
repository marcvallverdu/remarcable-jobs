import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

interface BoardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ boardSlug: string }>;
}

async function getBoard(slug: string) {
  if (!slug) {
    return null;
  }
  
  const board = await prisma.jobBoard.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          jobs: true,
          organizations: true,
        },
      },
    },
  });

  if (!board || !board.isActive) {
    return null;
  }

  return board;
}

export default async function BoardLayout({ children, params }: BoardLayoutProps) {
  const resolvedParams = await params;
  const board = await getBoard(resolvedParams.boardSlug);

  if (!board) {
    notFound();
  }

  // Use inline styles for dynamic theming in Server Components
  const primaryColor = board.primaryColor || '#3B82F6';

  return (
    <div className="min-h-screen bg-gray-50" style={{ '--board-primary-color': primaryColor } as React.CSSProperties}>

      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href={`/boards/${board.slug}`} className="flex items-center gap-3">
              {board.logo ? (
                <img 
                  src={board.logo} 
                  alt={board.name} 
                  className="h-8 w-auto"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Briefcase className="w-6 h-6" />
                </div>
              )}
              <span className="font-semibold text-xl">{board.name}</span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link 
                href={`/boards/${board.slug}`} 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Jobs
              </Link>
              <Link 
                href={`/boards/${board.slug}/companies`} 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Companies
              </Link>
              <Link 
                href={`/boards/${board.slug}/post-job`} 
                className="px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Post a Job
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="text-gray-600">
              © 2024 {board.name}. Powered by Remarcable Jobs.
            </div>
            <div className="text-sm text-gray-500">
              {board._count.jobs} jobs from {board._count.organizations} companies
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}