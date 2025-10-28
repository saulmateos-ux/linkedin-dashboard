import { NextResponse } from 'next/server';
import {
  getWorkspaces,
  createWorkspace,
  Workspace,
} from '@/lib/db';

/**
 * GET /api/workspaces
 * List all workspaces with profile/post counts
 */
export async function GET() {
  try {
    const workspaces = await getWorkspaces();

    return NextResponse.json({
      success: true,
      workspaces,
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces
 * Create a new workspace
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    // Create workspace
    const workspace = await createWorkspace({
      name: name.trim(),
      description: description || null,
      color: color || '#6366f1',
    });

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error) {
    console.error('Error creating workspace:', error);

    // Handle duplicate name
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return NextResponse.json(
        { error: 'A workspace with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
