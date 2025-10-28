'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';

interface ScrapeBackgroundsButtonProps {
  profileIds?: number[];
  workspaceId?: number;
  onComplete?: () => void;
  autoRefresh?: boolean; // Auto-refresh the page on success
}

export default function ScrapeBackgroundsButton({
  profileIds,
  workspaceId,
  onComplete,
  autoRefresh = false,
}: ScrapeBackgroundsButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      profiles_updated: number;
      experiences_added: number;
      education_added: number;
    };
  } | null>(null);

  const handleScrape = async () => {
    setIsLoading(true);
    setShowModal(true);
    setResult(null);

    try {
      const response = await fetch('/api/scrape-backgrounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileIds,
          workspaceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape backgrounds');
      }

      setResult({
        success: true,
        message: data.message,
        stats: data.stats,
      });

      // Auto-refresh the page if requested
      if (autoRefresh) {
        router.refresh();
      }

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }

    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setResult(null);
  };

  return (
    <>
      <button
        onClick={handleScrape}
        disabled={isLoading || (!profileIds && !workspaceId)}
        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <User className="w-4 h-4" />
        {isLoading ? 'Scraping...' : 'Scrape Backgrounds'}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {isLoading ? 'Scraping Profile Backgrounds...' : 'Scraping Complete'}
            </h2>

            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
                <p className="text-gray-600 text-center">
                  This may take a few minutes...
                </p>
                <p className="text-sm text-gray-500 text-center">
                  Fetching LinkedIn profile data including work experience, education, skills, and more.
                </p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {result.success ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium">{result.message}</p>
                    </div>

                    {result.stats && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold text-gray-700">Statistics:</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>✅ Profiles updated: {result.stats.profiles_updated}</li>
                          <li>💼 Work experiences added: {result.stats.experiences_added}</li>
                          <li>🎓 Education entries added: {result.stats.education_added}</li>
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">Error:</p>
                    <p className="text-red-700 text-sm mt-1">{result.message}</p>
                  </div>
                )}

                <button
                  onClick={closeModal}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
