'use client';

import { useState } from 'react';

interface ScrapeProfileButtonProps {
  profileId: number;
  profileName: string;
  onScrapeComplete?: () => void;
}

export default function ScrapeProfileButton({
  profileId,
  profileName,
  onScrapeComplete,
}: ScrapeProfileButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScrape = async () => {
    // Clear previous states
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    setProgress('Starting scrape...');

    try {
      const response = await fetch(`/api/profiles/${profileId}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPosts: 100 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape profile');
      }

      const data = await response.json();

      // Check if it's a warning (0 posts found)
      if (data.warning) {
        setError(data.message || 'No posts found');
        setProgress('');
        console.error('Scrape warning:', data);
        console.error('Debug info:', data.debugInfo);
        return;
      }

      setSuccess(
        `✅ Scraped ${data.results.totalScraped} posts (${data.results.newPosts} new, ${data.results.updatedPosts} updated)`
      );
      setProgress('');

      // Call the callback to refresh the page
      if (onScrapeComplete) {
        setTimeout(() => {
          onScrapeComplete();
        }, 2000);
      }
    } catch (err) {
      console.error('Scrape error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scrape profile');
      setProgress('');
    } finally {
      setIsLoading(false);
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleScrape}
        disabled={isLoading}
        className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          isLoading
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : success
            ? 'bg-green-100 text-green-700 border border-green-300'
            : error
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {isLoading ? (
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
          <span className="flex items-center justify-center gap-2">
            <span>✅</span>
            <span>Scraped!</span>
          </span>
        ) : error ? (
          <span className="flex items-center justify-center gap-2">
            <span>❌</span>
            <span>Failed</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>🔄</span>
            <span>Scrape Posts</span>
          </span>
        )}
      </button>

      {/* Progress/Status Message */}
      {progress && (
        <p className="text-xs text-gray-600 text-center">{progress}</p>
      )}

      {/* Success Message */}
      {success && !isLoading && (
        <p className="text-xs text-green-600 text-center">{success}</p>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
