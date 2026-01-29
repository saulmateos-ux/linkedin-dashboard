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
  const [scrapeMode, setScrapeMode] = useState<'new-only' | 'smart' | 'all'>('smart'); // Default to smart

  if (profiles.length === 0) {
    return null; // Don't show button if no profiles
  }

  // Filter profiles based on scrape mode
  const profilesToScrape = scrapeMode === 'new-only'
    ? profiles.filter(p => !p.last_scraped_at)
    : profiles; // 'smart' and 'all' include all profiles

  // Calculate preview stats based on filtered profiles
  const initialProfiles = profilesToScrape.filter(p => !p.last_scraped_at);
  const weeklyProfiles = profilesToScrape.filter(p => {
    if (!p.last_scraped_at) return false;
    const days = getDaysSince(p.last_scraped_at);
    return days !== null && days <= 7;
  });
  const catchupProfiles = profilesToScrape.filter(p => {
    if (!p.last_scraped_at) return false;
    const days = getDaysSince(p.last_scraped_at);
    return days !== null && days > 7 && days <= 30;
  });
  const refreshProfiles = profilesToScrape.filter(p => {
    if (!p.last_scraped_at) return false;
    const days = getDaysSince(p.last_scraped_at);
    return days !== null && days > 30;
  });

  // Calculate posts based on scrape mode
  let initialPosts, weeklyPosts, catchupPosts, refreshPosts, totalPosts;

  if (scrapeMode === 'all') {
    // All mode: scrape 100 posts from ALL profiles
    totalPosts = profilesToScrape.length * 100;
    initialPosts = totalPosts;
    weeklyPosts = 0;
    catchupPosts = 0;
    refreshPosts = 0;
  } else {
    // Smart mode or new-only: use smart batching
    initialPosts = initialProfiles.length * 100;
    weeklyPosts = weeklyProfiles.length * 7;
    catchupPosts = catchupProfiles.length * 30;
    refreshPosts = refreshProfiles.length * 100;
    totalPosts = initialPosts + weeklyPosts + catchupPosts + refreshPosts;
  }

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
      const profileIds = profilesToScrape.map(p => p.id);

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
        {buttonLabel} ({profilesToScrape.length})
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
                {scrapeMode === 'new-only' ? (
                  <>
                    You&apos;re about to scrape <span className="font-semibold text-blue-600">{profilesToScrape.length} new profile{profilesToScrape.length !== 1 ? 's' : ''}</span> (never scraped before):
                  </>
                ) : scrapeMode === 'smart' ? (
                  <>
                    You&apos;re about to scrape <span className="font-semibold text-purple-600">{profilesToScrape.length} profile{profilesToScrape.length !== 1 ? 's' : ''}</span> with <strong>smart batching</strong>:
                  </>
                ) : (
                  <>
                    You&apos;re about to scrape <span className="font-semibold">{profilesToScrape.length} profile{profilesToScrape.length !== 1 ? 's' : ''}</span> (100 posts each):
                  </>
                )}
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

              {/* Scrape Mode Selector */}
              {!loading && !success && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Scrape Strategy:
                  </label>

                  {/* Smart Mode (Default) */}
                  <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                       onClick={() => setScrapeMode('smart')}>
                    <input
                      type="radio"
                      id="smart"
                      name="scrapeMode"
                      checked={scrapeMode === 'smart'}
                      onChange={() => setScrapeMode('smart')}
                      className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300"
                    />
                    <label htmlFor="smart" className="flex-1 cursor-pointer">
                      <span className="block text-sm font-medium text-gray-900">
                        🧠 Smart Scraping (Recommended)
                      </span>
                      <span className="block text-xs text-gray-600 mt-0.5">
                        New profiles: 100 posts • Recent (≤7 days): 7 posts • Catch-up (8-30 days): 30 posts • Old (&gt;30 days): 100 posts
                      </span>
                    </label>
                  </div>

                  {/* New Only Mode */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                       onClick={() => setScrapeMode('new-only')}>
                    <input
                      type="radio"
                      id="new-only"
                      name="scrapeMode"
                      checked={scrapeMode === 'new-only'}
                      onChange={() => setScrapeMode('new-only')}
                      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label htmlFor="new-only" className="flex-1 cursor-pointer">
                      <span className="block text-sm font-medium text-gray-900">
                        ⚡ New Profiles Only
                      </span>
                      <span className="block text-xs text-gray-600 mt-0.5">
                        Only scrape profiles never scraped before (100 posts each)
                      </span>
                    </label>
                  </div>

                  {/* All Mode */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                       onClick={() => setScrapeMode('all')}>
                    <input
                      type="radio"
                      id="all"
                      name="scrapeMode"
                      checked={scrapeMode === 'all'}
                      onChange={() => setScrapeMode('all')}
                      className="mt-0.5 h-4 w-4 text-gray-600 border-gray-300"
                    />
                    <label htmlFor="all" className="flex-1 cursor-pointer">
                      <span className="block text-sm font-medium text-gray-900">
                        🔄 Full Refresh
                      </span>
                      <span className="block text-xs text-gray-600 mt-0.5">
                        Scrape ALL profiles with 100 posts each (most expensive)
                      </span>
                    </label>
                  </div>
                </div>
              )}

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

              {/* No New Profiles Warning */}
              {!loading && !success && scrapeMode === 'new-only' && profilesToScrape.length === 0 && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">ℹ️ No new profiles to scrape</p>
                  <p>All profiles have been scraped before. Switch to &quot;Smart Scraping&quot; or &quot;Full Refresh&quot; to re-scrape them.</p>
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
                disabled={loading || success !== '' || (scrapeMode === 'new-only' && profilesToScrape.length === 0)}
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
                ) : scrapeMode === 'new-only' && profilesToScrape.length === 0 ? (
                  'No New Profiles'
                ) : scrapeMode === 'smart' ? (
                  `🧠 Smart Scrape ${profilesToScrape.length}`
                ) : scrapeMode === 'new-only' ? (
                  `⚡ Scrape ${profilesToScrape.length} New`
                ) : (
                  `🔄 Full Refresh ${profilesToScrape.length}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
