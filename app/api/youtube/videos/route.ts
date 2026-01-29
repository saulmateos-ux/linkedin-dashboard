import { NextResponse } from 'next/server';
import { getYouTubeVideos } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const sortBy = (url.searchParams.get('sort') as 'published_at' | 'views' | 'likes' | 'engagement_total') || 'published_at';
    const order = (url.searchParams.get('order') as 'asc' | 'desc') || 'desc';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const channelId = url.searchParams.get('channel') ? parseInt(url.searchParams.get('channel')!) : null;
    const workspaceId = url.searchParams.get('workspace') ? parseInt(url.searchParams.get('workspace')!) : null;

    const result = await getYouTubeVideos({ search, sortBy, order, limit, offset, channelId, workspaceId });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
