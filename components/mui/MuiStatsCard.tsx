'use client';

import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface MuiStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number | null;
  trendLabel?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

export default function MuiStatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel = 'vs last week',
  color = 'primary',
}: MuiStatsCardProps) {
  const getTrendDisplay = () => {
    if (trend === null || trend === undefined) {
      return null;
    }

    const isPositive = trend > 0;
    const isNegative = trend < 0;

    return (
      <Chip
        label={`${isPositive ? '+' : ''}${trend.toFixed(1)}% ${trendLabel}`}
        size="small"
        color={isPositive ? 'success' : isNegative ? 'error' : 'default'}
        icon={isPositive ? <TrendingUp /> : isNegative ? <TrendingDown /> : undefined}
        sx={{ mt: 1, height: 24 }}
      />
    );
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box flex={1}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom
              sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, fontSize: '0.75rem' }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              fontWeight={700}
              color={`${color}.main`}
              sx={{ fontFeatureSettings: '"tnum" 1', fontSize: '1.75rem', mb: 0.5 }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {subtitle}
              </Typography>
            )}
            {getTrendDisplay()}
          </Box>
          {icon && (
            <Box
              sx={{
                bgcolor: `${color}.main`,
                color: 'white',
                width: 44,
                height: 44,
                borderRadius: 2.5, // 10px - more rounded than cards for visual distinction
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0px 2px 6px 0px rgba(76, 78, 100, 0.22)',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
