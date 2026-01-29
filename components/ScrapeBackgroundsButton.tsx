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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [onlyNew, setOnlyNew] = useState(true); // Default to true for efficiency
  const [newProfileCount, setNewProfileCount] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      profiles_updated: number;
      experiences_added: number;
      education_added: number;
    };
  } | null>(null);

  // Calculate profile count
  const profileCount = profileIds?.length || 0;

  // Calculate new profile count when modal opens or checkbox changes
  const calculateNewProfiles = async (checkOnlyNew: boolean = onlyNew) => {
    if (!checkOnlyNew) {
      setNewProfileCount(profileCount);
      return;
    }

    setIsCalculating(true);
    try {
      const response = await fetch('/api/profiles/new-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileIds, workspaceId }),
      });

      const data = await response.json();
      if (response.ok) {
        setNewProfileCount(data.count);
      }
    } catch (error) {
      console.error('Error calculating new profiles:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmScrape = async () => {
    setIsLoading(true);
    setShowConfirmModal(false);
    setShowResultModal(true);
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
          onlyNew, // Send the filter preference
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

  const closeResultModal = () => {
    setShowResultModal(false);
    setResult(null);
  };

  const estimatedCost = profileCount * 0.004; // $4 per 1k profiles

  return (
    <>
      <button
        onClick={() => {
          setShowConfirmModal(true);
          calculateNewProfiles(); // Calculate when modal opens
        }}
        disabled={isLoading || (!profileIds && !workspaceId)}
        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <User className="w-4 h-4" />
        Scrape Backgrounds
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Scrape Profile Backgrounds</h2>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                {onlyNew ? (
                  <>
                    Scrape backgrounds from <span className="font-semibold text-blue-600">new profiles only</span> (never scraped before)
                    {isCalculating && <span className="ml-2 text-sm text-gray-500">Calculating...</span>}
                    {!isCalculating && newProfileCount !== null && (
                      <span className="ml-2 text-sm font-semibold text-gray-900">
                        ({newProfileCount} {newProfileCount === 1 ? 'profile' : 'profiles'})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Scrape backgrounds from <span className="font-semibold">all {profileCount} profile(s)</span>
                  </>
                )}
              </p>

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium mb-2">This will fetch:</p>
                <ul className="space-y-1 ml-4">
                  <li>💼 Work experience & job history</li>
                  <li>🎓 Education & degrees</li>
                  <li>💡 Skills & endorsements</li>
                  <li>🏆 Certifications & awards</li>
                  <li>🌐 Languages & location</li>
                </ul>
              </div>

              {/* Only New Profiles Checkbox */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="onlyNew"
                  checked={onlyNew}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setOnlyNew(checked);
                    setNewProfileCount(null); // Reset count
                    calculateNewProfiles(checked); // Recalculate with new value
                  }}
                  className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="onlyNew" className="flex-1 cursor-pointer">
                  <span className="block text-sm font-medium text-gray-900">
                    ⚡ Only scrape new profiles
                  </span>
                  <span className="block text-xs text-gray-600 mt-0.5">
                    Skip profiles with existing background data (saves time & credits!)
                  </span>
                </label>
              </div>

              {/* Cost Warning */}
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium mb-1">⚠️ This will use Apify credits</p>
                {onlyNew ? (
                  <>
                    {isCalculating ? (
                      <p>Calculating cost...</p>
                    ) : newProfileCount !== null ? (
                      <>
                        <p>Estimated cost: ~${(newProfileCount * 0.004).toFixed(2)} USD</p>
                        <p className="text-xs mt-1">({newProfileCount} new {newProfileCount === 1 ? 'profile' : 'profiles'} × $0.004)</p>
                      </>
                    ) : (
                      <>
                        <p>Estimated cost: Variable (depends on # of new profiles)</p>
                        <p className="text-xs mt-1">Only profiles without background data will be processed</p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p>Estimated cost: ~${estimatedCost.toFixed(2)} USD</p>
                    <p className="text-xs mt-1">({profileCount} profiles × $0.004)</p>
                  </>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmScrape}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
              >
                {onlyNew ? 'Scrape New Only' : `Scrape All ${profileCount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
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
                  onClick={closeResultModal}
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
