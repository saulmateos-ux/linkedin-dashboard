import { NextResponse } from 'next/server';
import { getYouTubeChannels } from '@/lib/db';

export async function GET() {
  try {
    const channels = await getYouTubeChannels();
    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Error fetching YouTube channels:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}
