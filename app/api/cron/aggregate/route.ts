import { NextResponse } from 'next/server';
import { aggregateContent } from '@/lib/aggregators';

export const maxDuration = 300; // 5 minutes max

// GET /api/cron/aggregate - Run content aggregation (called by cron job)
export async function GET(request: Request) {
  // Verify cron secret (Vercel Cron authentication)
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && authHeader !== expectedAuth) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[CRON] Starting content aggregation...');

  try {
    const startTime = Date.now();

    const result = await aggregateContent();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[CRON] Aggregation completed in ${duration}s`);
    console.log(`[CRON] Articles processed: ${result.articlesProcessed}`);
    console.log(`[CRON] Errors: ${result.errors.length}`);

    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      articlesProcessed: result.articlesProcessed,
      errors: result.errors,
    });
  } catch (error) {
    console.error('[CRON] Aggregation failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Aggregation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
