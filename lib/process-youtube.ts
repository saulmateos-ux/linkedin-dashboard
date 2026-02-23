/**
 * YouTube post processor
 *
 * Maps Apify YouTube dataset items (from streamers/youtube-scraper)
 * into posts table rows with platform = 'youtube'.
 *
 * Used by /api/webhooks/apify when YouTube data is detected.
 */

import { Pool } from 'pg';

export interface YouTubeProcessResult {
  newPosts: number;
  updatedPosts: number;
  matchedProfileIds: number[];
}

/**
 * Process Apify YouTube dataset items and upsert into the posts table.
 *
 * @param items - Raw Apify dataset items from youtube-scraper
 * @param profileMap - Map of YouTube @handle (or lowercase display_name) -> profile_id
 * @param pool - PostgreSQL connection pool
 */
export async function processYouTubeVideos(
  items: Record<string, unknown>[],
  profileMap: Map<string, number>,
  pool: Pool
): Promise<YouTubeProcessResult> {
  let newPosts = 0;
  let updatedPosts = 0;
  const matchedProfileIds = new Set<number>();

  for (const item of items) {
    try {
      // Extract video ID from URL
      const videoUrl = String(item.url || item.videoUrl || '');
      const videoIdMatch = videoUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
        videoUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
        videoUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch?.[1] || String(item.id || item.videoId || `yt_${Date.now()}`);
      const postId = `yt_${videoId}`;

      const postUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;

      // Transcript / content
      const transcript = String(item.subtitles || item.transcript || item.captionsText || '');
      const description = String(item.description || item.text || '');
      const content = transcript || description;
      const contentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;

      // Title
      const title = String(item.title || item.name || '');

      // Engagement metrics
      const views = parseInt(String(item.viewCount || item.views || '0')) || 0;
      const likes = parseInt(String(item.likes || item.likeCount || '0')) || 0;
      const comments = parseInt(String(item.commentsCount || item.commentCount || item.comments || '0')) || 0;
      const shares = 0; // YouTube API doesn't expose shares
      const engagementTotal = likes + comments;

      // Duration (seconds)
      const rawDuration = item.duration || item.lengthSeconds || item.durationSeconds;
      let videoDuration: number | null = null;
      if (rawDuration) {
        videoDuration = parseInt(String(rawDuration)) || null;
      }

      // Transcript language
      const transcriptLanguage = transcript
        ? String(item.subtitlesLanguage || item.transcriptLanguage || item.defaultLanguage || 'en')
        : null;

      // Published date
      let publishedAt: string | Date = new Date();
      const dateField = item.date || item.publishedAt || item.uploadDate;
      if (dateField && typeof dateField === 'string') {
        publishedAt = dateField;
      }

      // Author / channel info
      const channelName = String(item.channelName || item.authorName || item.channelTitle || 'Unknown');
      const channelHandle = String(item.channelUrl || item.authorUrl || '')
        .match(/@[\w-]+/)?.[0] || String(item.channelHandle || item.authorUsername || 'unknown');

      // Match to profile_id via @handle, then display_name fallback
      let postProfileId: number | null = null;
      if (channelHandle && channelHandle !== 'unknown') {
        postProfileId = profileMap.get(channelHandle) || null;
      }
      if (!postProfileId && channelName !== 'Unknown') {
        postProfileId = profileMap.get(channelName.toLowerCase()) || null;
      }

      if (postProfileId) {
        matchedProfileIds.add(postProfileId);
      }

      // Upsert
      const query = `
        INSERT INTO posts (
          id, post_url, content, content_preview, title,
          author_name, author_username, published_at,
          likes, comments, shares, views,
          engagement_total, engagement_rate,
          media_type, platform, profile_id,
          video_duration, transcript_language,
          scraped_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          'video', 'youtube', $15, $16, $17,
          NOW(), NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          content_preview = EXCLUDED.content_preview,
          title = EXCLUDED.title,
          likes = EXCLUDED.likes,
          comments = EXCLUDED.comments,
          views = EXCLUDED.views,
          engagement_total = EXCLUDED.engagement_total,
          engagement_rate = EXCLUDED.engagement_rate,
          video_duration = EXCLUDED.video_duration,
          transcript_language = EXCLUDED.transcript_language,
          profile_id = EXCLUDED.profile_id,
          scraped_at = NOW(),
          updated_at = NOW()
      `;

      const values = [
        postId,                                          // $1
        postUrl,                                         // $2
        content,                                         // $3
        contentPreview,                                  // $4
        title,                                           // $5
        channelName,                                     // $6
        channelHandle,                                   // $7
        publishedAt,                                     // $8
        likes,                                           // $9
        comments,                                        // $10
        shares,                                          // $11
        views,                                           // $12
        engagementTotal,                                 // $13
        views > 0 ? (engagementTotal / views) * 100 : 0, // $14
        postProfileId,                                   // $15
        videoDuration,                                   // $16
        transcriptLanguage,                              // $17
      ];

      const result = await pool.query(query, values);

      if (result.rowCount === 1) {
        newPosts++;
      } else {
        updatedPosts++;
      }
    } catch (error) {
      console.error('[YOUTUBE] Error processing video:', error);
    }
  }

  return {
    newPosts,
    updatedPosts,
    matchedProfileIds: Array.from(matchedProfileIds),
  };
}
