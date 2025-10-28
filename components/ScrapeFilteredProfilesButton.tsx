'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/db';

interface ScrapeFilteredProfilesButtonProps {
  profiles: Profile[];
  filterType?: string;
}

// Helper function to calculate days since last scrape
function getDaysSince(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const last = new Date(date);
  const diffMs = now.getTime() - last.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default function ScrapeFilteredProfilesButton({
  profiles,
  filterType
}: ScrapeFilteredProfilesButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (profiles.length === 0) {
    return null; // Don't show button if no profiles
  }

  // Calculate preview stats
  const initialProfiles = profiles.filter(p => !p.last_scraped_at);
  const weeklyProfiles = profiles.filter(p => {
    if (!p.last_scraped_at) return false;
    const days = getDaysSince(p.last_scraped_at);
    return days !== null && days <= 7;
  });
  const catchupProfiles = profiles.filter(p => {
    if (!p.last_scraped_at) return false;
    const days = getDaysSince(p.last_scraped_at);
    return days !== null && days > 7 && days <= 30;
  });
  const refreshProfiles = profiles.filter(p => {
    if (!p.last_scraped_at) return false;
    const days = getDaysSince(p.last_scraped_at);
    return days !== null && days > 30;
  });

  const initialPosts = initialProfiles.length * 100;
  const weeklyPosts = weeklyProfiles.length * 7;
  const catchupPosts = catchupProfiles.length * 30;
  const refreshPosts = refreshProfiles.length * 100;
  const totalPosts = initialPosts + weeklyPosts + catchupPosts + refreshPosts;
  const estimatedCost = totalPosts * 0.002;

  // Button label based on filter
  let buttonLabel = 'Scrape All';
  if (filterType && filterType !== '') {
    const typeLabels: Record<string, string> = {
      'own': 'Own',
      'competitor': 'Competitors',
      'inspiration': 'Inspiration',
      'partner': 'Partners',
      'team': 'Team',
      'other': 'Other'
    };
    buttonLabel = `Scrape ${typeLabels[filterType] || filterType}`;
  }

  const handleScrape = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const profileIds = profiles.map(p => p.id);

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to scrape profiles');
      }

      // Success!
      setSuccess(`✅ Scraped ${data.newPosts} new posts, ${data.updatedPosts} updated`);

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

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center gap-2"
      >
        <span className="text-lg">🔄</span>
        {buttonLabel} ({profiles.length})
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {buttonLabel}
              </h2>
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
                You&apos;re about to scrape <span className="font-semibold">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</span> with smart batching:
              </p>

              {/* Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {initialProfiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      • {initialProfiles.length} initial scrape{initialProfiles.length !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-gray-900">
                      {initialPosts} posts
                    </span>
                  </div>
                )}
                {weeklyProfiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      • {weeklyProfiles.length} weekly update{weeklyProfiles.length !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-gray-900">
                      {weeklyPosts} posts
                    </span>
                  </div>
                )}
                {catchupProfiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      • {catchupProfiles.length} catch-up scrape{catchupProfiles.length !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium text-gray-900">
                      {catchupPosts} posts
                    </span>
                  </div>
                )}
                {refreshProfiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      • {refreshProfiles.length} full refresh{refreshProfiles.length !== 1 ? 'es' : ''}
                    </span>
                    <span className="font-medium text-gray-900">
                      {refreshPosts} posts
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{totalPosts} posts</span>
                </div>
              </div>

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {success}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Cost Warning */}
              {!loading && !success && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">⚠️ Apify Credits Required</p>
                  <p>Estimated cost: ~${estimatedCost.toFixed(2)} USD</p>
                  <p className="text-xs mt-1">({totalPosts} posts × $0.002 per post)</p>
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
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Scraping...
                  </span>
                ) : success ? (
                  '✅ Done'
                ) : (
                  `Scrape ${profiles.length}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
