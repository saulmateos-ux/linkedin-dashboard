import { getStats, getEngagementOverTime, getProfiles, getPrimaryProfile, getWorkspace, getWorkspaceStats, getWorkspacePosts, getWorkspaceProfiles, getEnhancedStats, getProfilePerformanceLeaderboard, getContentInsights, getTopPostsEnhanced } from '@/lib/db';
import MuiStatsCard from '@/components/mui/MuiStatsCard';
import MuiEngagementChart from '@/components/mui/MuiEngagementChart';
import MuiPostsTable from '@/components/mui/MuiPostsTable';
import ProfileLeaderboard from '@/components/ProfileLeaderboard';
import ContentInsights from '@/components/ContentInsights';
import ViewModeToggle from '@/components/ViewModeToggle';
import RefreshButton from '@/components/RefreshButton';
import ProfileSelector from '@/components/ProfileSelector';
import LimitSelector from '@/components/LimitSelector';
import Link from 'next/link';
import { Box, Grid, Typography, Card, CardContent, Button } from '@mui/material';
import { Article, TrendingUp, Rocket, Comment } from '@mui/icons-material';

export const revalidate = 3600; // Revalidate every hour

// Helper function to calculate engagement over time from posts
function calculateEngagementOverTime(posts: unknown[], days: number) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const engagementByDate: Record<string, { date: string; likes: number; comments: number; shares: number; total: number }> = {};

  posts.forEach((postUnknown) => {
    const post = postUnknown as { published_at: string; likes?: number; comments?: number; shares?: number; engagement_total?: number };
    const publishedAt = new Date(post.published_at);
    if (publishedAt >= startDate) {
      const dateKey = publishedAt.toISOString().split('T')[0];
      if (!engagementByDate[dateKey]) {
        engagementByDate[dateKey] = { date: dateKey, likes: 0, comments: 0, shares: 0, total: 0 };
      }
      engagementByDate[dateKey].likes += post.likes || 0;
      engagementByDate[dateKey].comments += post.comments || 0;
      engagementByDate[dateKey].shares += post.shares || 0;
      engagementByDate[dateKey].total += (post.engagement_total || 0);
    }
  });

  return Object.values(engagementByDate).sort((a, b) => a.date.localeCompare(b.date));
}

