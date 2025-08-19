import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  // Temporarily log the user data to debug
  console.log('Admin Layout - User data:', JSON.stringify(session.user, null, 2));

  // Check if user is admin - might need to query the database directly
  // if (!session.user.isAdmin) {
  //   redirect('/unauthorized');
  // }

  return <>{children}</>;
}