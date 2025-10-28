import { NextResponse } from 'next/server';
import { getSignals, acknowledgeSignal } from '@/lib/intelligence';

// GET /api/news/signals - Get intelligence signals
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const acknowledged = searchParams.get('acknowledged');

    const signals = await getSignals(
      workspaceId ? parseInt(workspaceId) : undefined,
      acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined
    );

    return NextResponse.json(signals);
  } catch (error) {
    console.error('Failed to fetch signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}
