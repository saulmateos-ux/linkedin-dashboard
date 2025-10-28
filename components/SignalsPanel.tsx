'use client';

import { IntelligenceSignal } from '@/lib/intelligence';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export default function SignalsPanel({ signals }: { signals: IntelligenceSignal[] }) {
  const [localSignals, setLocalSignals] = useState(signals);

  const priorityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      badge: 'bg-red-100 text-red-800',
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      text: 'text-orange-900',
      badge: 'bg-orange-100 text-orange-800',
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-900',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800',
    },
  };

  const handleAcknowledge = async (signalId: number) => {
    try {
      const response = await fetch(`/api/news/signals/${signalId}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Remove from local state
        setLocalSignals((prev) => prev.filter((s) => s.id !== signalId));
      }
    } catch (error) {
      console.error('Failed to acknowledge signal:', error);
    }
  };

  return (
    <div className="sticky top-6">
      <h2 className="text-xl font-bold mb-4">🚨 Intelligence Signals</h2>

      {localSignals.length === 0 ? (
        <div className="border rounded-lg p-4 text-center text-gray-500">
          <p className="text-sm">No new signals</p>
          <p className="text-xs mt-1">All clear! 👍</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localSignals.map((signal) => {
            const config = priorityConfig[signal.priority];

            return (
              <div
                key={signal.id}
                className={`border-l-4 rounded p-3 ${config.bg} ${config.border}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`font-semibold text-sm ${config.text}`}>
                    {signal.title}
                  </span>
                  <span
                    className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${config.badge}`}
                  >
                    {signal.priority}
                  </span>
                </div>

                {signal.description && (
                  <p className="text-xs mb-2 text-gray-700 line-clamp-2">
                    {signal.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-600">
                    {signal.detected_at &&
                      formatDistanceToNow(new Date(signal.detected_at))} ago
                  </div>

                  <button
                    onClick={() => signal.id && handleAcknowledge(signal.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {localSignals.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          {localSignals.length} unacknowledged signal
          {localSignals.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
