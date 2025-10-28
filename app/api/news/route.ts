import { NextResponse } from 'next/server';
import { getArticles } from '@/lib/intelligence';

// GET /api/news - Get news articles feed
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const profileId = searchParams.get('profileId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const minRelevanceScore = parseFloat(searchParams.get('minRelevanceScore') || '0.6');

    const topicIdsParam = searchParams.get('topicIds');
    const topicIds = topicIdsParam
      ? topicIdsParam.split(',').map(id => parseInt(id))
      : undefined;

    const options: Parameters<typeof getArticles>[0] = {
      limit,
      offset,
      minRelevanceScore,
    };

    if (workspaceId) options.workspaceId = parseInt(workspaceId);
    if (profileId) options.profileId = parseInt(profileId);
    if (category) options.category = category;
    if (topicIds) options.topicIds = topicIds;

    const result = await getArticles(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
