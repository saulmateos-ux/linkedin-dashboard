import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/db';

/**
 * GET /api/profiles/[id]/debug
 * Debug endpoint to check profile data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profileId = parseInt(id);

    const profile = await getProfile(profileId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        profile_url: profile.profile_url,
        is_company: profile.is_company,
        profile_type: profile.profile_type,
      },
      apify_config: {
        has_api_key: !!process.env.APIFY_API_KEY,
        default_actor: process.env.APIFY_ACTOR_ID || 'harvestapi/linkedin-profile-posts',
        company_actor: process.env.APIFY_COMPANY_ACTOR_ID || 'apimaestro/linkedin-company-posts',
        actor_to_use: profile.is_company
          ? (process.env.APIFY_COMPANY_ACTOR_ID || 'apimaestro/linkedin-company-posts')
          : (process.env.APIFY_ACTOR_ID || 'harvestapi/linkedin-profile-posts'),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
