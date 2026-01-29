import { Suspense } from 'react';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import DynamicMain from '@/components/DynamicMain';
import { getStats, getEngagementOverTime, getProfiles, getPrimaryProfile, getWorkspace, getWorkspaceStats, getWorkspacePosts, getWorkspaceProfiles, getEnhancedStats, getProfilePerformanceLeaderboard, getContentInsights, getTopPostsEnhanced, getYouTubeStats } from '@/lib/db';
import Link from 'next/link';

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
  const validLimit = [10, 25, 50, 100].includes(limit) ? limit : 25;

  // Determine view mode
  const viewMode = viewParam === 'recent' ? 'recent' : 'top';

  // Check if workspace is selected
  const workspaceId = workspaceIdParam ? parseInt(workspaceIdParam) : null;
  const workspace = workspaceId ? await getWorkspace(workspaceId) : null;

  // Get profiles
  const profiles = workspace
    ? await getWorkspaceProfiles(workspace.id)
    : await getProfiles();

  // Determine which profile to show
  let currentProfileId: number | null = null;
  if (profileIdParam && profileIdParam !== 'all') {
    currentProfileId = parseInt(profileIdParam);
  } else if (!profileIdParam && profiles.length > 0 && !workspace) {
    const primaryProfile = await getPrimaryProfile();
    if (primaryProfile) {
      currentProfileId = primaryProfile.id;
    }
  }

  // Fetch data based on workspace or profile
  const ytStats = await getYouTubeStats(workspaceId);

  let stats, enhancedStats, topPosts;

  if (workspace) {
    const workspaceStats = await getWorkspaceStats(workspace.id);
    const sortBy = viewMode === 'recent' ? 'published_at' : 'engagement_total';
    const order = viewMode === 'recent' ? 'desc' : 'desc';

    [enhancedStats, topPosts] = await Promise.all([
      getEnhancedStats(null, workspace.id),
      getTopPostsEnhanced({
        limit: validLimit,
        workspaceId: workspace.id,
        sortBy,
        order
      }),
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
  } else {
    const sortBy = viewMode === 'recent' ? 'published_at' : 'engagement_total';
    const order = viewMode === 'recent' ? 'desc' : 'desc';

    [stats, enhancedStats, topPosts] = await Promise.all([
      getStats(currentProfileId),
      getEnhancedStats(currentProfileId, null),
      getTopPostsEnhanced({
        limit: validLimit,
        profileId: currentProfileId,
        sortBy,
        order
      }),
    ]);
  }

  return (
    <>
      <AppHeader />
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <DynamicMain>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                {workspace ? `${workspace.name} Dashboard` : 'LinkedIn Analytics Dashboard'}
              </h2>
              {workspace && (
                <span className="text-sm text-gray-500 dark:text-gray-400" style={{ color: workspace.color }}>
                  Viewing workspace: {workspace.name}
                </span>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
              {/* Total Posts */}
              <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                  <svg className="fill-primary dark:fill-white" width="22" height="18" viewBox="0 0 22 18" fill="none">
                    <path d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751Z"/>
                  </svg>
                </div>
                <div className="mt-4">
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {stats.total_posts}
                  </h4>
                  <span className="text-sm font-medium">Total Posts</span>
                </div>
              </div>

              {/* Engagement Rate */}
              <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                  <svg className="fill-primary dark:fill-white" width="20" height="22" viewBox="0 0 20 22" fill="none">
                    <path d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.0937 16.4312 11.7531 16.4312Z"/>
                  </svg>
                </div>
                <div className="mt-4">
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {enhancedStats.engagement_rate.toFixed(1)}
                  </h4>
                  <span className="text-sm font-medium">Engagement Rate</span>
                  {enhancedStats.week_over_week_engagement_change && (
                    <span className={`text-xs ${enhancedStats.week_over_week_engagement_change > 0 ? 'text-meta-3' : 'text-meta-1'}`}>
                      {enhancedStats.week_over_week_engagement_change > 0 ? '+' : ''}{enhancedStats.week_over_week_engagement_change.toFixed(1)}% vs last week
                    </span>
                  )}
                </div>
              </div>

              {/* Total Likes */}
              <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                  <svg className="fill-primary dark:fill-white" width="22" height="18" viewBox="0 0 22 18" fill="none">
                    <path d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751Z"/>
                  </svg>
                </div>
                <div className="mt-4">
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {stats.total_likes}
                  </h4>
                  <span className="text-sm font-medium">Total Likes</span>
                </div>
              </div>

              {/* Total Comments */}
              <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                  <svg className="fill-primary dark:fill-white" width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 3.02816 21.3813 3.89066 21.3813H18.1094C18.9719 21.3813 19.8 21.0031 20.3844 20.3844C20.9688 19.7656 21.2094 18.9063 21.1063 18.0469Z"/>
                  </svg>
                </div>
                <div className="mt-4">
                  <h4 className="text-title-md font-bold text-black dark:text-white">
                    {stats.total_comments}
                  </h4>
                  <span className="text-sm font-medium">Total Comments</span>
                </div>
              </div>
            </div>

            {/* YouTube Stats Card */}
            {ytStats.total_videos > 0 && (
              <div className="mb-6">
                <Link href={workspaceId ? `/youtube?workspace=${workspaceId}` : '/youtube'}>
                  <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark hover:shadow-lg transition-shadow">
                    <h4 className="text-lg font-semibold text-black dark:text-white mb-3">YouTube</h4>
                    <div className="flex gap-6 text-sm">
                      <span><strong>{ytStats.total_videos}</strong> videos</span>
                      <span><strong>{ytStats.total_channels}</strong> channels</span>
                      <span><strong>{ytStats.with_transcripts}</strong> transcripts</span>
                      <span><strong>{ytStats.total_views.toLocaleString()}</strong> views</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Top Posts Table */}
            <div className="rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="mb-5 flex items-center justify-between">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  {viewMode === 'recent' ? 'Recent' : 'Top'} {validLimit} Posts
                </h4>
                <div className="flex gap-2">
                  <Link
                    href={`/?view=top&limit=${validLimit}`}
                    className={`rounded px-3 py-1.5 text-sm ${viewMode === 'top' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 dark:bg-meta-4 dark:text-white'}`}
                  >
                    Top Posts
                  </Link>
                  <Link
                    href={`/?view=recent&limit=${validLimit}`}
                    className={`rounded px-3 py-1.5 text-sm ${viewMode === 'recent' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 dark:bg-meta-4 dark:text-white'}`}
                  >
                    Recent Posts
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Content</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Author</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Published</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Likes</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Comments</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Shares</th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts && topPosts.map((post) => (
                      <tr key={post.id} className="border-b border-[#eee] dark:border-strokedark">
                        <td className="px-4 py-5">
                          <p className="text-sm text-black dark:text-white line-clamp-2">
                            {post.content?.substring(0, 100)}...
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-black dark:text-white">{post.author_name}</p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-black dark:text-white">
                            {new Date(post.published_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-black dark:text-white">{post.likes}</p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-black dark:text-white">{post.comments}</p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-black dark:text-white">{post.shares}</p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm font-medium text-meta-3">{post.engagement_total}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DynamicMain>
      </div>
    </>
  );
}
