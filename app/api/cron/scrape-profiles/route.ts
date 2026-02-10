/**
 * LinkedIn Cron: Non-blocking Apify trigger
 *
 * Runs daily at 6 AM UTC. Queries all profiles, groups by staleness,
 * and starts Apify runs with start() (returns immediately).
 * When Apify finishes, it POSTs results to /api/webhooks/apify.
 *
 * Total execution: <10 seconds (no timeout risk).
 */

import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { getProfiles, groupProfilesByMaxPosts } from '@/lib/db';

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

    // 3. Build webhook URL
    const baseUrl = new URL(request.url).origin;
    const webhookUrl = `${baseUrl}/api/webhooks/apify`;
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;

    // 4. Start Apify runs (non-blocking)
    const client = new ApifyClient({ token: apiKey });
    const actorId = 'harvestapi/linkedin-profile-posts';
    const startedRuns = [];

    for (const group of groups) {
      if (group.profiles.length === 0) continue;

      try {
        const groupUrls = group.profiles.map((p) => p.profile_url);

        console.log(
          `[CRON] Starting ${group.groupName}: ${group.profiles.length} profiles, ${group.maxPosts} posts each`
        );

        // start() returns immediately with run metadata (doesn't wait for completion)
        const run = await client.actor(actorId).start({
          targetUrls: groupUrls,
          maxPosts: group.maxPosts,
        }, {
          webhooks: [
            {
              eventTypes: ['ACTOR.RUN.SUCCEEDED' as const],
              requestUrl: webhookUrl,
              ...(webhookSecret
                ? { headersTemplate: `{"X-Apify-Webhook-Secret": "${webhookSecret}"}` }
                : {}),
            },
          ],
        });

        console.log(`[CRON] ${group.groupName} started: run ${run.id}`);

        startedRuns.push({
          group: group.groupName,
          profileCount: group.profiles.length,
          maxPosts: group.maxPosts,
          runId: run.id,
        });
      } catch (error) {
        console.error(`[CRON] Failed to start ${group.groupName}:`, error);
        startedRuns.push({
          group: group.groupName,
          profileCount: group.profiles.length,
          maxPosts: group.maxPosts,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
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
