import { NextResponse } from 'next/server';
import { addProfile, addProfileToWorkspace, getProfiles } from '@/lib/db';

/**
 * GET /api/profiles
 * Get all profiles
 */
export async function GET() {
  try {
    const profiles = await getProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles
 * Create a new profile
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileUrl, displayName, profileType, notes, workspaceId, companyId } = body;

    // Validation
    const isCompanyPage = profileUrl.includes('linkedin.com/company/');
    const isPersonalProfile = profileUrl.includes('linkedin.com/in/');

    if (!isCompanyPage && !isPersonalProfile) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn URL. Must be a profile (linkedin.com/in/) or company page (linkedin.com/company/)' },
        { status: 400 }
      );
    }

    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    if (!profileType) {
      return NextResponse.json(
        { error: 'Profile type is required' },
        { status: 400 }
      );
    }

    // Extract username from URL
    const urlPattern = isCompanyPage
      ? /linkedin\.com\/company\/([^\/\?]+)/
      : /linkedin\.com\/in\/([^\/\?]+)/;

    const urlMatch = profileUrl.match(urlPattern);
    if (!urlMatch) {
      return NextResponse.json(
        { error: 'Could not extract identifier from URL' },
        { status: 400 }
      );
    }

    const username = urlMatch[1];

    // Add profile to database
    const profile = await addProfile({
      username,
      profile_url: profileUrl,
      display_name: displayName,
      profile_type: profileType,
      is_company: isCompanyPage,
      notes: notes || null,
      company_id: companyId || null,
    });

    // If workspace ID provided, add profile to that workspace
    if (workspaceId && typeof workspaceId === 'number') {
      try {
        await addProfileToWorkspace(workspaceId, profile.id);
      } catch (workspaceError) {
        console.error('Failed to add profile to workspace:', workspaceError);
        // Don't fail the whole request, profile is already created
      }
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Error adding profile:', error);

    // Handle duplicate username
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return NextResponse.json(
        { error: 'This profile already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add profile: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
