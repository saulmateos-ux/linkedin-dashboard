/**
 * Sync posts from PostgreSQL to Weaviate
 * Run this after setting up Weaviate Cloud
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { pool } from '../lib/db';
import {
  initializeWeaviateSchema,
  addPostToWeaviate,
  getWeaviateClient,
} from '../lib/weaviate';

async function syncPostsToWeaviate() {
  console.log('🚀 Starting Weaviate sync...\n');

  try {
    // Step 1: Initialize Weaviate schema
    console.log('📋 Step 1: Initializing Weaviate schema...');
    await initializeWeaviateSchema();

    // Step 2: Fetch all posts from PostgreSQL
    console.log('\n📊 Step 2: Fetching posts from PostgreSQL...');
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
        p.profile_id,
        COALESCE(
          array_agg(DISTINCT wp.workspace_id) FILTER (WHERE wp.workspace_id IS NOT NULL),
          ARRAY[]::integer[]
        ) as workspace_ids
      FROM posts p
      LEFT JOIN workspace_profiles wp ON p.profile_id = wp.profile_id
      GROUP BY p.id
      ORDER BY p.published_at DESC
    `);

    const posts = result.rows;
    console.log(`   Found ${posts.length} posts to sync`);

    // Step 3: Check if posts already exist in Weaviate
    const client = getWeaviateClient();
    const existingPosts = await client.graphql
      .aggregate()
      .withClassName('Post')
      .withFields('meta { count }')
      .do();

    const existingCount = existingPosts.data?.Aggregate?.Post?.[0]?.meta?.count || 0;
    console.log(`   ${existingCount} posts already in Weaviate`);

    // Step 4: Sync posts to Weaviate
    console.log('\n🔄 Step 3: Syncing posts to Weaviate...');
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        // Parse hashtags if stored as JSON string
        let hashtags: string[] = [];
        if (post.hashtags) {
          if (typeof post.hashtags === 'string') {
            try {
              hashtags = JSON.parse(post.hashtags);
            } catch {
              hashtags = [];
            }
          } else if (Array.isArray(post.hashtags)) {
            hashtags = post.hashtags;
          }
        }

        await addPostToWeaviate({
          id: post.id,
          content: post.content || '',
          author_name: post.author_name || '',
          author_username: post.author_username || '',
          published_at: post.published_at,
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          engagement_total: post.engagement_total || 0,
          hashtags: hashtags,
          post_url: post.post_url || '',
          profile_id: post.profile_id,
          workspace_ids: post.workspace_ids || [],
        });

        syncedCount++;

        // Progress indicator
        if (syncedCount % 10 === 0) {
          console.log(`   Synced ${syncedCount}/${posts.length} posts...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error syncing post ${post.id}:`, error);
      }
    }

    // Step 5: Summary
    console.log('\n✅ Sync complete!');
    console.log(`   📈 Synced: ${syncedCount} posts`);
    console.log(`   ⏭️  Skipped: ${skippedCount} posts`);
    console.log(`   ❌ Errors: ${errorCount} posts`);

    // Step 6: Verify sync
    console.log('\n🔍 Verifying sync...');
    const finalCount = await client.graphql
      .aggregate()
      .withClassName('Post')
      .withFields('meta { count }')
      .do();

    const totalInWeaviate = finalCount.data?.Aggregate?.Post?.[0]?.meta?.count || 0;
    console.log(`   Total posts in Weaviate: ${totalInWeaviate}`);

    console.log('\n🎉 All done! You can now use semantic search on your posts.');
    console.log('\n💡 Try these commands:');
    console.log('   - Search: "AI automation in healthcare"');
    console.log('   - Find similar posts to a specific post');
    console.log('   - Get trending topics from last 7 days');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the sync
syncPostsToWeaviate().catch(console.error);
