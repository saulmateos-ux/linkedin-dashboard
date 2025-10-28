import { NextResponse } from 'next/server';
import {
  getWorkspaceContentSources,
  addContentSourceToWorkspace,
  removeContentSourceFromWorkspace
} from '@/lib/intelligence';

// GET /api/workspaces/[id]/sources - List content sources for workspace
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);

    const sources = await getWorkspaceContentSources(workspaceId);
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Failed to fetch workspace sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace sources' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/sources - Add content source to workspace
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);
    const body = await request.json();
    const { sourceId } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Missing required field: sourceId' },
        { status: 400 }
      );
    }

    await addContentSourceToWorkspace(workspaceId, sourceId);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to add source to workspace:', error);
    return NextResponse.json(
      { error: 'Failed to add source to workspace' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id]/sources - Remove content source from workspace
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sourceId' },
        { status: 400 }
      );
    }

    const success = await removeContentSourceFromWorkspace(
      workspaceId,
      parseInt(sourceId)
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Source not found in workspace' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove source from workspace:', error);
    return NextResponse.json(
      { error: 'Failed to remove source from workspace' },
      { status: 500 }
    );
  }
}
