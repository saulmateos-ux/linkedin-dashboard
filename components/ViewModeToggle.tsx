'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type ViewMode = 'top' | 'recent';

interface ViewModeToggleProps {
  currentMode?: ViewMode;
}

export default function ViewModeToggle({ currentMode = 'top' }: ViewModeToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleModeChange = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());

    if (mode === 'recent') {
      params.set('view', 'recent');
    } else {
      params.delete('view'); // Default is 'top', so remove param
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
      <button
        onClick={() => handleModeChange('top')}
        className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all
          ${currentMode === 'top'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        ⭐ Top Posts
      </button>
      <button
        onClick={() => handleModeChange('recent')}
        className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all
          ${currentMode === 'recent'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        🕐 Recent Posts
      </button>
    </div>
  );
}
