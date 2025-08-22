import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Building2, Briefcase, MapPin, Users } from 'lucide-react';

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic';

interface CompaniesPageProps {
  params: Promise<{ boardSlug: string }>;
}

async function getBoardCompanies(boardSlug: string) {
  const board = await prisma.jobBoard.findUnique({
    where: { slug: boardSlug, isActive: true },
    select: { id: true, name: true },
  });

  if (!board) return null;

  const companies = await prisma.organization.findMany({
    where: {
      jobBoards: {
        some: { jobBoardId: board.id }
      }
    },
    include: {
      _count: {
        select: {
          jobs: {
            where: {
              jobBoards: {
                some: { jobBoardId: board.id }
              }
            }
          }
        }
      },
      jobBoards: {
        where: { jobBoardId: board.id },
        select: { isFeatured: true, tier: true }
      }
    },
    orderBy: [
      { jobBoards: { _count: 'desc' } }, // Featured companies first
      { name: 'asc' }
    ],
  });

  return { board, companies };
}

export default async function CompaniesPage({ params }: CompaniesPageProps) {
  const resolvedParams = await params;
  const result = await getBoardCompanies(resolvedParams.boardSlug);

  if (!result) {
    notFound();
  }

  const { board, companies } = result;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h1 className="text-3xl font-bold mb-2">Companies Hiring on {board.name}</h1>
        <p className="text-gray-600">
          Discover {companies.length} companies with open positions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => {
          const boardRelation = company.jobBoards[0];
          const isFeatured = boardRelation?.isFeatured;

          return (
            <Link
              key={company.id}
              href={`/boards/${resolvedParams.boardSlug}/companies/${company.id}`}
              className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 ${
                isFeatured ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-16 h-16 rounded object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <h2 className="font-semibold text-lg mb-1 hover:text-blue-600 transition-colors">
                    {company.name}
                  </h2>
                  
                  {company.linkedinIndustry && (
                    <p className="text-sm text-gray-600 mb-2">{company.linkedinIndustry}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {company._count.jobs} job{company._count.jobs !== 1 ? 's' : ''}
                    </span>
                    
                    {company.linkedinSize && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {company.linkedinSize}
                      </span>
                    )}
                    
                    {company.linkedinHeadquarters && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {company.linkedinHeadquarters.split(',')[0]}
                      </span>
                    )}
                  </div>
                  
                  {isFeatured && (
                    <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {companies.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No companies found on this board yet.</p>
        </div>
      )}
    </div>
  );
}