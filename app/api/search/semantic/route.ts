import { NextResponse } from 'next/server';
import { searchPosts, findSimilarPosts } from '@/lib/weaviate';

export const maxDuration = 60;

/**
 * POST /api/search/semantic
 * Semantic search using Weaviate
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, limit = 10, filters, mode = 'search' } = body;

    if (!query && mode === 'search') {
      return NextResponse.json(
        { error: 'Query is required for semantic search' },
        { status: 400 }
      );
    }

    let results;

    if (mode === 'similar' && query) {
      // Find similar posts to a given post ID
      results = await findSimilarPosts(query, limit);
    } else {
      // Semantic search
      results = await searchPosts(query, limit, filters);
    }

    return NextResponse.json({
      success: true,
      query,
      mode,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    return NextResponse.json(
      {
        error: 'Semantic search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search/semantic?q=query&limit=10
 * Simple GET endpoint for testing
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const workspaceId = searchParams.get('workspace');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const filters: { workspaceIds?: number[] } = {};
    if (workspaceId) {
      filters.workspaceIds = [parseInt(workspaceId)];
    }

    const results = await searchPosts(query, limit, filters);

    return NextResponse.json({
      success: true,
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    return NextResponse.json(
      {
        error: 'Semantic search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
