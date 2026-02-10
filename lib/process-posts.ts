/**
 * Shared post-processing utility
 * Extracts Apify scraped items into DB rows (posts table)
 *
 * Used by:
 * - /api/webhooks/apify (async webhook flow)
 * - /api/scrape (manual/dashboard sync flow)
 */

import { Pool } from 'pg';

export interface ProcessResult {
  newPosts: number;
  updatedPosts: number;
  matchedProfileIds: number[];
}

/**
 * Process Apify dataset items and upsert into the posts table.
 *
 * @param items - Raw Apify dataset items
 * @param profileMap - Map of username (or lowercase display_name) -> profile_id
 * @param pool - PostgreSQL connection pool
 */
export async function processApifyPosts(
  items: Record<string, unknown>[],
  profileMap: Map<string, number>,
  pool: Pool
): Promise<ProcessResult> {
  // Filter to actual posts (not reactions/comments)
  const posts = items.filter(
    (item) => item.type === 'post' && (item.postUrl || item.linkedinUrl)
  );

  let newPosts = 0;
  let updatedPosts = 0;
  const matchedProfileIds = new Set<number>();

  for (const rawPost of posts) {
    try {
      const post = rawPost as Record<string, unknown>;

      // Extract post ID from URL
      const postUrl = (post.postUrl || post.linkedinUrl || post.url) as
        | string
        | undefined;
      const activityMatch = postUrl?.match(/activity-(\d+)/);
      const postId = activityMatch ? activityMatch[1] : `post_${Date.now()}`;

      // Content
      const content = String(post.text || post.content || '');
      const contentPreview =
        content.length > 100 ? content.substring(0, 100) + '...' : content;

      // Parse engagement
      const engagement =
        (post.engagement as Record<string, unknown>) || {};
      const likes =
        parseInt(
          String(engagement.likes || post.likesCount || post.likes || '0')
        ) || 0;
      const comments =
        parseInt(
          String(
            engagement.comments || post.commentsCount || post.comments || '0'
          )
        ) || 0;
      const shares =
        parseInt(
          String(
            engagement.shares ||
              post.sharesCount ||
              post.shares ||
              post.reposts ||
              '0'
          )
        ) || 0;
      const views =
        parseInt(
          String(
            engagement.impressions || post.viewsCount || post.views || '0'
          )
        ) || 0;
      const engagementTotal = likes + comments + shares;

      // Hashtags
      const hashtagMatches = content.match(/#[\w]+/g);
      const hashtags = hashtagMatches ? [...new Set(hashtagMatches)] : [];

      // Published date (handle object or string)
      let publishedAt: Date | string = new Date();
      const dateField = post.publishedAt || post.postedAt;

      if (dateField) {
        if (
          typeof dateField === 'object' &&
          (dateField as Record<string, unknown>).date
        ) {
          publishedAt = String((dateField as Record<string, unknown>).date);
        } else if (typeof dateField === 'string') {
          publishedAt = dateField;
        }
      }

      // Author name (handle both string and object)
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
          } else if (
            authorObj.authorName &&
            typeof authorObj.authorName === 'string'
          ) {
            authorName = authorObj.authorName;
          } else if (
            authorObj.displayName &&
            typeof authorObj.displayName === 'string'
          ) {
            authorName = authorObj.displayName;
          } else if (
            authorObj.fullName &&
            typeof authorObj.fullName === 'string'
          ) {
            authorName = authorObj.fullName;
          }

          if (
            authorObj.publicIdentifier &&
            typeof authorObj.publicIdentifier === 'string'
          ) {
            authorUsername = authorObj.publicIdentifier;
          } else if (
            authorObj.username &&
            typeof authorObj.username === 'string'
          ) {
            authorUsername = authorObj.username;
          }
        }
      }

      if (post.authorUsername && typeof post.authorUsername === 'string') {
        authorUsername = post.authorUsername;
      }

      // Match to profile_id via username, then display_name fallback
      let postProfileId: number | null = null;

      if (authorUsername && authorUsername !== 'unknown') {
        postProfileId = profileMap.get(authorUsername) || null;
      }

      if (!postProfileId && authorName && authorName !== 'Unknown') {
        postProfileId = profileMap.get(authorName.toLowerCase()) || null;
      }

      // Final fallback: single-profile map -> assign to that profile
      if (!postProfileId && profileMap.size === 1) {
        postProfileId = Array.from(profileMap.values())[0];
      }

      if (postProfileId) {
        matchedProfileIds.add(postProfileId);
      }

      // Upsert
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
        newPosts++;
      } else {
        updatedPosts++;
      }
    } catch (error) {
      console.error('Error processing post:', error);
    }
  }

  return { newPosts, updatedPosts, matchedProfileIds: Array.from(matchedProfileIds) };
}
