'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  currentSearch?: string;
  currentSort?: string;
  currentOrder?: string;
}

export default function SearchBar({ currentSearch = '', currentSort = 'published_at', currentOrder = 'desc' }: SearchBarProps) {
  const [search, setSearch] = useState(currentSearch);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sortBy', currentSort);
    params.set('order', currentOrder);
    router.push(`/posts?${params.toString()}`);
  };

  const handleSortChange = (sortBy: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sortBy', sortBy);
    params.set('order', currentOrder);
    router.push(`/posts?${params.toString()}`);
  };

  const handleOrderToggle = () => {
    const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sortBy', currentSort);
    params.set('order', newOrder);
    router.push(`/posts?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts by content or author..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>

        {/* Sort Select */}
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="published_at">Sort by Date</option>
          <option value="likes">Sort by Likes</option>
          <option value="comments">Sort by Comments</option>
          <option value="shares">Sort by Shares</option>
          <option value="engagement_total">Sort by Total Engagement</option>
        </select>

        {/* Order Toggle */}
        <button
          onClick={handleOrderToggle}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
        >
          {currentOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
        </button>
      </div>
    </div>
  );
}
