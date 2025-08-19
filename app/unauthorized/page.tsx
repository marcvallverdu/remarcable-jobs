export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403 - Unauthorized</h1>
        <p className="text-gray-600 mb-8">You don&apos;t have permission to access this page.</p>
        <a
          href="/login"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}