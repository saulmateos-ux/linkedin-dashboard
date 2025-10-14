'use client';

import { useState } from 'react';

export default function RefreshButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [maxPosts, setMaxPosts] = useState(10); // Default to 10

  const handleRefresh = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxPosts: maxPosts,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || 'Scrape completed successfully!');
        // Reload the page after a short delay to show the new data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error || data.message || 'Scrape failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to trigger scrape');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Posts count dropdown */}
      <div className="flex items-center space-x-2">
        <label htmlFor="maxPosts" className="text-sm text-gray-600 font-medium">
          Posts:
        </label>
        <select
          id="maxPosts"
          value={maxPosts}
          onChange={(e) => setMaxPosts(Number(e.target.value))}
          disabled={isLoading}
          className={`
            px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          `}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={500}>500</option>
        </select>
      </div>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm transition-all
          ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Scraping...
          </span>
        ) : (
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </span>
        )}
      </button>

      {message && (
        <div className="text-sm text-green-600 font-medium">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 font-medium">
          ✗ {error}
        </div>
      )}
    </div>
  );
}
