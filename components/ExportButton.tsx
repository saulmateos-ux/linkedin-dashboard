'use client';

import { useState } from 'react';

interface ExportButtonProps {
  search?: string;
  sortBy?: string;
  order?: string;
}

export default function ExportButton({ search = '', sortBy = 'published_at', order = 'desc' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('sortBy', sortBy);
      params.set('order', order);

      // Trigger download
      const url = `/api/export?${params.toString()}`;
      window.location.href = url;

      // Reset loading state after a delay
      setTimeout(() => {
        setIsExporting(false);
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      alert('Failed to export posts. Please try again.');
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isExporting
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isExporting ? (
        <>
          <span className="inline-block animate-spin mr-2">⚙️</span>
          Exporting...
        </>
      ) : (
        <>
          📥 Export CSV
        </>
      )}
    </button>
  );
}
