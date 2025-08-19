'use client';

import { signOut } from '@/lib/auth/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Props {
  session: {
    user?: {
      id: string;
      email?: string;
    };
  };
}

export default function AdminNav({ session }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/jobs', label: 'Jobs' },
    { href: '/admin/organizations', label: 'Organizations' },
    { href: '/admin/queries', label: 'Queries' },
    { href: '/admin/logs', label: 'Logs' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.href)
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              View Site
            </Link>
            <span className="text-sm text-gray-700">
              {session.user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
        
        {/* Mobile navigation */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(item.href)
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}