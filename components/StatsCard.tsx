'use client';

import { NumberTicker } from '@/components/ui/number-ticker';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

export default function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <div
      className="rounded-lg p-6 transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderLeft: '3px solid var(--color-accent-blue)',
        border: '1px solid var(--color-border-default)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
          <div
            className="text-3xl font-bold mt-2"
            style={{
              color: 'var(--color-text-primary)',
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            {typeof value === 'number' ? (
              <NumberTicker value={value} />
            ) : (
              <span>{value}</span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-4xl">{icon}</div>
        )}
      </div>
    </div>
  );
}
