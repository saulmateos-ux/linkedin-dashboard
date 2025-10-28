'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ScrapeCompaniesButtonProps {
  companies: Array<{ id: number; display_name: string }>;
}

export default function ScrapeCompaniesButton({ companies }: ScrapeCompaniesButtonProps) {
  const [isScraping, setIsScraping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState<{
    scraped: number;
    updated: number;
    failed: number;
  } | null>(null);
  const router = useRouter();

  const handleScrape = async () => {
    if (companies.length === 0) {
      alert('No companies to scrape');
      return;
    }

    const confirmed = confirm(
      `Scrape background data for ${companies.length} companies?\n\n` +
      `This will fetch:\n` +
      `• Follower counts\n` +
      `• Company descriptions\n` +
      `• Industry\n` +
      `• Location\n` +
      `• Employee size\n` +
      `• Specialties\n\n` +
      `Cost: ~$0.008 per company (~$${(companies.length * 0.008).toFixed(2)} total)`
    );

    if (!confirmed) return;

    setIsScraping(true);
    setShowModal(false);

    try {
      const response = await fetch('/api/scrape-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyIds: companies.map(c => c.id),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          scraped: data.scraped,
          updated: data.updated,
          failed: data.failed,
        });
        setShowModal(true);
        router.refresh(); // Refresh to show updated data
      } else {
        alert(`Failed to scrape companies: ${data.error}`);
      }
    } catch (error) {
      console.error('Error scraping companies:', error);
      alert('Failed to scrape companies');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      <button
        onClick={handleScrape}
        disabled={isScraping || companies.length === 0}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isScraping || companies.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isScraping ? (
          <>
            <span className="inline-block animate-spin mr-2">⟳</span>
            Scraping...
          </>
        ) : (
          <>
            🔍 Scrape Company Data
          </>
        )}
      </button>

      {/* Result Modal */}
      {showModal && result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Company Scraping Complete! 🎉
            </h2>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✅ Scraped {result.scraped} companies successfully
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Updated {result.updated} company profiles with fresh data
                </p>
              </div>

              {result.failed > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ {result.failed} company update{result.failed !== 1 ? 's' : ''} failed
                  </p>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Data collected:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Follower counts</li>
                  <li>Company descriptions</li>
                  <li>Industry classifications</li>
                  <li>Headquarters locations</li>
                  <li>Employee size estimates</li>
                  <li>Company specialties</li>
                </ul>
              </div>

              <button
                onClick={() => setShowModal(false)}
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
