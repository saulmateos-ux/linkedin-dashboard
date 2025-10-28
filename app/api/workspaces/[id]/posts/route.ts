import { NextResponse } from 'next/server';
import { getWorkspacePosts } from '@/lib/db';

/**
 * GET /api/workspaces/[id]/posts
 * Get all posts for profiles in a workspace
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

    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') || 'published_at') as 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { posts, total } = await getWorkspacePosts(workspaceId, {
      search,
      sortBy,
      order,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      posts,
      total,
      pagination: {
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching workspace posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
