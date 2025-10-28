/**
 * Quick check of how many posts we have for Notion import
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPosts() {
  try {
    console.log('🔍 Checking posts in database...\n');

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM posts');
    const totalPosts = parseInt(countResult.rows[0].count);

    // Get workspace breakdown
    const workspaceResult = await pool.query(`
      SELECT
        w.name as workspace,
        COUNT(DISTINCT p.id) as post_count
      FROM posts p
      JOIN profiles pr ON p.profile_id = pr.id
      LEFT JOIN workspace_profiles wp ON pr.id = wp.profile_id
      LEFT JOIN workspaces w ON wp.workspace_id = w.id
      GROUP BY w.name
      ORDER BY post_count DESC
    `);

    // Get sample posts
    const sampleResult = await pool.query(`
      SELECT
        p.author_name,
        p.published_at,
        p.likes,
        p.comments,
        p.shares,
        LEFT(p.content, 100) as preview
      FROM posts p
      ORDER BY p.published_at DESC
      LIMIT 5
    `);

    console.log(`📊 Total posts: ${totalPosts}\n`);

    console.log('📁 Posts by workspace:');
    workspaceResult.rows.forEach(row => {
      console.log(`   ${row.workspace || '(No workspace)'}: ${row.post_count} posts`);
    });

    console.log('\n📝 Sample of latest posts:');
    sampleResult.rows.forEach((post, idx) => {
      console.log(`\n${idx + 1}. ${post.author_name} (${new Date(post.published_at).toLocaleDateString()})`);
      console.log(`   💬 ${post.likes} likes, ${post.comments} comments, ${post.shares} shares`);
      console.log(`   "${post.preview}..."`);
    });

    console.log(`\n✅ Ready to import ${totalPosts} posts to Notion!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPosts();
