/**
 * YouTube Cron: Non-blocking Apify trigger
 *
 * Runs weekly (Mondays 7am UTC). Queries YouTube channel profiles,
 * starts an Apify run to scrape latest videos + transcripts.
 * When Apify finishes, it POSTs results to /api/webhooks/apify.
 *
 * Shares APIFY_MONTHLY_BUDGET with LinkedIn cron.
 * Cost: ~18 channels x 5 videos x $0.002 = $0.18/run = ~$0.72/month.
 */

import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { queryDatabase } from '@/lib/db';

const COST_PER_VIDEO = 0.002;
const MAX_VIDEOS_PER_CHANNEL = 5;

export const maxDuration = 60;

interface YouTubeProfile {
  id: number;
  username: string;
  display_name: string;
  profile_url: string;
  last_scraped_at: Date | null;
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && authHeader && authHeader !== expectedAuth) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[YT-CRON] Starting YouTube channel scrape (non-blocking)...');

  try {
    const startTime = Date.now();

    // Validate Apify key
    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'APIFY_API_KEY not configured' },
        { status: 500 }
      );
    }

    // 1. Get YouTube channel profiles (username starts with @)
    const channels = await queryDatabase(
      `SELECT id, username, display_name, profile_url, last_scraped_at
       FROM profiles
       WHERE username LIKE '@%'
       ORDER BY last_scraped_at ASC NULLS FIRST`
    ) as YouTubeProfile[];

    console.log(`[YT-CRON] Found ${channels.length} YouTube channels`);

    if (channels.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No YouTube channels to scrape',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Budget cap check (shared with LinkedIn)
    const monthlyBudget = parseFloat(process.env.APIFY_MONTHLY_BUDGET || '35');

    const mtdResult = await queryDatabase(
      `SELECT COUNT(*) as count FROM posts WHERE scraped_at >= date_trunc('month', NOW())`
    ) as { count: string }[];
    const mtdPosts = parseInt(mtdResult[0]?.count || '0', 10);
    const mtdSpend = mtdPosts * COST_PER_VIDEO;

    const batchVideos = channels.length * MAX_VIDEOS_PER_CHANNEL;
    const batchEstimatedCost = batchVideos * COST_PER_VIDEO;
    const projectedTotal = mtdSpend + batchEstimatedCost;

    console.log(
      `[YT-CRON] Budget: MTD $${mtdSpend.toFixed(2)} (${mtdPosts} posts) + batch $${batchEstimatedCost.toFixed(2)} (${batchVideos} est. videos) = $${projectedTotal.toFixed(2)} / $${monthlyBudget} cap`
    );

    if (projectedTotal > monthlyBudget) {
      console.warn(`[YT-CRON] SKIPPING: projected $${projectedTotal.toFixed(2)} exceeds $${monthlyBudget} monthly budget`);
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: 'Monthly budget cap exceeded',
        monthlyBudget,
        mtdSpend: parseFloat(mtdSpend.toFixed(2)),
        batchEstimatedCost: parseFloat(batchEstimatedCost.toFixed(2)),
        projectedTotal: parseFloat(projectedTotal.toFixed(2)),
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Build webhook URL
    const baseUrl = new URL(request.url).origin;
    const webhookUrl = `${baseUrl}/api/webhooks/apify`;
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET?.trim();

    // 4. Start Apify run (single batch — only 18 channels)
    const client = new ApifyClient({ token: apiKey });
    const actorId = 'streamers/youtube-scraper';

    const channelUrls = channels.map((c) => c.profile_url);

    console.log(
      `[YT-CRON] Starting scrape: ${channels.length} channels, ${MAX_VIDEOS_PER_CHANNEL} videos each (~$${batchEstimatedCost.toFixed(2)})`
    );

    const run = await client.actor(actorId).start({
      channelUrls,
      maxResults: MAX_VIDEOS_PER_CHANNEL,
      scrapeTranscripts: true,
    }, {
      webhooks: [
        {
          eventTypes: ['ACTOR.RUN.SUCCEEDED' as const],
          requestUrl: webhookUrl,
          ...(webhookSecret
            ? { headersTemplate: JSON.stringify({ 'X-Apify-Webhook-Secret': webhookSecret }) }
            : {}),
        },
      ],
    });

    console.log(`[YT-CRON] Run started: ${run.id}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[YT-CRON] Trigger complete in ${duration}s. Webhook will process results at ${webhookUrl}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      channelsTotal: channels.length,
      maxVideosPerChannel: MAX_VIDEOS_PER_CHANNEL,
      budget: {
        monthlyBudget,
        mtdSpend: parseFloat(mtdSpend.toFixed(2)),
        mtdPosts,
        batchEstimatedCost: parseFloat(batchEstimatedCost.toFixed(2)),
        projectedTotal: parseFloat(projectedTotal.toFixed(2)),
      },
      runId: run.id,
      webhookUrl,
    });
  } catch (error) {
    console.error('[YT-CRON] Scrape failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'YouTube scrape cron failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
