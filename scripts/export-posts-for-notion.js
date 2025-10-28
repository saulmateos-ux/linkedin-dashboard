/**
 * Export LinkedIn posts to a format suitable for Notion import
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { pool } from '../lib/db.js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function exportPostsForNotion() {
  try {
    console.log('🔍 Fetching posts from PostgreSQL...\n');

    const result = await pool.query(`
      SELECT
        p.id,
        p.content,
        p.author_name,
        p.author_username,
        p.published_at,
        p.likes,
        p.comments,
        p.shares,
        p.engagement_total,
        p.hashtags,
        p.post_url,
        pr.display_name as profile_name,
        COALESCE(
          array_agg(DISTINCT w.name) FILTER (WHERE w.name IS NOT NULL),
          ARRAY[]::text[]
        ) as workspaces
      FROM posts p
      JOIN profiles pr ON p.profile_id = pr.id
      LEFT JOIN workspace_profiles wp ON pr.id = wp.profile_id
      LEFT JOIN workspaces w ON wp.workspace_id = w.id
      GROUP BY p.id, pr.display_name
      ORDER BY p.published_at DESC
    `);

    const posts = result.rows;

    console.log(`✅ Found ${posts.length} total posts\n`);

    // Show sample
    console.log('📊 Sample of first 3 posts:');
    posts.slice(0, 3).forEach((post, idx) => {
      console.log(`\n${idx + 1}. ${post.author_name} (${new Date(post.published_at).toLocaleDateString()})`);
      console.log(`   Engagement: ${post.likes} likes, ${post.comments} comments, ${post.shares} shares`);
      console.log(`   Workspaces: ${post.workspaces.join(', ') || 'None'}`);
      console.log(`   Preview: ${post.content.substring(0, 100)}...`);
    });

    console.log(`\n📈 Statistics:`);
    console.log(`   Total posts: ${posts.length}`);
    console.log(`   Date range: ${new Date(posts[posts.length - 1].published_at).toLocaleDateString()} to ${new Date(posts[0].published_at).toLocaleDateString()}`);
    console.log(`   Total engagement: ${posts.reduce((sum, p) => sum + (p.engagement_total || 0), 0)}`);

    console.log('\n✨ Ready to import to Notion!');

    return posts;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  exportPostsForNotion();
}

export { exportPostsForNotion };
