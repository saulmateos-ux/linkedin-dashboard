/**
 * Apify Webhook Endpoint
 *
 * Receives POST from Apify when a scraping run completes (ACTOR.RUN.SUCCEEDED).
 * Fetches the dataset items and processes them into the posts table.
 * Auto-detects platform (LinkedIn vs YouTube) from dataset item shape.
 *
 * Apify default webhook payload:
 * {
 *   userId, createdAt, eventType, eventData,
 *   resource: { id, defaultDatasetId, defaultKeyValueStoreId, status, ... }
 * }
 */

import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { getProfiles, updateProfilesLastScraped, pool } from '@/lib/db';
import { processApifyPosts } from '@/lib/process-posts';
import { processYouTubeVideos } from '@/lib/process-youtube';

export const maxDuration = 60; // Dataset fetch + DB upserts should be <30s

export async function POST(request: Request) {
  console.log('[WEBHOOK] Received Apify webhook');

  try {
    // 1. Verify webhook secret (if configured)
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET?.trim();
    if (webhookSecret) {
      const headerSecret = request.headers.get('x-apify-webhook-secret')?.trim();
      if (headerSecret && headerSecret !== webhookSecret) {
        console.error('[WEBHOOK] Invalid webhook secret');
        return new Response('Unauthorized', { status: 401 });
      }
      if (!headerSecret) {
        console.warn('[WEBHOOK] No X-Apify-Webhook-Secret header received (proceeding anyway)');
      }
    }

    // 2. Parse Apify webhook payload
    const payload = await request.json();
    const { eventType, resource } = payload;

    console.log('[WEBHOOK] Event:', eventType, 'Run:', resource?.id);

    if (eventType !== 'ACTOR.RUN.SUCCEEDED') {
      console.log(`[WEBHOOK] Ignoring event type: ${eventType}`);
      return NextResponse.json({ success: true, skipped: true, reason: `Event type ${eventType} not handled` });
    }

    const datasetId = resource?.defaultDatasetId;
    if (!datasetId) {
      console.error('[WEBHOOK] No defaultDatasetId in payload');
      return NextResponse.json(
        { success: false, error: 'Missing defaultDatasetId' },
        { status: 400 }
      );
    }

    // 3. Fetch dataset items from Apify
    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'APIFY_API_KEY not configured' },
        { status: 500 }
      );
    }

    const client = new ApifyClient({ token: apiKey });
    const { items } = await client.dataset(datasetId).listItems();
    console.log(`[WEBHOOK] Fetched ${items.length} items from dataset ${datasetId}`);

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No items in dataset',
        runId: resource.id,
        datasetId,
      });
    }

    // 4. Build profile map (username -> id, lowercase display_name -> id)
    const profiles = await getProfiles();
    const profileMap = new Map<string, number>();
    for (const p of profiles) {
      profileMap.set(p.username, p.id);
      profileMap.set(p.display_name.toLowerCase(), p.id);
    }

    // 5. Detect platform from dataset items and route to correct processor
    const firstItem = items[0] as Record<string, unknown>;
    const isYouTube = !!(firstItem.channelName || firstItem.channelUrl || firstItem.videoUrl ||
      (typeof firstItem.url === 'string' && (firstItem.url as string).includes('youtube.com')));
    const platform = isYouTube ? 'youtube' : 'linkedin';

    console.log(`[WEBHOOK] Detected platform: ${platform}`);

    let result: { newPosts: number; updatedPosts: number; matchedProfileIds: number[] };

    if (isYouTube) {
      result = await processYouTubeVideos(
        items as Record<string, unknown>[],
        profileMap,
        pool
      );
    } else {
      result = await processApifyPosts(
        items as Record<string, unknown>[],
        profileMap,
        pool
      );
    }

    console.log(`[WEBHOOK] Processed: ${result.newPosts} new, ${result.updatedPosts} updated, ${result.matchedProfileIds.length} profiles matched`);

    // 6. Update last_scraped_at for matched profiles
    if (result.matchedProfileIds.length > 0) {
      await updateProfilesLastScraped(result.matchedProfileIds);
      console.log(`[WEBHOOK] Updated last_scraped_at for ${result.matchedProfileIds.length} profiles`);
    }

    return NextResponse.json({
      success: true,
      platform,
      runId: resource.id,
      datasetId,
      itemsFetched: items.length,
      newPosts: result.newPosts,
      updatedPosts: result.updatedPosts,
      profilesUpdated: result.matchedProfileIds.length,
    });
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
