import { NextResponse } from 'next/server';
import { getTopics, createTopic } from '@/lib/intelligence';

// GET /api/topics - List all topics
export async function GET() {
  try {
    const topics = await getTopics();
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

// POST /api/topics - Create new topic
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, keywords, description, color } = body;

    // Validation
    if (!name || !type || !keywords) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, keywords' },
        { status: 400 }
      );
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords must be a non-empty array' },
        { status: 400 }
      );
    }

    const validTypes = ['industry', 'technology', 'event_type', 'keyword'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const topic = await createTopic({
      name,
      type,
      keywords,
      description,
      color: color || '#3b82f6',
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('Failed to create topic:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle unique constraint violation
    if (errorMessage.includes('unique')) {
      return NextResponse.json(
        { error: 'A topic with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}
