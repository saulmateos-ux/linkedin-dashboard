'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncCompaniesButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{
    linked: number;
    unmatched: string[];
  } | null>(null);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    setShowResult(false);

    try {
      const response = await fetch('/api/companies/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          linked: data.linked,
          unmatched: data.unmatched,
        });
        setShowResult(true);
        router.refresh(); // Refresh to show updated counts
      } else {
        alert('Failed to sync companies');
      }
    } catch (error) {
      console.error('Error syncing companies:', error);
      alert('Failed to sync companies');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isSyncing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSyncing ? (
          <>
            <span className="inline-block animate-spin mr-2">⟳</span>
            Syncing...
          </>
        ) : (
          <>
            🔗 Sync Companies
          </>
        )}
      </button>

      {/* Result Modal */}
      {showResult && result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Company Sync Complete
            </h2>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✅ Successfully linked {result.linked} profile{result.linked !== 1 ? 's' : ''} to companies
                </p>
              </div>

              {result.unmatched.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium mb-2">
                    ⚠️ {result.unmatched.length} profile{result.unmatched.length !== 1 ? 's' : ''} could not be matched:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc max-h-40 overflow-y-auto">
                    {result.unmatched.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setShowResult(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
