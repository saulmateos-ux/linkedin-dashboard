'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EngagementChartProps {
  data: Array<{
    date: string;
    likes: number;
    comments: number;
    shares: number;
  }>;
}

export default function EngagementChart({ data }: EngagementChartProps) {
  return (
    <div
      className="rounded-lg p-6 border transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border-default)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      }}
    >
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Engagement Over Time
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
            stroke="rgba(255, 255, 255, 0.2)"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
            stroke="rgba(255, 255, 255, 0.2)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
              borderRadius: '8px',
              color: 'var(--color-text-primary)',
            }}
            labelStyle={{ color: 'var(--color-text-primary)' }}
          />
          <Legend
            wrapperStyle={{ color: 'var(--color-text-primary)' }}
          />
          <Line
            type="monotone"
            dataKey="likes"
            stroke="var(--color-accent-green)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-accent-green)', r: 4 }}
            name="Likes"
          />
          <Line
            type="monotone"
            dataKey="comments"
            stroke="var(--color-accent-blue)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-accent-blue)', r: 4 }}
            name="Comments"
          />
          <Line
            type="monotone"
            dataKey="shares"
            stroke="var(--color-accent-yellow)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-accent-yellow)', r: 4 }}
            name="Shares"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
