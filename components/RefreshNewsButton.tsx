'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function RefreshNewsButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    articlesProcessed?: number;
    duration?: string;
    errors?: string[];
    message?: string;
  } | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setShowModal(true);
    setResult(null);

    try {
      const response = await fetch('/api/cron/aggregate', {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to refresh news');
      }

      setResult({
        success: true,
        articlesProcessed: data.articlesProcessed,
        duration: data.duration,
        errors: data.errors,
      });

      // Refresh the page after a short delay to show new articles
      setTimeout(() => {
        router.refresh();
      }, 2000);

    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Fetching...' : 'Refresh News'}
      </button>

      {/* Result Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isLoading ? 'Fetching Latest News...' : 'Refresh Complete'}
              </h2>
              {!isLoading && (
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                >
                  ×
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    Fetching latest articles from RSS feeds...
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
                    This may take up to 2 minutes
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  {result.success ? (
                    <>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-green-800 dark:text-green-300 font-medium">
                          ✅ Successfully fetched latest news!
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                          Statistics:
                        </h3>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>
                            📰 Articles processed:{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {result.articlesProcessed}
                            </span>
                          </li>
                          <li>
                            ⏱️ Duration:{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {result.duration}
                            </span>
                          </li>
                          {result.errors && result.errors.length > 0 && (
                            <li className="text-yellow-600 dark:text-yellow-400">
                              ⚠️ Errors: {result.errors.length}
                            </li>
                          )}
                        </ul>
                      </div>

                      {result.errors && result.errors.length > 0 && (
                        <details className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <summary className="text-sm font-medium text-yellow-800 dark:text-yellow-300 cursor-pointer">
                            View Errors ({result.errors.length})
                          </summary>
                          <ul className="mt-2 text-xs text-yellow-700 dark:text-yellow-400 space-y-1 max-h-40 overflow-y-auto">
                            {result.errors.map((error, i) => (
                              <li key={i}>• {error}</li>
                            ))}
                          </ul>
                        </details>
                      )}

                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Page will refresh automatically to show new articles...
                      </p>
                    </>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-red-800 dark:text-red-300 font-medium">
                        ❌ Error:
                      </p>
                      <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                        {result.message}
                      </p>
                    </div>
                  )}

                  {!isLoading && (
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
