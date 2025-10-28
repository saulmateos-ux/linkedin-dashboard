'use client';

import { NumberTicker } from '@/components/ui/number-ticker';

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: number | null;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'purple' | 'yellow';
}

export default function EnhancedStatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel = 'vs last week',
  color = 'blue',
}: EnhancedStatsCardProps) {
  const getTrendDisplay = () => {
    if (trend === null || trend === undefined) {
      return null;
    }

    const isPositive = trend > 0;
    const isNegative = trend < 0;
    const trendColor = isPositive
      ? 'var(--color-accent-green)'
      : isNegative
        ? 'var(--color-accent-red)'
        : 'var(--color-text-tertiary)';
    const icon = isPositive ? '↑' : isNegative ? '↓' : '→';

    return (
      <div className="flex items-center gap-1 text-sm font-medium" style={{ color: trendColor }}>
        <span>{icon}</span>
        <span>{Math.abs(trend).toFixed(1)}%</span>
        <span className="text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>{trendLabel}</span>
      </div>
    );
  };

  // Low-light aesthetic color styles
  const colorStyles: Record<typeof color, React.CSSProperties> = {
    blue: {
      backgroundColor: 'var(--color-bg-card)',
      borderLeft: '3px solid var(--color-accent-blue)',
      borderColor: 'var(--color-border-default)',
    },
    green: {
      backgroundColor: 'var(--color-bg-card)',
      borderLeft: '3px solid var(--color-accent-green)',
      borderColor: 'var(--color-border-default)',
    },
    purple: {
      backgroundColor: 'var(--color-bg-card)',
      borderLeft: '3px solid var(--color-accent-purple)',
      borderColor: 'var(--color-border-default)',
    },
    yellow: {
      backgroundColor: 'var(--color-bg-card)',
      borderLeft: '3px solid var(--color-accent-yellow)',
      borderColor: 'var(--color-border-default)',
    },
  };

  return (
    <div
      className="rounded-lg border p-6 transition-all duration-200 hover:shadow-lg"
      style={{
        ...colorStyles[color],
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{title}</h3>
          </div>
          <div className="text-3xl font-bold mb-1" style={{
            color: 'var(--color-text-primary)',
            fontFeatureSettings: '"tnum" 1',
          }}>
            {typeof value === 'number' ? (
              <NumberTicker value={value} />
            ) : (
              <span>{value}</span>
            )}
          </div>
          {subtitle && <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{subtitle}</p>}
          {trend !== null && trend !== undefined && (
            <div className="mt-2">{getTrendDisplay()}</div>
          )}
        </div>
      </div>
    </div>
  );
}
