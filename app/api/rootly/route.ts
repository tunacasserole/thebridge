// Rootly API Route - Server-side only
import { NextResponse } from 'next/server';
import { fetchRootlyDashboardData } from '@/lib/rootly';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.ROOTLY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Rootly API key not configured' },
      { status: 500 }
    );
  }

  try {
    const data = await fetchRootlyDashboardData(apiKey);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Rootly API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
