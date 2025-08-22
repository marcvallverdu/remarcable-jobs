import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Briefcase, Calendar, Building2, Globe, Users, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic';

interface JobDetailPageProps {
  params: Promise<{ 
    boardSlug: string;
    id: string;
  }>;
}

async function getJobDetails(jobId: string, boardSlug: string) {
  const board = await prisma.jobBoard.findUnique({
    where: { slug: boardSlug, isActive: true },
    select: { id: true, slug: true, primaryColor: true },
  });

  if (!board) return null;

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      jobBoards: {
        some: { jobBoardId: board.id }
      }
    },
    include: {
      organization: true,
    },
  });

  if (!job) return null;

  return { job, board };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const resolvedParams = await params;
  const result = await getJobDetails(resolvedParams.id, resolvedParams.boardSlug);

  if (!result) {
    notFound();
  }

  const { job, board } = result;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link 
        href={`/boards/${resolvedParams.boardSlug}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to jobs
      </Link>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="flex items-start gap-4 mb-6">
          {job.organization.logo && (
            <img
              src={job.organization.logo}
              alt={job.organization.name}
              className="w-16 h-16 rounded object-contain"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {job.organization.name}
              </span>
              {job.organization.url && (
                <a 
                  href={job.organization.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  <Globe className="w-4 h-4" />
                  Company website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b">
          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Location</h3>
            <div className="flex flex-wrap items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              {job.isRemote && (
                <span className="text-green-600 font-medium">Remote</span>
              )}
              {job.cities.length > 0 && (
                <span>{job.cities.join(', ')}</span>
              )}
              {job.countries.length > 0 && !job.cities.length && (
                <span>{job.countries.join(', ')}</span>
              )}
            </div>
          </div>

          {/* Employment Type */}
          {job.employmentType.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Employment Type</h3>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span>{job.employmentType.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Posted Date */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Posted</h3>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                {formatDistanceToNow(new Date(job.datePosted), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Valid Through */}
          {job.dateValidThrough && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Apply By</h3>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {format(new Date(job.dateValidThrough), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Apply Button */}
        <div className="mt-6">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: board.primaryColor || '#3B82F6' }}
          >
            Apply for this position
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Company Info */}
      {(job.organization.linkedinDescription || job.organization.linkedinIndustry) && (
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold mb-4">About {job.organization.name}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {job.organization.linkedinIndustry && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Industry</h3>
                <p>{job.organization.linkedinIndustry}</p>
              </div>
            )}
            
            {job.organization.linkedinSize && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Company Size</h3>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{job.organization.linkedinSize}</span>
                </div>
              </div>
            )}
            
            {job.organization.linkedinHeadquarters && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Headquarters</h3>
                <p>{job.organization.linkedinHeadquarters}</p>
              </div>
            )}
            
            {job.organization.linkedinFoundedDate && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Founded</h3>
                <p>{job.organization.linkedinFoundedDate}</p>
              </div>
            )}
          </div>
          
          {job.organization.linkedinDescription && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {job.organization.linkedinDescription}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Job Description */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-semibold mb-4">Job Description</h2>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-700">
            {job.descriptionText}
          </div>
        </div>
      </div>
    </div>
  );
}