import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';

// Force dynamic rendering since we need database access
export const dynamic = 'force-dynamic';

interface PostJobPageProps {
  params: Promise<{ boardSlug: string }>;
}

async function getBoard(boardSlug: string) {
  const board = await prisma.jobBoard.findUnique({
    where: { slug: boardSlug, isActive: true },
    select: { id: true, name: true, primaryColor: true },
  });

  return board;
}

export default async function PostJobPage({ params }: PostJobPageProps) {
  const resolvedParams = await params;
  const board = await getBoard(resolvedParams.boardSlug);

  if (!board) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h1 className="text-3xl font-bold mb-4">Post a Job on {board.name}</h1>
        <p className="text-gray-600 mb-8">
          Reach thousands of qualified candidates looking for their next opportunity.
        </p>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Basic Listing</h2>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">$99</span>
              <span className="text-gray-500">/ 30 days</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>30-day job listing</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Company logo display</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Direct application link</span>
              </li>
            </ul>
            <button 
              className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled
            >
              Coming Soon
            </button>
          </div>

          <div className="border-2 border-blue-500 rounded-lg p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded text-sm">
              Most Popular
            </span>
            <h2 className="text-xl font-semibold mb-2">Featured Listing</h2>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">$299</span>
              <span className="text-gray-500">/ 30 days</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Everything in Basic</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Featured badge</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Top placement in listings</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                <span>Weekly bumps to top</span>
              </li>
            </ul>
            <button 
              className="w-full py-2 text-white rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: board.primaryColor || '#3B82F6' }}
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold mb-2">🚀 Paid job listings coming soon!</h3>
          <p className="text-gray-700">
            We&apos;re working on enabling employers to post jobs directly. In the meantime, 
            jobs are curated and added by our team. Contact us if you&apos;d like to be notified 
            when this feature launches.
          </p>
        </div>
      </div>
    </div>
  );
}