import { NextResponse } from 'next/server';
import { acknowledgeSignal } from '@/lib/intelligence';

// PATCH /api/news/signals/[id] - Acknowledge signal
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const signalId = parseInt(id);

    if (isNaN(signalId)) {
      return NextResponse.json(
        { error: 'Invalid signal ID' },
        { status: 400 }
      );
    }

    await acknowledgeSignal(signalId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to acknowledge signal:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge signal' },
      { status: 500 }
    );
  }
}
