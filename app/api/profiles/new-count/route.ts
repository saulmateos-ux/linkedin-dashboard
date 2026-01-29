import { NextResponse } from 'next/server';
import { getProfiles, getWorkspaceProfiles } from '@/lib/db';

/**
 * POST /api/profiles/new-count
 * Count profiles without background data (profile_scraped_at IS NULL)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileIds, workspaceId } = body;

    if (!profileIds && !workspaceId) {
      return NextResponse.json(
        { error: 'Must provide either profileIds or workspaceId' },
        { status: 400 }
      );
    }

    // Get profiles to check
    let profilesToCheck;
    if (workspaceId) {
      profilesToCheck = await getWorkspaceProfiles(workspaceId);
    } else {
      const allProfiles = await getProfiles();
      profilesToCheck = allProfiles.filter(p => profileIds.includes(p.id));
    }

    // Count profiles without background data
    const newProfilesCount = profilesToCheck.filter(p => !p.profile_scraped_at).length;

    return NextResponse.json({
      count: newProfilesCount,
      total: profilesToCheck.length,
    });

  } catch (error) {
    console.error('Error counting new profiles:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to count new profiles',
      },
      { status: 500 }
    );
  }
}
