import { NextResponse } from 'next/server';
import { getWorkspaceTopics, addTopicToWorkspace, removeTopicFromWorkspace } from '@/lib/intelligence';

// GET /api/workspaces/[id]/topics - List workspace topics
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID' },
        { status: 400 }
      );
    }

    const topics = await getWorkspaceTopics(workspaceId);
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Failed to fetch workspace topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace topics' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/topics - Add topic to workspace
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { topicId } = body;

    if (!topicId) {
      return NextResponse.json(
        { error: 'Missing topicId' },
        { status: 400 }
      );
    }

    await addTopicToWorkspace(workspaceId, topicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add topic to workspace:', error);
    return NextResponse.json(
      { error: 'Failed to add topic to workspace' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id]/topics?topicId=X - Remove topic from workspace
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);

    if (isNaN(workspaceId)) {
      return NextResponse.json(
        { error: 'Invalid workspace ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'Missing topicId query parameter' },
        { status: 400 }
      );
    }

    const success = await removeTopicFromWorkspace(workspaceId, parseInt(topicId));

    if (!success) {
      return NextResponse.json(
        { error: 'Topic not found in workspace' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove topic from workspace:', error);
    return NextResponse.json(
      { error: 'Failed to remove topic from workspace' },
      { status: 500 }
    );
  }
}
