/**
 * LinkedIn Cron: Non-blocking Apify trigger
 *
 * Runs daily at 6 AM UTC. Queries all profiles, groups by staleness,
 * and starts Apify runs with start() (returns immediately).
 * When Apify finishes, it POSTs results to /api/webhooks/apify.
 *
 * Includes monthly budget cap to prevent silent credit exhaustion.
 * Total execution: <10 seconds (no timeout risk).
 */

import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { getProfiles, groupProfilesByMaxPosts, queryDatabase } from '@/lib/db';

const COST_PER_POST = 0.002; // $0.002 per post on Apify

export const maxDuration = 60; // Generous but this should finish in <10s

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && authHeader && authHeader !== expectedAuth) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[CRON] Starting LinkedIn profile scrape (non-blocking)...');

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

    // 1. Get all profiles
    const profiles = await getProfiles();
    console.log(`[CRON] Found ${profiles.length} profiles`);

    if (profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No profiles to scrape',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Group by staleness (smart batching)
    const groups = groupProfilesByMaxPosts(profiles);
    console.log(
      `[CRON] ${groups.length} groups:`,
      groups.map((g) => ({
        group: g.groupName,
        count: g.profiles.length,
        maxPosts: g.maxPosts,
      }))
    );

    // 3. Budget cap check
    const monthlyBudget = parseFloat(process.env.APIFY_MONTHLY_BUDGET || '35');

    // Count posts scraped this month to estimate month-to-date spend
    const mtdResult = await queryDatabase(
      `SELECT COUNT(*) as count FROM posts WHERE scraped_at >= date_trunc('month', NOW())`
    ) as { count: string }[];
    const mtdPosts = parseInt(mtdResult[0]?.count || '0', 10);
    const mtdSpend = mtdPosts * COST_PER_POST;

    // Estimate cost of this batch
    const batchPosts = groups.reduce(
      (sum, g) => sum + g.profiles.length * g.maxPosts, 0
    );
    const batchEstimatedCost = batchPosts * COST_PER_POST;
    const projectedTotal = mtdSpend + batchEstimatedCost;

    console.log(
      `[CRON] Budget: MTD $${mtdSpend.toFixed(2)} (${mtdPosts} posts) + batch $${batchEstimatedCost.toFixed(2)} (${batchPosts} est. posts) = $${projectedTotal.toFixed(2)} / $${monthlyBudget} cap`
    );

    if (projectedTotal > monthlyBudget) {
      console.warn(`[CRON] SKIPPING: projected $${projectedTotal.toFixed(2)} exceeds $${monthlyBudget} monthly budget`);
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: 'Monthly budget cap exceeded',
        monthlyBudget,
        mtdSpend: parseFloat(mtdSpend.toFixed(2)),
        mtdPosts,
        batchEstimatedCost: parseFloat(batchEstimatedCost.toFixed(2)),
        projectedTotal: parseFloat(projectedTotal.toFixed(2)),
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Build webhook URL
    const baseUrl = new URL(request.url).origin;
    const webhookUrl = `${baseUrl}/api/webhooks/apify`;
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET?.trim();

    // 5. Start Apify runs (non-blocking)
    const client = new ApifyClient({ token: apiKey });
    const actorId = 'harvestapi/linkedin-profile-posts';
    const startedRuns = [];

    const APIFY_MAX_URLS = 50;

    for (const group of groups) {
      if (group.profiles.length === 0) continue;

      // Split into chunks of 50 (Apify targetUrls limit)
      const allUrls = group.profiles.map((p) => p.profile_url);
      const chunks: string[][] = [];
      for (let i = 0; i < allUrls.length; i += APIFY_MAX_URLS) {
        chunks.push(allUrls.slice(i, i + APIFY_MAX_URLS));
      }

      for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        const chunkUrls = chunks[chunkIdx];
        const chunkLabel = chunks.length > 1
          ? `${group.groupName} [${chunkIdx + 1}/${chunks.length}]`
          : group.groupName;
        const chunkEstimatedCost = chunkUrls.length * group.maxPosts * COST_PER_POST;

        try {
          console.log(
            `[CRON] Starting ${chunkLabel}: ${chunkUrls.length} profiles, ${group.maxPosts} posts each (~$${chunkEstimatedCost.toFixed(2)})`
          );

          // start() returns immediately with run metadata (doesn't wait for completion)
          const run = await client.actor(actorId).start({
            targetUrls: chunkUrls,
            maxPosts: group.maxPosts,
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

          console.log(`[CRON] ${chunkLabel} started: run ${run.id}`);

          startedRuns.push({
            group: chunkLabel,
            profileCount: chunkUrls.length,
            maxPosts: group.maxPosts,
            estimatedCost: parseFloat(chunkEstimatedCost.toFixed(2)),
            runId: run.id,
          });
        } catch (error) {
          console.error(`[CRON] Failed to start ${chunkLabel}:`, error);
          startedRuns.push({
            group: chunkLabel,
            profileCount: chunkUrls.length,
            maxPosts: group.maxPosts,
            estimatedCost: parseFloat(chunkEstimatedCost.toFixed(2)),
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[CRON] All runs started in ${duration}s. Webhook will process results at ${webhookUrl}`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      profilesTotal: profiles.length,
      groupCount: groups.length,
      budget: {
        monthlyBudget,
        mtdSpend: parseFloat(mtdSpend.toFixed(2)),
        mtdPosts,
        batchEstimatedCost: parseFloat(batchEstimatedCost.toFixed(2)),
        projectedTotal: parseFloat(projectedTotal.toFixed(2)),
      },
      runs: startedRuns,
      webhookUrl,
    });
  } catch (error) {
    console.error('[CRON] Scrape failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Scrape cron failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
