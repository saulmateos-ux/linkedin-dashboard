'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const LIMIT_OPTIONS = [10, 25, 50, 100];

export default function LimitSelector({ currentLimit }: { currentLimit: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleLimitChange = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', newLimit.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="limit-select" className="text-sm text-gray-600 font-medium">
        Show:
      </label>
      <select
        id="limit-select"
        value={currentLimit}
        onChange={(e) => handleLimitChange(parseInt(e.target.value))}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        {LIMIT_OPTIONS.map((limit) => (
          <option key={limit} value={limit}>
            {limit} posts
          </option>
        ))}
      </select>
    </div>
  );
}
