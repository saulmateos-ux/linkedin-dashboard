import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getProfileComplete, pool } from '@/lib/db';
import ProfileBackground from '@/components/ProfileBackground';
import ScrapeBackgroundsButton from '@/components/ScrapeBackgroundsButton';
import EnhancedStatsCard from '@/components/EnhancedStatsCard';
import PostsTable from '@/components/PostsTable';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfileBackgroundPage({ params }: PageProps) {
  const resolvedParams = await params;
  const profileId = parseInt(resolvedParams.id);

  if (isNaN(profileId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-bold text-lg">Invalid Profile ID</h2>
          <p className="text-red-700 mt-2">The profile ID must be a number.</p>
          <Link
            href="/profiles"
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            ← Back to Profiles
          </Link>
        </div>
      </div>
    );
  }

  try {
    const { profile, experiences, education } = await getProfileComplete(profileId);

    // Get stats for last 30 days
    const statsQuery = await pool.query(`
      SELECT
        COUNT(*) as posts_last_30_days,
        COALESCE(AVG(engagement_total), 0) as avg_engagement,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(comments), 0) as total_comments,
        COALESCE(SUM(shares), 0) as total_shares
      FROM posts
      WHERE profile_id = $1
        AND published_at >= NOW() - INTERVAL '30 days'
    `, [profileId]);

    const stats = statsQuery.rows[0];

    // Calculate engagement score (weighted: likes*1 + comments*2 + shares*3)
    const engagementScore = Math.round(
      (parseInt(stats.total_likes) * 1) +
      (parseInt(stats.total_comments) * 2) +
      (parseInt(stats.total_shares) * 3)
    );

    // Get top 10 posts by engagement
    const topPostsQuery = await pool.query(`
      SELECT * FROM posts
      WHERE profile_id = $1
      ORDER BY engagement_total DESC
      LIMIT 10
    `, [profileId]);

    // Get 10 most recent posts
    const recentPostsQuery = await pool.query(`
      SELECT * FROM posts
      WHERE profile_id = $1
      ORDER BY published_at DESC
      LIMIT 10
    `, [profileId]);

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/profiles"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profiles
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{profile.display_name}</h1>
              {profile.headline && (
                <p className="text-gray-600 mt-1">{profile.headline}</p>
              )}
              <a
                href={profile.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm mt-1 inline-block"
              >
                View LinkedIn Profile →
              </a>
            </div>

            <ScrapeBackgroundsButton
              profileIds={[profile.id]}
              autoRefresh={true}
            />
          </div>
        </div>

        {/* Engagement Analytics */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Engagement Analytics (Last 30 Days)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatsCard
              title="Posts (30d)"
              value={parseInt(stats.posts_last_30_days)}
              icon="📝"
            />
            <EnhancedStatsCard
              title="Engagement Score"
              value={engagementScore}
              icon="🎯"
            />
            <EnhancedStatsCard
              title="Avg Engagement"
              value={Math.round(stats.avg_engagement)}
              icon="📊"
            />
            <EnhancedStatsCard
              title="Total Comments"
              value={parseInt(stats.total_comments)}
              icon="💬"
            />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Profile Background */}
          <div>
            <ProfileBackground
              profile={profile}
              experiences={experiences}
              education={education}
            />
          </div>

          {/* Right Column - Posts */}
          <div className="space-y-6">
            {/* Top Posts */}
            <PostsTable
              posts={topPostsQuery.rows}
              title="🏆 Top 10 Posts"
              showAll={true}
            />

            {/* Recent Posts */}
            <PostsTable
              posts={recentPostsQuery.rows}
              title="🕒 Recent Posts"
              showAll={true}
            />
          </div>
        </div>
      </div>
    );

  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-bold text-lg">Profile Not Found</h2>
          <p className="text-red-700 mt-2">
            {error instanceof Error ? error.message : 'Unable to load profile background.'}
          </p>
          <Link
            href="/profiles"
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            ← Back to Profiles
          </Link>
        </div>
      </div>
    );
  }
}