interface PageProps {
  searchParams: Promise<{ profile?: string; workspace?: string; limit?: string; view?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const profileIdParam = params.profile;
  const workspaceIdParam = params.workspace;
  const limitParam = params.limit;
  const viewParam = params.view;

  // Parse limit with default of 25
  const limit = limitParam ? parseInt(limitParam) : 25;
  // Validate limit (must be one of the allowed values)
  const validLimit = [10, 25, 50, 100].includes(limit) ? limit : 25;

  // Determine view mode (top or recent)
  const viewMode = viewParam === 'recent' ? 'recent' : 'top';

  // Check if workspace is selected
  const workspaceId = workspaceIdParam ? parseInt(workspaceIdParam) : null;
  const workspace = workspaceId ? await getWorkspace(workspaceId) : null;

  // Get profiles (filtered by workspace if applicable)
  const profiles = workspace
    ? await getWorkspaceProfiles(workspace.id)
    : await getProfiles();

  // Determine which profile to show
  let currentProfileId: number | null = null;
  if (profileIdParam && profileIdParam !== 'all') {
    currentProfileId = parseInt(profileIdParam);
  } else if (!profileIdParam && profiles.length > 0 && !workspace) {
    // Default to primary profile if no param and no workspace
    const primaryProfile = await getPrimaryProfile();
    if (primaryProfile) {
      currentProfileId = primaryProfile.id;
    }
  }

  // Fetch data based on workspace or profile
  let stats, enhancedStats, topPosts, engagementData, profileLeaderboard, contentInsights;

  if (workspace) {
    // Fetch workspace-specific data with enhanced analytics
    const workspaceStats = await getWorkspaceStats(workspace.id);

    // Determine sort based on view mode
    const sortBy = viewMode === 'recent' ? 'published_at' : 'engagement_total';
    const order = viewMode === 'recent' ? 'desc' : 'desc';

    [enhancedStats, topPosts, profileLeaderboard, contentInsights] = await Promise.all([
      getEnhancedStats(null, workspace.id),
      getTopPostsEnhanced({
        limit: validLimit,
        workspaceId: workspace.id,
        sortBy,
        order
      }),
      getProfilePerformanceLeaderboard(workspace.id, 5),
      getContentInsights(null, workspace.id),
    ]);

    stats = {
      total_posts: workspaceStats.total_posts,
      total_likes: workspaceStats.total_likes,
      total_comments: workspaceStats.total_comments,
      total_shares: workspaceStats.total_shares,
      avg_likes: workspaceStats.avg_likes,
      avg_comments: workspaceStats.avg_comments,
      avg_shares: workspaceStats.avg_shares,
    };

    // Get engagement over time for workspace (get all posts and calculate)
    const { posts: allWorkspacePosts } = await getWorkspacePosts(workspace.id, { limit: 999999 });
    engagementData = calculateEngagementOverTime(allWorkspacePosts, 30);
  } else {
    // Fetch data for selected profile (or all if null) with enhanced analytics
    const sortBy = viewMode === 'recent' ? 'published_at' : 'engagement_total';
    const order = viewMode === 'recent' ? 'desc' : 'desc';

    [stats, enhancedStats, topPosts, engagementData, profileLeaderboard, contentInsights] = await Promise.all([
      getStats(currentProfileId),
      getEnhancedStats(currentProfileId, null),
      getTopPostsEnhanced({
        limit: validLimit,
        profileId: currentProfileId,
        sortBy,
        order
      }),
      getEngagementOverTime(30, currentProfileId),
      getProfilePerformanceLeaderboard(null, 5),
      getContentInsights(currentProfileId, null),
    ]);
  }

  const currentProfile = currentProfileId
    ? profiles.find(p => p.id === currentProfileId)
    : null;

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header with Profile Selector */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Dashboard Overview
          </Typography>
          {workspace ? (
            <Typography variant="body2" color="text.secondary">
              Showing data for workspace: <Box component="span" fontWeight={600} color={workspace.color}>{workspace.name}</Box>
            </Typography>
          ) : currentProfile ? (
            <Typography variant="body2" color="text.secondary">
              Showing data for: <Box component="span" fontWeight={600}>{currentProfile.display_name}</Box>
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">Showing data for all profiles</Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <ProfileSelector profiles={profiles} currentProfileId={currentProfileId} />
          <RefreshButton />
        </Box>
      </Box>

      {/* NEW: AI Insights Banner */}
      <Card
        component={Link}
        href="/insights"
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          cursor: 'pointer',
          textDecoration: 'none',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={3}>
              <Typography variant="h1" sx={{ fontSize: '3rem' }}>🤖</Typography>
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Try the NEW AI LinkedIn Assistant!
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Get instant AI-powered insights about your LinkedIn performance
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                fontWeight: 600,
              }}
            >
              Ask AI →
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Enhanced Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}> {/* spacing={3} = 24px gaps */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MuiStatsCard
            title="Total Posts"
            value={stats.total_posts}
            icon={<Article sx={{ fontSize: 28 }} />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MuiStatsCard
            title="Engagement Rate"
            value={enhancedStats.engagement_rate.toFixed(1)}
            subtitle="per post"
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            trend={enhancedStats.week_over_week_engagement_change}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MuiStatsCard
            title="Viral Score"
            value={enhancedStats.viral_score.toFixed(2)}
            subtitle="shares per post"
            icon={<Rocket sx={{ fontSize: 28 }} />}
            trend={enhancedStats.week_over_week_posts_change}
            trendLabel="posts vs LW"
            color="secondary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MuiStatsCard
            title="Conversation Rate"
            value={`${enhancedStats.conversation_rate.toFixed(1)}%`}
            subtitle="comments/likes ratio"
            icon={<Comment sx={{ fontSize: 28 }} />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Engagement Chart */}
      <Box mb={4}>
        <MuiEngagementChart data={engagementData} />
      </Box>

      {/* Profile Performance Leaderboard - Only show if multiple profiles */}
      {profileLeaderboard && profileLeaderboard.length > 1 && (
        <Box mb={4}>
          <ProfileLeaderboard
            profiles={profileLeaderboard}
            title={workspace ? "Top Performers in Workspace" : "Top Performing Profiles (Last 30 Days)"}
          />
        </Box>
      )}

      {/* Content Insights */}
      <Box mb={4}>
        <ContentInsights insights={contentInsights} />
      </Box>

      {/* Posts Table with View Mode Toggle and Limit Selector */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight={600}>
              {viewMode === 'recent' ? 'Recent' : 'Top'} {validLimit} Posts
            </Typography>
            <ViewModeToggle currentMode={viewMode} />
          </Box>
          <LimitSelector currentLimit={validLimit} />
        </Box>
        <MuiPostsTable
          posts={topPosts}
          title={viewMode === 'recent' ? `Recent ${validLimit} Posts` : `Top ${validLimit} Posts`}
        />
      </Box>
    </Box>
  );
}
