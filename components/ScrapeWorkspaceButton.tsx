'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ScrapeWorkspaceButtonProps {
  workspaceName: string;
  workspaceId: number;
  profileCount: number;
}

export default function ScrapeWorkspaceButton({ workspaceName, workspaceId, profileCount }: ScrapeWorkspaceButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [maxPosts, setMaxPosts] = useState(50);
  const [onlyNew, setOnlyNew] = useState(true); // Default to true for efficiency

  const handleScrapeWorkspace = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          maxPosts,
          onlyNew, // Smart filter for new profiles only
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to scrape workspace');
      }

      // Success!
      setSuccess(`Scrape complete! ${data.newPosts} new posts, ${data.updatedPosts} updated`);

      // Refresh and close after showing success
      setTimeout(() => {
        router.refresh();
        setIsModalOpen(false);
        setSuccess('');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (profileCount === 0) {
    return null; // Don't show button if no profiles
  }

  const estimatedCost = profileCount * maxPosts * 0.002;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center gap-2"
      >
        <span className="text-lg">🔄</span>
        Scrape Workspace
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Scrape Workspace</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                {onlyNew ? (
                  <>
                    Scrape posts from <span className="font-semibold text-blue-600">new profiles only</span> in <span className="font-semibold" style={{ color: '#10b981' }}>{workspaceName}</span>
                  </>
                ) : (
                  <>
                    Scrape posts from <span className="font-semibold">all {profileCount} profile(s)</span> in <span className="font-semibold" style={{ color: '#10b981' }}>{workspaceName}</span>
                  </>
                )}
              </p>

              {/* Max Posts Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Posts per Profile
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={maxPosts}
                  onChange={(e) => setMaxPosts(parseInt(e.target.value))}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {onlyNew ? (
                    <>Only profiles that haven't been scraped yet (skips already-scraped profiles)</>
                  ) : (
                    <>Apify will scrape {profileCount} profiles in parallel (up to 6 at a time)</>
                  )}
                </p>
              </div>

              {/* Only New Profiles Checkbox */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="onlyNew"
                  checked={onlyNew}
                  onChange={(e) => setOnlyNew(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                />
                <label htmlFor="onlyNew" className="flex-1 cursor-pointer">
                  <span className="block text-sm font-medium text-gray-900">
                    ⚡ Only scrape new profiles
                  </span>
                  <span className="block text-xs text-gray-600 mt-0.5">
                    Skip profiles that have already been scraped (saves time & credits!)
                  </span>
                </label>
              </div>

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                  ✓ {success}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Warning */}
              {!loading && !success && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">⚠️ This will use Apify credits</p>
                  {onlyNew ? (
                    <>
                      <p>Estimated cost: Variable (depends on # of new profiles)</p>
                      <p className="text-xs mt-1">Only profiles without prior scrapes will be processed</p>
                    </>
                  ) : (
                    <>
                      <p>Estimated cost: ~${estimatedCost.toFixed(2)} USD</p>
                      <p className="text-xs mt-1">({profileCount} profiles × {maxPosts} posts × $0.002)</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScrapeWorkspace}
                disabled={loading || success !== ''}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Scraping...' : success ? '✓ Done' : onlyNew ? 'Scrape New Only' : `Scrape All ${profileCount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
