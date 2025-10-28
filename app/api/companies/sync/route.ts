import { NextResponse } from 'next/server';
import { autoLinkProfilesToCompanies } from '@/lib/db';

export async function POST() {
  try {
    console.log('🔗 Starting company auto-linking...');

    const result = await autoLinkProfilesToCompanies();

    return NextResponse.json({
      success: true,
      message: `Linked ${result.linked} profiles to companies`,
      linked: result.linked,
      unmatched: result.unmatched,
    });
  } catch (error) {
    console.error('Error auto-linking companies:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to auto-link companies',
      },
      { status: 500 }
    );
  }
}
