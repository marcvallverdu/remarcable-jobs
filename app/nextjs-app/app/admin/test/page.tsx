import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export default async function TestPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}