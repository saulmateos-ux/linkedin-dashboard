import { NextResponse } from 'next/server';
import { getYouTubeVideos } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const channelId = parseInt(id);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const result = await getYouTubeVideos({ channelId, limit, offset });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    return NextResponse.json({ error: 'Failed to fetch channel videos' }, { status: 500 });
  }
}
