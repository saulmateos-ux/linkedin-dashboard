'use client';

import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { Lightbulb, Tag, AccessTime, Palette } from '@mui/icons-material';
import { ContentInsights as ContentInsightsType } from '@/lib/db';

interface ContentInsightsProps {
  insights: ContentInsightsType;
}

export default function ContentInsights({ insights }: ContentInsightsProps) {
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getMediaTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      image: '🖼️',
      video: '📹',
      document: '📄',
      carousel: '🎠',
      text: '📝',
    };
    return icons[type.toLowerCase()] || '📝';
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Lightbulb sx={{ color: 'warning.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600} fontSize="1.125rem">
            Content Performance Insights
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Top Hashtags */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                borderRadius: 1.5,
                p: 2,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderLeftWidth: 3,
                borderLeftColor: 'info.main',
                height: '100%',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Tag sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600} fontSize="0.875rem" color="text.secondary">
                  Top Hashtags
                </Typography>
              </Box>
              {insights.top_hashtags.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {insights.top_hashtags.map((hashtag, index) => (
                    <Box key={hashtag.hashtag} display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" fontWeight={500} color="text.disabled" fontSize="0.6875rem">
                          #{index + 1}
                        </Typography>
                        <Typography variant="body2" fontWeight={500} fontSize="0.875rem" color="info.main">
                          {hashtag.hashtag}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          fontSize="0.75rem"
                          sx={{ fontFeatureSettings: '"tnum" 1' }}
                        >
                          {hashtag.avg_engagement.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" fontSize="0.6875rem">
                          {hashtag.count} posts
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                  No hashtag data available
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Best Posting Times */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                borderRadius: 1.5,
                p: 2,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderLeftWidth: 3,
                borderLeftColor: 'success.main',
                height: '100%',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600} fontSize="0.875rem" color="text.secondary">
                  Best Times to Post
                </Typography>
              </Box>
              {insights.best_posting_times.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {insights.best_posting_times.map((time, index) => (
                    <Box key={`${time.day}-${time.hour}`} display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" fontWeight={500} color="text.disabled" fontSize="0.6875rem">
                          #{index + 1}
                        </Typography>
                        <Box>
                          <Typography variant="body2" fontWeight={500} fontSize="0.875rem" color="success.main">
                            {time.day}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontSize="0.6875rem">
                            {formatHour(time.hour)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          fontSize="0.75rem"
                          sx={{ fontFeatureSettings: '"tnum" 1' }}
                        >
                          {time.avg_engagement.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" fontSize="0.6875rem">
                          {time.post_count} posts
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                  Insufficient data (need 2+ posts per time slot)
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Content Type Performance */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                borderRadius: 1.5,
                p: 2,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderLeftWidth: 3,
                borderLeftColor: 'primary.main',
                height: '100%',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Palette sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600} fontSize="0.875rem" color="text.secondary">
                  Content Types
                </Typography>
              </Box>
              {insights.content_type_performance.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {insights.content_type_performance.map((type, index) => (
                    <Box key={type.media_type} display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" fontWeight={500} color="text.disabled" fontSize="0.6875rem">
                          #{index + 1}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="body2" fontSize="1rem">
                            {getMediaTypeIcon(type.media_type)}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            fontSize="0.875rem"
                            color="primary.main"
                            sx={{ textTransform: 'capitalize' }}
                          >
                            {type.media_type}
                          </Typography>
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          fontSize="0.75rem"
                          sx={{ fontFeatureSettings: '"tnum" 1' }}
                        >
                          {type.avg_engagement.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" fontSize="0.6875rem">
                          {type.post_count} posts
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                  No content type data available
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        <Box mt={3}>
          <Typography variant="caption" color="text.secondary" fontSize="0.76171875rem">
            📊 All metrics show average engagement per post over the last 30 days
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
