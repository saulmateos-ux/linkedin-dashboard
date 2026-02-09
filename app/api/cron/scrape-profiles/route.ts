import { NextResponse } from 'next/server';
import { getProfiles, groupProfilesByMaxPosts } from '@/lib/db';

export const maxDuration = 300; // 5 minutes max

// GET /api/cron/scrape-profiles - Scrape all LinkedIn profiles (called by daily cron)
export async function GET(request: Request) {
  // Verify cron secret (Vercel Cron authentication)
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && authHeader && authHeader !== expectedAuth) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[CRON] Starting LinkedIn profile scrape...');

  try {
    const startTime = Date.now();

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
    console.log(`[CRON] ${groups.length} groups:`, groups.map(g => ({
      group: g.groupName,
      count: g.profiles.length,
      maxPosts: g.maxPosts,
    })));

    // 3. Call /api/scrape for each group
    const baseUrl = new URL(request.url).origin;
    const groupResults = [];

    for (const group of groups) {
      if (group.profiles.length === 0) continue;

      try {
        console.log(`[CRON] Scraping ${group.groupName}: ${group.profiles.length} profiles, ${group.maxPosts} posts each`);

        const response = await fetch(`${baseUrl}/api/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileIds: group.profiles.map(p => p.id),
          }),
        });

        const result = await response.json();

        groupResults.push({
          group: group.groupName,
          profileCount: group.profiles.length,
          maxPosts: group.maxPosts,
          success: response.ok,
          ...result,
        });

        console.log(`[CRON] ${group.groupName} done:`, {
          success: response.ok,
          newPosts: result.newPosts,
          updatedPosts: result.updatedPosts,
        });
      } catch (error) {
        console.error(`[CRON] ${group.groupName} failed:`, error);
        groupResults.push({
          group: group.groupName,
          profileCount: group.profiles.length,
          maxPosts: group.maxPosts,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalNew = groupResults.reduce((sum, r) => sum + (r.newPosts || 0), 0);
    const totalUpdated = groupResults.reduce((sum, r) => sum + (r.updatedPosts || 0), 0);

    console.log(`[CRON] Scrape completed in ${duration}s: ${totalNew} new, ${totalUpdated} updated`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      profilesTotal: profiles.length,
      groups: groupResults,
      totalNewPosts: totalNew,
      totalUpdatedPosts: totalUpdated,
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
