import { getStats, getTopPosts, getEngagementOverTime } from '@/lib/db';
import StatsCard from '@/components/StatsCard';
import EngagementChart from '@/components/EngagementChart';
import PostsTable from '@/components/PostsTable';
import RefreshButton from '@/components/RefreshButton';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  // Fetch all data in parallel
  const [stats, topPosts, engagementData] = await Promise.all([
    getStats(),
    getTopPosts(10),
    getEngagementOverTime(30),
  ]);

  return (
    <div className="space-y-8">
      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <RefreshButton />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Posts"
          value={stats.total_posts}
          icon="📝"
        />
        <StatsCard
          title="Total Likes"
          value={stats.total_likes}
          subtitle={`Avg: ${stats.avg_likes} per post`}
          icon="👍"
        />
        <StatsCard
          title="Total Comments"
          value={stats.total_comments}
          subtitle={`Avg: ${stats.avg_comments} per post`}
          icon="💬"
        />
        <StatsCard
          title="Total Shares"
          value={stats.total_shares}
          subtitle={`Avg: ${stats.avg_shares} per post`}
          icon="🔄"
        />
      </div>

      {/* Engagement Chart */}
      <EngagementChart data={engagementData} />

      {/* Top Posts Table */}
      <PostsTable posts={topPosts} title="Top 10 Posts" />
    </div>
  );
}
