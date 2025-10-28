/**
 * Admin API: Reset last_scraped_at for profiles with zero posts
 * This fixes the bug where profiles were marked as scraped even though they returned 0 posts
 */

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId; // Optional: reset only for specific workspace

    let query: string;
    let params: unknown[];

    if (workspaceId) {
      // Reset only for profiles in specific workspace
      query = `
        UPDATE profiles p
        SET last_scraped_at = NULL
        FROM workspace_profiles wp
        WHERE p.id = wp.profile_id
          AND wp.workspace_id = $1
          AND p.last_scraped_at IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM posts
            WHERE posts.profile_id = p.id
          )
      `;
      params = [workspaceId];
    } else {
      // Reset for all profiles across all workspaces
      query = `
        UPDATE profiles
        SET last_scraped_at = NULL
        WHERE last_scraped_at IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM posts
            WHERE posts.profile_id = profiles.id
          )
      `;
      params = [];
    }

    const result = await pool.query(query, params);

    console.log(`Reset last_scraped_at for ${result.rowCount} profiles with zero posts`);

    return NextResponse.json({
      success: true,
      message: `Reset ${result.rowCount} profiles that had last_scraped_at but zero posts`,
      profilesReset: result.rowCount,
      workspaceId: workspaceId || 'all',
    });

  } catch (error) {
    console.error('Reset error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to reset profiles',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Preview: Show how many profiles would be reset (read-only)
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_to_reset,
        COUNT(DISTINCT wp.workspace_id) as affected_workspaces
      FROM profiles p
      LEFT JOIN workspace_profiles wp ON p.id = wp.profile_id
      WHERE p.last_scraped_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM posts WHERE posts.profile_id = p.id
        )
    `);

    return NextResponse.json({
      message: 'Preview: Profiles that would be reset',
      totalProfilesToReset: parseInt(result.rows[0].total_to_reset),
      affectedWorkspaces: parseInt(result.rows[0].affected_workspaces),
      note: 'Use POST to actually reset these profiles',
    });

  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Failed to get preview' },
      { status: 500 }
    );
  }
}
