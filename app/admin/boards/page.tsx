'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Globe, Users, Briefcase, Eye, EyeOff } from 'lucide-react';

interface JobBoard {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  logo: string | null;
  primaryColor: string | null;
  domain: string | null;
  _count: {
    jobs: number;
    organizations: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function JobBoardsPage() {
  const [boards, setBoards] = useState<JobBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<JobBoard | null>(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/admin/boards');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched boards:', data); // Debug log
        setBoards(data);
      } else {
        console.error('Failed to fetch boards, status:', response.status);
        const error = await response.json();
        console.error('Error details:', error);
      }
    } catch (error) {
      console.error('Failed to fetch job boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job board?')) return;
    
    try {
      const response = await fetch(`/api/admin/boards/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setBoards(boards.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete job board:', error);
    }
  };

  const toggleActive = async (board: JobBoard) => {
    try {
      const response = await fetch(`/api/admin/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !board.isActive }),
      });
      
      if (response.ok) {
        const updated = await response.json();
        setBoards(boards.map(b => b.id === board.id ? updated : b));
      }
    } catch (error) {
      console.error('Failed to toggle board status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading job boards...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Job Boards</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Board
        </button>
      </div>

      <div className="grid gap-6">
        {boards.map((board) => (
          <div
            key={board.id}
            className={`bg-white border rounded-lg p-6 shadow-sm ${
              !board.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-xl font-semibold">{board.name}</h2>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">/{board.slug}</code>
                  {!board.isActive && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                
                {board.description && (
                  <p className="text-gray-600 mb-4">{board.description}</p>
                )}
                
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{board._count.jobs} jobs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{board._count.organizations} organizations</span>
                  </div>
                  {board.domain && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span>{board.domain}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(board)}
                  className={`p-2 rounded-lg transition-colors ${
                    board.isActive
                      ? 'hover:bg-gray-100 text-gray-600'
                      : 'hover:bg-green-100 text-green-600'
                  }`}
                  title={board.isActive ? 'Deactivate' : 'Activate'}
                >
                  {board.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <Link
                  href={`/admin/boards/${board.id}`}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5 text-gray-600" />
                </Link>
                <button
                  onClick={() => handleDelete(board.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {boards.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No job boards created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Board
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateBoardModal
          board={editingBoard}
          onClose={() => {
            setShowCreateModal(false);
            setEditingBoard(null);
          }}
          onSuccess={(newBoard) => {
            if (editingBoard) {
              setBoards(boards.map(b => b.id === newBoard.id ? newBoard : b));
            } else {
              setBoards([newBoard, ...boards]);
            }
            setShowCreateModal(false);
            setEditingBoard(null);
          }}
        />
      )}
    </div>
  );
}

function CreateBoardModal({
  board,
  onClose,
  onSuccess,
}: {
  board: JobBoard | null;
  onClose: () => void;
  onSuccess: (board: JobBoard) => void;
}) {
  const [formData, setFormData] = useState({
    slug: board?.slug || '',
    name: board?.name || '',
    description: board?.description || '',
    logo: board?.logo || '',
    primaryColor: board?.primaryColor || '',
    domain: board?.domain || '',
    isActive: board?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = board ? `/api/admin/boards/${board.id}` : '/api/admin/boards';
      const method = board ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save job board');
      }
    } catch {
      setError('An error occurred while saving the job board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          {board ? 'Edit Job Board' : 'Create Job Board'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!board && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL path)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tech-jobs"
                required
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tech Jobs"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="A curated list of technology jobs..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL (optional)
            </label>
            <input
              type="url"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color (optional)
            </label>
            <input
              type="text"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#3B82F6"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Domain (optional)
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="techjobs.example.com"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active (visible to users)
            </label>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}