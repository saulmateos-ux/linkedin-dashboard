import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const sortBy = (searchParams.get('sortBy') || 'published_at') as 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // Get all posts (no limit for export)
    const { posts } = await getPosts({
      search,
      sortBy,
      order,
      limit: 10000, // Get all posts
      offset: 0,
    });

    // Generate CSV
    const headers = [
      'Content',
      'Published',
      'Author',
      'Likes',
      'Comments',
      'Shares',
      'Total Engagement',
      'URL',
    ];

    const csvRows = [
      headers.join(','),
      ...posts.map(post => {
        const content = (post.content_preview || post.content || '')
          .replace(/"/g, '""') // Escape quotes
          .substring(0, 200); // Limit length

        const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        return [
          `"${content}"`,
          publishedDate,
          `"${post.author_name || ''}"`,
          post.likes,
          post.comments,
          post.shares,
          post.engagement_total,
          `"${post.post_url}"`,
        ].join(',');
      }),
    ];

    const csv = csvRows.join('\n');

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="linkedin-posts-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export posts' },
      { status: 500 }
    );
  }
}
