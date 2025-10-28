import { NextResponse } from 'next/server';
import { getProfileComplete } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const profileId = parseInt(params.id);

    if (isNaN(profileId)) {
      return NextResponse.json(
        { error: 'Invalid profile ID' },
        { status: 400 }
      );
    }

    const data = await getProfileComplete(profileId);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching profile background:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch profile background',
      },
      { status: 500 }
    );
  }
}
