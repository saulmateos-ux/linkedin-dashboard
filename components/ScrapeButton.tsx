'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ScrapeButtonProps {
  profileId: number;
  profileName: string;
}

export default function ScrapeButton({ profileId, profileName }: ScrapeButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [maxPosts, setMaxPosts] = useState(100);

  const handleScrape = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          maxPosts,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to scrape posts');
      }

      // Success!
      setSuccess(`Scrape complete! ${data.newPosts} new posts, ${data.updatedPosts} updated`);

      // Wait a moment to show success message, then refresh
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

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
      >
        <span className="text-lg">🔄</span>
        Scrape Posts
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Scrape LinkedIn Posts</h2>
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
                Scrape posts from <span className="font-semibold">{profileName}</span>
              </p>

              {/* Max Posts Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Posts to Scrape
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={maxPosts}
                  onChange={(e) => setMaxPosts(parseInt(e.target.value))}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 50-100 posts. Higher values may take longer and cost more.
                </p>
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
                  <p>Estimated cost: ~${(maxPosts * 0.002).toFixed(2)} USD</p>
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
                onClick={handleScrape}
                disabled={loading || success !== ''}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Scraping...' : success ? '✓ Done' : 'Start Scrape'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
