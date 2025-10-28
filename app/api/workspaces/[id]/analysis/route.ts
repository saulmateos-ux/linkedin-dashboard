import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const maxDuration = 60;

/**
 * GET /api/workspaces/[id]/analysis
 * Get AI-friendly analysis data for a workspace
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID' },
        { status: 400 }
      );
    }

    // Get workspace details
    const workspaceResult = await pool.query(
      'SELECT * FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    const workspace = workspaceResult.rows[0];

    // Get last 10 posts with full details
    const postsResult = await pool.query(
      `SELECT
        p.id,
        p.content,
        p.published_at,
        p.likes,
        p.comments,
        p.shares,
        p.views,
        p.engagement_total,
        p.hashtags,
        p.media_type,
        p.post_url,
        pr.display_name as author_name,
        pr.username as author_username
      FROM posts p
      JOIN profiles pr ON p.profile_id = pr.id
      JOIN workspace_profiles wp ON pr.id = wp.profile_id
      WHERE wp.workspace_id = $1
      ORDER BY p.published_at DESC
      LIMIT 10`,
      [workspaceId]
    );

    // Get aggregate statistics
    const statsResult = await pool.query(
      `SELECT
        COUNT(DISTINCT p.profile_id) as profile_count,
        COUNT(*) as total_posts,
        SUM(p.likes) as total_likes,
        SUM(p.comments) as total_comments,
        SUM(p.shares) as total_shares,
        AVG(p.engagement_total) as avg_engagement,
        MAX(p.published_at) as last_post_date,
        MIN(p.published_at) as first_post_date
      FROM posts p
      JOIN workspace_profiles wp ON p.profile_id = wp.profile_id
      WHERE wp.workspace_id = $1`,
      [workspaceId]
    );

    const stats = statsResult.rows[0];

    // Format posts for better AI consumption
    const formattedPosts = postsResult.rows.map(post => ({
      id: post.id,
      url: post.post_url,
      date: post.published_at,
      author: {
        name: post.author_name,
        username: post.author_username
      },
      content: {
        full: post.content,
        preview: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '')
      },
      engagement: {
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        views: post.views,
        total: post.engagement_total
      },
      hashtags: typeof post.hashtags === 'string' ? JSON.parse(post.hashtags) : (post.hashtags || []),
      mediaType: post.media_type
    }));

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description
      },
      statistics: {
        profileCount: parseInt(stats.profile_count),
        totalPosts: parseInt(stats.total_posts),
        totalLikes: parseInt(stats.total_likes || 0),
        totalComments: parseInt(stats.total_comments || 0),
        totalShares: parseInt(stats.total_shares || 0),
        avgEngagement: parseFloat(stats.avg_engagement || 0).toFixed(2),
        dateRange: {
          first: stats.first_post_date,
          last: stats.last_post_date
        }
      },
      posts: formattedPosts
    });
  } catch (error) {
    console.error('Error fetching workspace analysis:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch workspace analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
