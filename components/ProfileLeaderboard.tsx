'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { EmojiEvents, TrendingUp, TrendingDown } from '@mui/icons-material';
import { ProfilePerformance } from '@/lib/db';

interface ProfileLeaderboardProps {
  profiles: ProfilePerformance[];
  title?: string;
}

export default function ProfileLeaderboard({ profiles, title = "Top Performing Profiles" }: ProfileLeaderboardProps) {
  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <EmojiEvents sx={{ color: 'warning.main', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600} fontSize="1.125rem">
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No profile data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: number | null) => {
    if (trend === null) return <Typography variant="body2" color="text.secondary">—</Typography>;
    if (trend > 0) {
      return (
        <Box display="flex" alignItems="center" gap={0.5} color="success.main">
          <TrendingUp fontSize="small" />
          <Typography variant="body2" fontWeight={600}>+{trend.toFixed(1)}%</Typography>
        </Box>
      );
    }
    if (trend < 0) {
      return (
        <Box display="flex" alignItems="center" gap={0.5} color="error.main">
          <TrendingDown fontSize="small" />
          <Typography variant="body2" fontWeight={600}>{trend.toFixed(1)}%</Typography>
        </Box>
      );
    }
    return <Typography variant="body2" color="text.secondary">0%</Typography>;
  };

  const getProfileTypeBadge = (type: string) => {
    const colorMap: Record<string, 'primary' | 'error' | 'secondary' | 'success' | 'info' | 'warning' | 'default'> = {
      own: 'primary',
      competitor: 'error',
      inspiration: 'secondary',
      partner: 'success',
      team: 'info',
      other: 'default',
    };
    return colorMap[type] || 'default';
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return String(index + 1);
  };

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box display="flex" alignItems="center" gap={1} px={3} pt={3} pb={2}>
          <EmojiEvents sx={{ color: 'warning.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600} fontSize="1.125rem">
            {title}
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3 }}>Rank</TableCell>
                <TableCell>Profile</TableCell>
                <TableCell align="center">Posts</TableCell>
                <TableCell align="center">Avg Engagement</TableCell>
                <TableCell align="center">Engagement Rate</TableCell>
                <TableCell align="center">Viral Score</TableCell>
                <TableCell align="center" sx={{ pr: 3 }}>Trend (7d)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles.map((profile, index) => (
                <TableRow
                  key={profile.profile_id}
                  hover
                  sx={{ '&:last-child td': { border: 0 } }}
                >
                  <TableCell sx={{ pl: 3 }}>
                    <Typography variant="body2" fontSize="1.25rem" textAlign="center">
                      {getRankEmoji(index)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                        {profile.display_name}
                      </Typography>
                      <Box mt={0.5}>
                        <Chip
                          label={profile.profile_type}
                          size="small"
                          color={getProfileTypeBadge(profile.profile_type)}
                          sx={{ height: 20, fontSize: '0.6875rem', textTransform: 'capitalize' }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontSize="0.875rem" sx={{ fontFeatureSettings: '"tnum" 1' }}>
                      {profile.total_posts}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      fontSize="0.875rem"
                      color="info.main"
                      sx={{ fontFeatureSettings: '"tnum" 1' }}
                    >
                      {profile.avg_engagement_per_post.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      fontSize="0.875rem"
                      color="success.main"
                      sx={{ fontFeatureSettings: '"tnum" 1' }}
                    >
                      {profile.engagement_rate.toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      fontSize="0.875rem"
                      color="secondary.main"
                      sx={{ fontFeatureSettings: '"tnum" 1' }}
                    >
                      {profile.viral_score.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ pr: 3 }}>
                    <Box display="flex" justifyContent="center">
                      {getTrendIcon(profile.trend_percent)}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box px={3} pb={3} pt={2}>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            <strong>Engagement Rate:</strong> Average total engagement per post
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            <strong>Viral Score:</strong> Average shares per post (higher = more viral)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            <strong>Trend:</strong> Week-over-week engagement change
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
