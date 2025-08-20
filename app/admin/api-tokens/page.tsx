'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ApiToken {
  id: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/admin/tokens');
      if (!response.ok) throw new Error('Failed to fetch tokens');
      const data = await response.json();
      setTokens(data.tokens);
    } catch (err) {
      setError('Failed to load tokens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTokenName,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : null,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create token');
      
      const data = await response.json();
      setCreatedToken(data.token);
      setShowCreateForm(false);
      setNewTokenName('');
      setExpiresInDays('');
      await fetchTokens();
    } catch (err) {
      setError('Failed to create token');
      console.error(err);
    }
  };

  const revokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/tokens?id=${tokenId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to revoke token');
      
      await fetchTokens();
    } catch (err) {
      setError('Failed to revoke token');
      console.error(err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">API Tokens</h1>
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Admin
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {createdToken && (
          <div className="mb-6 rounded-lg bg-green-50 p-4">
            <h3 className="font-semibold text-green-900">Token Created Successfully!</h3>
            <p className="mt-2 text-sm text-green-700">
              Save this token securely. It will not be shown again:
            </p>
            <div className="mt-2 rounded bg-white p-3 font-mono text-sm">
              {createdToken}
            </div>
            <button
              onClick={() => setCreatedToken(null)}
              className="mt-3 text-sm text-green-600 hover:text-green-800"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Create New Token</h2>
          
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Generate New Token
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Token Name
                </label>
                <input
                  type="text"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  placeholder="e.g., Production API"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expires In (days) - Optional
                </label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="Leave empty for no expiration"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={createToken}
                  disabled={!newTokenName}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Create Token
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTokenName('');
                    setExpiresInDays('');
                  }}
                  className="rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Active Tokens</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : tokens.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No API tokens yet. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tokens.map((token) => (
                    <tr key={token.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {token.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatDate(token.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatDate(token.lastUsedAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatDate(token.expiresAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <button
                          onClick={() => revokeToken(token.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-2 font-semibold text-blue-900">How to use API tokens</h3>
          <p className="mb-3 text-sm text-blue-700">
            Include the token in the Authorization header of your API requests:
          </p>
          <div className="rounded bg-white p-3 font-mono text-sm">
            Authorization: Bearer rmj_your_token_here
          </div>
          <p className="mt-3 text-sm text-blue-700">
            Example with curl:
          </p>
          <div className="rounded bg-white p-3 font-mono text-sm">
            curl -H &quot;Authorization: Bearer rmj_your_token_here&quot; https://yourdomain.com/api/v1/jobs
          </div>
        </div>
      </div>
    </div>
  );
}