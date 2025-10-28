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
    // Validate API key
    const apiKey = process.env.APIFY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'APIFY_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const maxPosts = body.maxPosts || 100; // Default to 100 posts for safety
    const profileId = body.profileId; // Optional: specific profile ID
    const workspaceId = body.workspaceId; // Optional: scrape all profiles in workspace
    const profileIds = body.profileIds; // Optional: array of profile IDs for smart batch scraping
    const onlyNew = body.onlyNew || false; // Optional: only scrape profiles that have never been scraped

    // Determine profile URLs and mappings
    let profileUrls: string[] = [];
    const profileUrlMap: Map<string, number> = new Map(); // URL -> profile_id mapping

    // NEW: Smart batch scraping for filtered profiles
    if (profileIds && Array.isArray(profileIds) && profileIds.length > 0) {
      console.log('Smart batch scraping:', { profileCount: profileIds.length });

      // Import helper functions
      const {
        getProfilesByIds,
        groupProfilesByMaxPosts,
        updateProfilesLastScraped
      } = await import('@/lib/db');

      // Get profiles from database
      const profiles = await getProfilesByIds(profileIds);

      if (profiles.length === 0) {
        return NextResponse.json(
          { error: 'No profiles found' },
          { status: 404 }
        );
      }

      // Group profiles by smart maxPosts logic
      const groups = groupProfilesByMaxPosts(profiles);

      console.log('Profile groups:', groups.map(g => ({
        groupName: g.groupName,
        count: g.profiles.length,
        maxPosts: g.maxPosts
      })));

      // Initialize Apify client
      const client = new ApifyClient({ token: apiKey });
      const actorId = 'harvestapi/linkedin-profile-posts';

      // Scrape each group separately
      let totalNewPosts = 0;
      let totalUpdatedPosts = 0;
      let totalScraped = 0;
      const groupResults = [];

      for (const group of groups) {
        try {
          console.log(`Scraping ${group.groupName} group: ${group.profiles.length} profiles, ${group.maxPosts} posts each`);

          const groupUrls = group.profiles.map(p => p.profile_url);
          // Build username map for matching (more reliable than full URL matching)
          const groupUsernameMap = new Map(group.profiles.map(p => [p.username, p.id]));

          // Run Apify actor for this group
          const run = await client.actor(actorId).call({
            targetUrls: groupUrls,
            maxPosts: group.maxPosts,
          });

          console.log(`Group ${group.groupName} run completed:`, run.id);

          // Get dataset items
          const { items } = await client.dataset(run.defaultDatasetId).listItems();
          const posts = items.filter((item: Record<string, unknown>) =>
            item.type === 'post' && (item.postUrl || item.linkedinUrl)
          );

          console.log(`Group ${group.groupName}: scraped ${posts.length} posts`);

          // Process and insert posts (same logic as existing code)
          let groupNewPosts = 0;
          let groupUpdatedPosts = 0;

          for (const rawPost of posts) {
            try {
              const post = rawPost as Record<string, unknown>;

              // Extract post ID from URL
              const postUrl = (post.postUrl || post.linkedinUrl || post.url) as string | undefined;
              const activityMatch = postUrl?.match(/activity-(\d+)/);
              const postId = activityMatch ? activityMatch[1] : `post_${Date.now()}`;

              // Prepare post data
              const content = String(post.text || post.content || '');
              const contentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;

              // Parse engagement
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

              // Extract hashtags
              const hashtagMatches = content.match(/#[\w]+/g);
              const hashtags = hashtagMatches ? [...new Set(hashtagMatches)] : [];

              // Extract published date
              let publishedAt: Date | string = new Date();
              const dateField = post.publishedAt || post.postedAt;

              if (dateField) {
                if (typeof dateField === 'object' && (dateField as Record<string, unknown>).date) {
                  publishedAt = String((dateField as Record<string, unknown>).date);
                } else if (typeof dateField === 'string') {
                  publishedAt = dateField;
                }
              }

              // Extract author name
              let authorName = 'Unknown';
              let authorUsername = 'unknown';

              if (post.authorName && typeof post.authorName === 'string') {
                authorName = post.authorName;
              } else if (post.author) {
                if (typeof post.author === 'string') {
                  authorName = post.author;
                } else if (typeof post.author === 'object' && post.author !== null) {
                  const authorObj = post.author as Record<string, unknown>;

                  if (authorObj.name && typeof authorObj.name === 'string') {
                    authorName = authorObj.name;
                  } else if (authorObj.authorName && typeof authorObj.authorName === 'string') {
                    authorName = authorObj.authorName;
                  } else if (authorObj.displayName && typeof authorObj.displayName === 'string') {
                    authorName = authorObj.displayName;
                  } else if (authorObj.fullName && typeof authorObj.fullName === 'string') {
                    authorName = authorObj.fullName;
                  }

                  if (authorObj.publicIdentifier && typeof authorObj.publicIdentifier === 'string') {
                    authorUsername = authorObj.publicIdentifier;
                  } else if (authorObj.username && typeof authorObj.username === 'string') {
                    authorUsername = authorObj.username;
                  }
                }
              }

              if (post.authorUsername && typeof post.authorUsername === 'string') {
                authorUsername = post.authorUsername;
              }

              // Determine profile_id for this post by matching username
              let postProfileId: number | null = null;

              // Match by author username (most reliable for personal profiles)
              if (authorUsername && authorUsername !== 'unknown') {
                postProfileId = groupUsernameMap.get(authorUsername) || null;
              }

              // Fallback for company pages: match by display name
              if (!postProfileId && authorName && authorName !== 'Unknown') {
                const matchingProfile = group.profiles.find(p =>
                  p.display_name.toLowerCase() === authorName.toLowerCase()
                );
                if (matchingProfile) {
                  postProfileId = matchingProfile.id;
                }
              }

              // Final fallback: if only one profile in group, assign to that profile
              if (!postProfileId && groupUsernameMap.size === 1) {
                postProfileId = Array.from(groupUsernameMap.values())[0];
              }

              // Upsert into database
              const query = `
                INSERT INTO posts (
                  id, post_url, content, content_preview,
                  author_name, author_username, published_at,
                  likes, comments, shares, views,
                  engagement_total, engagement_rate,
                  hashtags, media_type, profile_id,
                  scraped_at, created_at, updated_at
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
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
                  profile_id = EXCLUDED.profile_id,
                  scraped_at = NOW(),
                  updated_at = NOW()
              `;

              const values = [
                postId,
                postUrl,
                content,
                contentPreview,
                authorName,
                authorUsername,
                publishedAt,
                likes,
                comments,
                shares,
                views,
                engagementTotal,
                views > 0 ? (engagementTotal / views) * 100 : 0,
                JSON.stringify(hashtags),
                (post.images as unknown[] | undefined)?.length ? 'image' : 'text',
                postProfileId,
              ];

              const result = await pool.query(query, values);

              if (result.rowCount === 1) {
                groupNewPosts++;
              } else {
                groupUpdatedPosts++;
              }

            } catch (error) {
              console.error('Error processing post:', error);
            }
          }

          totalNewPosts += groupNewPosts;
          totalUpdatedPosts += groupUpdatedPosts;
          totalScraped += posts.length;

          groupResults.push({
            group: group.groupName,
            profileCount: group.profiles.length,
            maxPosts: group.maxPosts,
            postsScraped: posts.length,
            newPosts: groupNewPosts,
            updatedPosts: groupUpdatedPosts,
          });

        } catch (error) {
          console.error(`Error scraping ${group.groupName} group:`, error);
          groupResults.push({
            group: group.groupName,
            profileCount: group.profiles.length,
            maxPosts: group.maxPosts,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update last_scraped_at for all profiles
      await updateProfilesLastScraped(profileIds);

      console.log('Smart batch scraping complete:', {
        totalScraped,
        totalNewPosts,
        totalUpdatedPosts,
        groups: groupResults
      });

      return NextResponse.json({
        success: true,
        message: `Smart batch scrape complete! ${totalNewPosts} new posts, ${totalUpdatedPosts} updated`,
        postsFound: totalScraped,
        newPosts: totalNewPosts,
        updatedPosts: totalUpdatedPosts,
        profileCount: profiles.length,
        groups: groupResults,
      });
    }

    if (workspaceId) {
      // Batch scraping: Get all profiles in workspace
      const whereClause = onlyNew
        ? 'WHERE wp.workspace_id = $1 AND p.last_scraped_at IS NULL'
        : 'WHERE wp.workspace_id = $1';

      const workspaceProfiles = await pool.query(
        `SELECT p.id, p.profile_url, p.username, p.display_name
         FROM workspace_profiles wp
         JOIN profiles p ON wp.profile_id = p.id
         ${whereClause}`,
        [workspaceId]
      );

      if (workspaceProfiles.rows.length === 0) {
        const errorMessage = onlyNew
          ? 'No new profiles to scrape. All profiles in this workspace have already been scraped! Uncheck "Only scrape new profiles" to re-scrape them.'
          : 'No profiles found in workspace';
        return NextResponse.json(
          { error: errorMessage },
          { status: 404 }
        );
      }

      // Build arrays for batch scraping
      profileUrls = workspaceProfiles.rows.map((p: {id: number, profile_url: string, username: string, display_name: string}) => p.profile_url);
      workspaceProfiles.rows.forEach((p: {id: number, profile_url: string, username: string, display_name: string}) => {
        profileUrlMap.set(p.username, p.id); // Use username as key (more reliable)
        profileUrlMap.set(p.display_name.toLowerCase(), p.id); // Also add display name as key for company pages
      });

      console.log('Batch scraping workspace:', { workspaceId, profileCount: profileUrls.length });
    } else if (profileId) {
      // Single profile scraping - look it up in database
      const profileResult = await pool.query(
        'SELECT id, profile_url, username, display_name FROM profiles WHERE id = $1',
        [profileId]
      );

      if (profileResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        );
      }

      const profile = profileResult.rows[0];
      profileUrls = [profile.profile_url];
      profileUrlMap.set(profile.username, profile.id); // Use username as key
      profileUrlMap.set(profile.display_name.toLowerCase(), profile.id); // Also add display name for company pages
    } else {
      // Scraping default profile from env
      const envProfileUrl = process.env.LINKEDIN_PROFILE_URL;
      if (!envProfileUrl) {
        return NextResponse.json(
          { error: 'LINKEDIN_PROFILE_URL not configured' },
          { status: 500 }
        );
      }
      profileUrls = [envProfileUrl];

      // Try to find this profile in database to get its ID, username, and display name
      const normalizedUrl = envProfileUrl.replace(/\/$/, '');
      const profileResult = await pool.query(
        `SELECT id, username, display_name FROM profiles
         WHERE REPLACE(profile_url, '/', '') = REPLACE($1, '/', '')
         OR profile_url = $1
         LIMIT 1`,
        [normalizedUrl]
      );

      if (profileResult.rows.length > 0) {
        const profile = profileResult.rows[0];
        profileUrlMap.set(profile.username, profile.id);
        profileUrlMap.set(profile.display_name.toLowerCase(), profile.id);
      }
    }

    console.log('Starting scrape...', { profileUrls, maxPosts, profileCount: profileUrls.length });

    // Initialize Apify client
    const client = new ApifyClient({ token: apiKey });

    // Run the Apify actor with batch URLs
    const actorId = 'harvestapi/linkedin-profile-posts';
    console.log('Running actor:', actorId);

    const run = await client.actor(actorId).call({
      targetUrls: profileUrls, // Changed from profileUrls to targetUrls (correct parameter name)
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
            hashtags, media_type, profile_id,
            scraped_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
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
            profile_id = EXCLUDED.profile_id,
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

        // Extract author name (handle both string and object)
        let authorName = 'Unknown';
        let authorUsername = 'unknown';

        // Try authorName field first (simple string)
        if (post.authorName && typeof post.authorName === 'string') {
          authorName = post.authorName;
        }
        // Try author field (could be string or object)
        else if (post.author) {
          if (typeof post.author === 'string') {
            authorName = post.author;
          } else if (typeof post.author === 'object' && post.author !== null) {
            // Extract from author object - handle nested objects safely
            const authorObj = post.author as Record<string, unknown>;

            // Try multiple possible field names and ensure they're strings
            if (authorObj.name && typeof authorObj.name === 'string') {
              authorName = authorObj.name;
            } else if (authorObj.authorName && typeof authorObj.authorName === 'string') {
              authorName = authorObj.authorName;
            } else if (authorObj.displayName && typeof authorObj.displayName === 'string') {
              authorName = authorObj.displayName;
            } else if (authorObj.fullName && typeof authorObj.fullName === 'string') {
              authorName = authorObj.fullName;
            }

            // Extract username from author object
            if (authorObj.publicIdentifier && typeof authorObj.publicIdentifier === 'string') {
              authorUsername = authorObj.publicIdentifier;
            } else if (authorObj.username && typeof authorObj.username === 'string') {
              authorUsername = authorObj.username;
            }
          }
        }

        // Try standalone authorUsername field
        if (post.authorUsername && typeof post.authorUsername === 'string') {
          authorUsername = post.authorUsername;
        }

        // Determine profile_id for this post
        // Match by username (personal profiles) or display name (company pages)
        let postProfileId: number | null = null;

        // Try matching by username first (most reliable for personal profiles)
        if (authorUsername && authorUsername !== 'unknown') {
          postProfileId = profileUrlMap.get(authorUsername) || null;
        }

        // Fallback: match by author name (for company pages)
        if (!postProfileId && authorName && authorName !== 'Unknown') {
          postProfileId = profileUrlMap.get(authorName.toLowerCase()) || null;
        }

        // Final fallback: if only one profile being scraped, assign to that profile
        if (!postProfileId && profileUrls.length === 1) {
          // Single profile mode - need to look up the profile ID
          const firstKey = profileUrlMap.keys().next().value;
          if (firstKey) {
            postProfileId = profileUrlMap.get(firstKey) || null;
          }
        }

        const values = [
          postId,
          postUrl,
          content,
          contentPreview,
          authorName,
          authorUsername,
          publishedAt,
          likes,
          comments,
          shares,
          views,
          engagementTotal,
          views > 0 ? (engagementTotal / views) * 100 : 0,
          JSON.stringify(hashtags),
          (post.images as unknown[] | undefined)?.length ? 'image' : 'text',
          postProfileId, // Use matched profile_id
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

    // Update last_scraped_at ONLY for profiles that actually returned posts
    if (workspaceId && posts.length > 0) {
      // Get unique profile IDs from posts that were successfully inserted
      const profileIdsWithPosts = new Set<number>();

      // Query the posts table to find which profiles got posts in this scrape
      const recentProfilesResult = await pool.query(
        `SELECT DISTINCT profile_id
         FROM posts
         WHERE scraped_at > NOW() - INTERVAL '5 minutes'
         AND profile_id IS NOT NULL`
      );

      recentProfilesResult.rows.forEach((row: { profile_id: number }) => {
        if (row.profile_id) {
          profileIdsWithPosts.add(row.profile_id);
        }
      });

      const profileIdsArray = Array.from(profileIdsWithPosts);

      if (profileIdsArray.length > 0) {
        await pool.query(
          `UPDATE profiles SET last_scraped_at = NOW() WHERE id = ANY($1)`,
          [profileIdsArray]
        );
        console.log(`Updated last_scraped_at for ${profileIdsArray.length} profiles (only profiles with posts)`);
      } else {
        console.log('No profiles had posts returned, not updating last_scraped_at');
      }
    }

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
