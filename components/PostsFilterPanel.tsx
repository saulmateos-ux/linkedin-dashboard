'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PostsFilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    minLikes: searchParams.get('minLikes') || '',
    minComments: searchParams.get('minComments') || '',
    minShares: searchParams.get('minShares') || '',
    minEngagement: searchParams.get('minEngagement') || '',
    mediaType: searchParams.get('mediaType') || '',
    hashtag: searchParams.get('hashtag') || '',
  });

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);

    // Add/update filter params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Preserve existing params
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order');
    const search = searchParams.get('search');
    const workspace = searchParams.get('workspace');
    const profile = searchParams.get('profile');

    if (sortBy) params.set('sortBy', sortBy);
    if (order) params.set('order', order);
    if (search) params.set('search', search);
    if (workspace) params.set('workspace', workspace);
    if (profile) params.set('profile', profile);

    params.set('page', '1'); // Reset to page 1

    router.push(`/posts?${params.toString()}`);
    setIsExpanded(false);
  };

  const handleClearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      minLikes: '',
      minComments: '',
      minShares: '',
      minEngagement: '',
      mediaType: '',
      hashtag: '',
    });

    // Keep only non-filter params
    const params = new URLSearchParams();
    const sortBy = searchParams.get('sortBy');
    const order = searchParams.get('order');
    const search = searchParams.get('search');
    const workspace = searchParams.get('workspace');
    const profile = searchParams.get('profile');

    if (sortBy) params.set('sortBy', sortBy);
    if (order) params.set('order', order);
    if (search) params.set('search', search);
    if (workspace) params.set('workspace', workspace);
    if (profile) params.set('profile', profile);

    router.push(`/posts?${params.toString()}`);
    setIsExpanded(false);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-900">Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Engagement Thresholds */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Min Likes</label>
              <input
                type="number"
                min="0"
                value={filters.minLikes}
                onChange={(e) => setFilters({ ...filters, minLikes: e.target.value })}
                placeholder="e.g., 100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Min Comments</label>
              <input
                type="number"
                min="0"
                value={filters.minComments}
                onChange={(e) => setFilters({ ...filters, minComments: e.target.value })}
                placeholder="e.g., 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Min Shares</label>
              <input
                type="number"
                min="0"
                value={filters.minShares}
                onChange={(e) => setFilters({ ...filters, minShares: e.target.value })}
                placeholder="e.g., 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Min Total Engagement</label>
              <input
                type="number"
                min="0"
                value={filters.minEngagement}
                onChange={(e) => setFilters({ ...filters, minEngagement: e.target.value })}
                placeholder="e.g., 200"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Media Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Media Type</label>
              <select
                value={filters.mediaType}
                onChange={(e) => setFilters({ ...filters, mediaType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Types</option>
                <option value="text">Text Only</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="carousel">Carousel</option>
                <option value="poll">Poll</option>
                <option value="document">Document</option>
              </select>
            </div>

            {/* Hashtag Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Hashtag</label>
              <input
                type="text"
                value={filters.hashtag}
                onChange={(e) => setFilters({ ...filters, hashtag: e.target.value })}
                placeholder="e.g., #marketing"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
