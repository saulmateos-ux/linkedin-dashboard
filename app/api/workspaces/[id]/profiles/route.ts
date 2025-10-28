import { NextResponse } from 'next/server';
import {
  addProfileToWorkspace,
  removeProfileFromWorkspace,
  getWorkspaceProfiles,
} from '@/lib/db';

/**
 * GET /api/workspaces/[id]/profiles
 * Get all profiles in a workspace
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID' },
        { status: 400 }
      );
    }

    const profiles = await getWorkspaceProfiles(workspaceId);

    return NextResponse.json({
      success: true,
      profiles,
    });
  } catch (error) {
    console.error('Error fetching workspace profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[id]/profiles
 * Add a profile to a workspace
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { profileId } = body;

    if (!profileId || isNaN(parseInt(profileId, 10))) {
      return NextResponse.json(
        { error: 'Valid profile ID is required' },
        { status: 400 }
      );
    }

    await addProfileToWorkspace(workspaceId, parseInt(profileId, 10));

    return NextResponse.json({
      success: true,
      message: 'Profile added to workspace',
    });
  } catch (error) {
    console.error('Error adding profile to workspace:', error);
    return NextResponse.json(
      { error: 'Failed to add profile to workspace' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[id]/profiles
 * Remove a profile from a workspace
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId || isNaN(parseInt(profileId, 10))) {
      return NextResponse.json(
        { error: 'Valid profile ID is required' },
        { status: 400 }
      );
    }

    const success = await removeProfileFromWorkspace(workspaceId, parseInt(profileId, 10));

    if (!success) {
      return NextResponse.json(
        { error: 'Profile not found in workspace' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile removed from workspace',
    });
  } catch (error) {
    console.error('Error removing profile from workspace:', error);
    return NextResponse.json(
      { error: 'Failed to remove profile from workspace' },
      { status: 500 }
    );
  }
}
