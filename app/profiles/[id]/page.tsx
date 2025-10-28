import { getProfile, getStats, getTopPosts, getEngagementOverTime } from '@/lib/db';
import { notFound } from 'next/navigation';
import StatsCard from '@/components/StatsCard';
import EngagementChart from '@/components/EngagementChart';
import PostsTable from '@/components/PostsTable';
import ScrapeButton from '@/components/ScrapeButton';
import Link from 'next/link';

export const revalidate = 0; // Disable cache to see scraped posts immediately

interface PageProps {
  params: Promise<{ id: string }>;
}

const typeColors = {
  own: 'bg-green-100 text-green-800 border-green-200',
  team: 'bg-purple-100 text-purple-800 border-purple-200',
  competitor: 'bg-red-100 text-red-800 border-red-200',
  inspiration: 'bg-blue-100 text-blue-800 border-blue-200',
  partner: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

const typeIcons = {
  own: '👤',
  team: '👥',
  competitor: '⚔️',
  inspiration: '💡',
  partner: '🤝',
  other: '📌',
};

export default async function ProfileDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profileId = parseInt(id);

  if (isNaN(profileId)) {
    notFound();
  }

  const profile = await getProfile(profileId);

  if (!profile) {
    notFound();
  }

  // Fetch profile-specific data
  const [stats, topPosts, engagementData] = await Promise.all([
    getStats(profileId),
    getTopPosts(10, profileId),
    getEngagementOverTime(30, profileId),
  ]);

  const colorClass = typeColors[profile.profile_type] || typeColors.other;
  const icon = typeIcons[profile.profile_type] || typeIcons.other;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <Link
          href="/profiles"
          className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block hover:underline"
        >
          ← Back to Profiles
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{profile.display_name}</h1>
              {profile.is_primary && (
                <span className="text-2xl" title="Primary Profile">⭐</span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                {icon} {profile.profile_type.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 text-lg">@{profile.username}</p>
            {profile.headline && (
              <p className="text-gray-700 mt-3 text-base">{profile.headline}</p>
            )}
            {profile.industry && (
              <p className="text-gray-600 mt-2 text-sm">
                <span className="font-medium">Industry:</span> {profile.industry}
              </p>
            )}
            {profile.follower_count && (
              <p className="text-gray-600 mt-1 text-sm">
                <span className="font-medium">{profile.follower_count.toLocaleString()}</span> followers
              </p>
            )}
            {profile.notes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">{profile.notes}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-2 ml-4">
            <ScrapeButton profileId={profile.id} profileName={profile.display_name} />
            <a
              href={profile.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium transition-colors"
            >
              View on LinkedIn →
            </a>
            <Link
              href={`/?profile=${profile.id}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium transition-colors"
            >
              View Dashboard
            </Link>
            <Link
              href={`/posts?profile=${profile.id}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium transition-colors"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Posts" value={stats.total_posts} icon="📝" />
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
      {engagementData.length > 0 && <EngagementChart data={engagementData} />}

      {/* Top Posts */}
      {topPosts.length > 0 && <PostsTable posts={topPosts} title="Top 10 Posts" />}

      {stats.total_posts === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">No posts found for this profile</p>
          <p className="text-gray-400 text-sm mt-2">
            Run the scraper for this profile to see data
          </p>
        </div>
      )}
    </div>
  );
}
