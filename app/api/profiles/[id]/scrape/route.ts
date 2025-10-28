import { NextResponse } from 'next/server';
import { getProfile, pool } from '@/lib/db';

// Set maximum duration for this route (5 minutes for long-running scrapes)
export const maxDuration = 300;

/**
 * POST /api/profiles/[id]/scrape
 * Trigger a scrape for a specific profile
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profileId = parseInt(id);

    if (isNaN(profileId)) {
      return NextResponse.json(
        { error: 'Invalid profile ID' },
        { status: 400 }
      );
    }

    // Get the profile
    const profile = await getProfile(profileId);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get scrape options from request body
    const body = await request.json().catch(() => ({}));
    const maxPosts = body.maxPosts || 100;

    // Validate Apify configuration
    if (!process.env.APIFY_API_KEY) {
      return NextResponse.json(
        { error: 'Apify API key not configured' },
        { status: 500 }
      );
    }

    // Import Apify client
    const { ApifyClient } = await import('apify-client');
    const client = new ApifyClient({
      token: process.env.APIFY_API_KEY,
    });

    // Determine which actor to use based on profile type
    const actorId = profile.is_company
      ? (process.env.APIFY_COMPANY_ACTOR_ID || 'apimaestro/linkedin-company-posts')
      : (process.env.APIFY_ACTOR_ID || 'harvestapi/linkedin-profile-posts');

    console.log(`Starting scrape for profile: ${profile.display_name} (@${profile.username})`);
    console.log(`Using actor: ${actorId}`);
    console.log(`Max posts: ${maxPosts}`);
    console.log(`Profile URL: ${profile.profile_url}`);

    // Prepare actor input based on actor type
    let actorInput: Record<string, unknown>;

    if (actorId === 'harvestapi/linkedin-profile-posts') {
      // HarvestAPI actor expects 'profileUrls' array
      actorInput = {
        profileUrls: [profile.profile_url],
        maxPosts: maxPosts,
      };
    } else if (actorId === 'apimaestro/linkedin-company-posts') {
      // ApiMaestro actor might expect different format
      actorInput = {
        startUrls: [{ url: profile.profile_url }],
        maxPosts: maxPosts,
      };
    } else {
      // Fallback: try both formats
      actorInput = {
        profileUrls: [profile.profile_url],
        startUrls: [{ url: profile.profile_url }],
        profileUrl: profile.profile_url,
        maxPosts: maxPosts,
      };
    }

    console.log(`Actor input:`, JSON.stringify(actorInput, null, 2));

    // Start the actor run
    const run = await client.actor(actorId).call(actorInput);

    console.log(`Actor run started: ${run.id}`);
    console.log(`Run status: ${run.status}`);
    console.log(`Run stats:`, run.stats);

    // Check if run actually succeeded
    if (run.status === 'FAILED') {
      console.error(`Actor run failed!`, run);
      return NextResponse.json(
        {
          error: 'Apify actor failed to scrape profile',
          details: 'The scraping actor encountered an error. Check your Apify dashboard for details.',
          runId: run.id,
        },
        { status: 500 }
      );
    }

    // Get the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`Scraped ${items.length} posts`);
    console.log(`First item (if exists):`, items[0]);

    // If we got 0 items, this might be an error
    if (items.length === 0) {
      console.warn('WARNING: Got 0 items from scrape!');
      console.warn('Run details:', {
        status: run.status,
        stats: run.stats,
        actorId,
        profileUrl: profile.profile_url,
      });

      // Return this as a warning, not an error
      return NextResponse.json(
        {
          success: false,
          warning: true,
          message: 'No posts found. The profile may be private, have no posts, or the scraper may have been blocked.',
          profile: {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
          },
          results: {
            totalScraped: 0,
            newPosts: 0,
            updatedPosts: 0,
            runId: run.id,
          },
          debugInfo: {
            actorUsed: actorId,
            profileUrl: profile.profile_url,
            runStatus: run.status,
          },
        },
        { status: 200 }
      );
    }

    // Transform and store posts
    let newPosts = 0;
    let updatedPosts = 0;

    console.log(`Starting to process ${items.length} posts...`);

    for (const item of items) {
      try {
        // Type assertion for dynamic Apify data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemData = item as any;

        // Extract post data
        const postUrl = itemData.postUrl || itemData.url || itemData.linkedinUrl;
        if (!postUrl || typeof postUrl !== 'string') {
          console.warn('Skipping item without postUrl:', item);
          continue;
        }

        // Extract post ID from URL
        const postIdMatch = postUrl.match(/activity[:-](\d+)/);
        const postId = postIdMatch ? postIdMatch[1] : null;
        if (!postId) {
          console.warn('Could not extract post ID from URL:', postUrl);
          continue;
        }

      // Check if post exists
      const existingPost = await pool.query(
        'SELECT id FROM posts WHERE id = $1',
        [postId]
      );

      // Extract engagement data (handles both flat and nested structure)
      const likes = parseInt(itemData.engagement?.likes || itemData.likes || 0);
      const comments = parseInt(itemData.engagement?.comments || itemData.comments || 0);
      const shares = parseInt(itemData.engagement?.shares || itemData.shares || itemData.reposts || 0);
      const views = parseInt(itemData.engagement?.impressions || itemData.views || 0);

      const postData = {
        id: postId,
        post_url: postUrl,
        content: itemData.content || itemData.text || '',
        content_preview: (itemData.content || itemData.text || '').substring(0, 200),
        author_name: itemData.author?.name || itemData.authorName || profile.display_name,
        author_username: itemData.author?.publicIdentifier || itemData.authorUsername || profile.username,
        published_at: itemData.postedAt?.date || itemData.publishedAt || itemData.postedAt || new Date().toISOString(),
        likes,
        comments,
        shares,
        views,
        engagement_total: likes + comments + shares,
        engagement_rate: 0, // Calculate if needed
        hashtags: JSON.stringify(itemData.hashtags || []),
        media_urls: JSON.stringify(itemData.postImages || itemData.mediaUrls || itemData.media || []),
        media_type: (itemData.postImages && itemData.postImages.length > 0) || (itemData.mediaUrls && itemData.mediaUrls.length > 0) || (itemData.media && itemData.media.length > 0) ? 'image' : 'text',
        profile_id: profileId,
        scraped_at: new Date().toISOString(),
      };

      if (existingPost.rows.length > 0) {
        // Update existing post
        await pool.query(
          `UPDATE posts SET
            content = $1,
            content_preview = $2,
            likes = $3,
            comments = $4,
            shares = $5,
            views = $6,
            engagement_total = $7,
            hashtags = $8,
            media_urls = $9,
            media_type = $10,
            scraped_at = $11,
            updated_at = NOW()
          WHERE id = $12`,
          [
            postData.content,
            postData.content_preview,
            postData.likes,
            postData.comments,
            postData.shares,
            postData.views,
            postData.engagement_total,
            postData.hashtags,
            postData.media_urls,
            postData.media_type,
            postData.scraped_at,
            postId,
          ]
        );
        updatedPosts++;
      } else {
        // Insert new post
        await pool.query(
          `INSERT INTO posts (
            id, post_url, content, content_preview, author_name, author_username,
            published_at, likes, comments, shares, views, engagement_total,
            engagement_rate, hashtags, media_urls, media_type, profile_id,
            scraped_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())`,
          [
            postData.id,
            postData.post_url,
            postData.content,
            postData.content_preview,
            postData.author_name,
            postData.author_username,
            postData.published_at,
            postData.likes,
            postData.comments,
            postData.shares,
            postData.views,
            postData.engagement_total,
            postData.engagement_rate,
            postData.hashtags,
            postData.media_urls,
            postData.media_type,
            profileId,
            postData.scraped_at,
          ]
        );
        newPosts++;
        console.log(`Inserted new post ${postId}`);
      }
      } catch (postError) {
        console.error(`Error processing post ${item.postUrl || 'unknown'}:`, postError);
        // Continue with next post instead of failing entire scrape
      }
    }

    console.log(`Finished processing posts. New: ${newPosts}, Updated: ${updatedPosts}`);

    // Record scraping run
    await pool.query(
      `INSERT INTO scraping_runs (
        run_id, actor_id, profile_url, profile_id, started_at, finished_at,
        status, posts_scraped, new_posts, updated_posts, cost_usd, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        run.id,
        actorId,
        profile.profile_url,
        profileId,
        run.startedAt,
        run.finishedAt,
        run.status,
        items.length,
        newPosts,
        updatedPosts,
        0, // Cost calculation can be added later
      ]
    );

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
      },
      results: {
        totalScraped: items.length,
        newPosts,
        updatedPosts,
        runId: run.id,
      },
    });
  } catch (error) {
    console.error('Error scraping profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to scrape profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
