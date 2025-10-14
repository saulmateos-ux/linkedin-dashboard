/**
 * LinkedIn Scrape API Route
 * Triggers Apify scraping and updates Neon database
 */

import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { Pool } from 'pg';

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Configure route for longer timeout (requires Vercel Pro for >10s)
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

/**
 * POST /api/scrape
 * Trigger LinkedIn scraping
 */
export async function POST(request: Request) {
  try {
    // Validate environment variables
    const apiKey = process.env.APIFY_API_KEY;
    const profileUrl = process.env.LINKEDIN_PROFILE_URL;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'APIFY_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!profileUrl) {
      return NextResponse.json(
        { error: 'LINKEDIN_PROFILE_URL not configured' },
        { status: 500 }
      );
    }

    // Parse request body for options (optional)
    const body = await request.json().catch(() => ({}));
    const maxPosts = body.maxPosts || 100; // Default to 100 posts for safety

    console.log('Starting scrape...', { profileUrl, maxPosts });

    // Initialize Apify client
    const client = new ApifyClient({ token: apiKey });

    // Run the Apify actor
    const actorId = 'harvestapi/linkedin-profile-posts';
    console.log('Running actor:', actorId);

    const run = await client.actor(actorId).call({
      profileUrls: [profileUrl],
      maxPosts: maxPosts,
    });

    console.log('Actor run completed:', run.id);

    // Get dataset items
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log('Fetched items:', items.length);

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts found',
        postsFound: 0,
        newPosts: 0,
      });
    }

    // Filter actual posts (not reactions/comments)
    const posts = items.filter((item: Record<string, unknown>) =>
      item.type === 'post' && (item.postUrl || item.linkedinUrl)
    );

    console.log('Filtered posts:', posts.length);

    // Insert posts into database
    let newPosts = 0;
    let updatedPosts = 0;

    for (const rawPost of posts) {
      try {
        // Type assertion for post data
        const post = rawPost as Record<string, unknown>;

        // DEBUG: Log first post to see structure
        if (newPosts === 0) {
          console.log('=== SAMPLE RAW POST ===');
          console.log(JSON.stringify(post, null, 2));
          console.log('======================');
        }

        // Extract post ID from URL
        const postUrl = (post.postUrl || post.linkedinUrl || post.url) as string | undefined;
        const activityMatch = postUrl?.match(/activity-(\d+)/);
        const postId = activityMatch ? activityMatch[1] : `post_${Date.now()}`;

        // Prepare post data
        const content = String(post.text || post.content || '');
        const contentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;

        // Parse engagement (check engagement object first, like CLI does!)
        const engagement = (post.engagement as Record<string, unknown>) || {};
        const likes = parseInt(String(
          engagement.likes || post.likesCount || post.likes || '0'
        )) || 0;
        const comments = parseInt(String(
          engagement.comments || post.commentsCount || post.comments || '0'
        )) || 0;
        const shares = parseInt(String(
          engagement.shares || post.sharesCount || post.shares || post.reposts || '0'
        )) || 0;
        const views = parseInt(String(
          engagement.impressions || post.viewsCount || post.views || '0'
        )) || 0;
        const engagementTotal = likes + comments + shares;

        console.log(`Post ${postId}: likes=${likes}, comments=${comments}, shares=${shares}`);

        // Extract hashtags
        const hashtagMatches = content.match(/#[\w]+/g);
        const hashtags = hashtagMatches ? [...new Set(hashtagMatches)] : [];

        // Upsert into database
        const query = `
          INSERT INTO posts (
            id, post_url, content, content_preview,
            author_name, author_username, published_at,
            likes, comments, shares, views,
            engagement_total, engagement_rate,
            hashtags, media_type,
            scraped_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            NOW(), NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            content_preview = EXCLUDED.content_preview,
            likes = EXCLUDED.likes,
            comments = EXCLUDED.comments,
            shares = EXCLUDED.shares,
            views = EXCLUDED.views,
            engagement_total = EXCLUDED.engagement_total,
            engagement_rate = EXCLUDED.engagement_rate,
            scraped_at = NOW(),
            updated_at = NOW()
        `;

        // Extract published date (handle object or string)
        let publishedAt: Date | string = new Date();
        const dateField = post.publishedAt || post.postedAt;

        if (dateField) {
          if (typeof dateField === 'object' && (dateField as Record<string, unknown>).date) {
            // Extract date from object { date: "...", timestamp: ... }
            publishedAt = String((dateField as Record<string, unknown>).date);
          } else if (typeof dateField === 'string') {
            // Use string directly
            publishedAt = dateField;
          }
        }

        const values = [
          postId,
          postUrl,
          content,
          contentPreview,
          String(post.authorName || post.author || 'Unknown'),
          String(post.authorUsername || 'unknown'),
          publishedAt,
          likes,
          comments,
          shares,
          views,
          engagementTotal,
          views > 0 ? (engagementTotal / views) * 100 : 0,
          JSON.stringify(hashtags),
          (post.images as unknown[] | undefined)?.length ? 'image' : 'text',
        ];

        const result = await pool.query(query, values);

        // Check if it was an insert (new) or update
        if (result.rowCount === 1) {
          newPosts++;
        } else {
          updatedPosts++;
        }

      } catch (error) {
        console.error('Error processing post:', error);
        // Continue with next post
      }
    }

    console.log('Database update complete:', { newPosts, updatedPosts });

    return NextResponse.json({
      success: true,
      message: `Scrape complete! ${newPosts} new posts, ${updatedPosts} updated`,
      postsFound: posts.length,
      newPosts,
      updatedPosts,
      runId: run.id,
    });

  } catch (error) {
    console.error('Scrape error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Scrape failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape
 * Get scrape status/info
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Use POST to trigger a scrape',
  });
}
