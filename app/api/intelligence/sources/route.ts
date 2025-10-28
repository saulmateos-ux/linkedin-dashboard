import { NextResponse } from 'next/server';
import { getContentSources } from '@/lib/intelligence';

// GET /api/intelligence/sources - List all content sources
export async function GET() {
  try {
    const sources = await getContentSources();
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Failed to fetch content sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content sources' },
      { status: 500 }
    );
  }
}
