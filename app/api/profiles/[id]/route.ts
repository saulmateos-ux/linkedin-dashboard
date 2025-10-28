import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * PUT /api/profiles/[id]
 * Update a profile's information
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profileId = parseInt(id);
    if (isNaN(profileId)) {
      return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 });
    }

    const body = await request.json();
    const { displayName, profileType, headline, followerCount, isPrimary } = body;

    // Validation
    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    if (!profileType) {
      return NextResponse.json({ error: 'Profile type is required' }, { status: 400 });
    }

    // If setting as primary, unset other primary profiles first
    if (isPrimary) {
      await pool.query(
        'UPDATE profiles SET is_primary = false WHERE is_primary = true'
      );
    }

    // Update profile
    const result = await pool.query(
      `UPDATE profiles
       SET display_name = $1,
           profile_type = $2,
           headline = $3,
           follower_count = $4,
           is_primary = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [displayName, profileType, headline, followerCount || null, isPrimary, profileId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profiles/[id]
 * Delete a profile and all its associated posts
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profileId = parseInt(id);
    if (isNaN(profileId)) {
      return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 });
    }

    // Check if profile exists
    const checkResult = await pool.query(
      'SELECT id, display_name FROM profiles WHERE id = $1',
      [profileId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Delete associated posts first (foreign key constraint)
    await pool.query('DELETE FROM posts WHERE profile_id = $1', [profileId]);

    // Delete profile from workspaces
    await pool.query('DELETE FROM workspace_profiles WHERE profile_id = $1', [profileId]);

    // Delete the profile
    await pool.query('DELETE FROM profiles WHERE id = $1', [profileId]);

    return NextResponse.json({
      success: true,
      message: `Profile deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete profile: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
