// Rootly Incident Management API Route

import { NextRequest, NextResponse } from 'next/server';
import { updateIncidentStatus } from '@/lib/rootly';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/rootly/incident/[id]
 * Update incident status (supports all status transitions)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = process.env.ROOTLY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Rootly API key not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['in_triage', 'started', 'mitigated', 'resolved', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    await updateIncidentStatus(apiKey, id, status);

    return NextResponse.json({
      success: true,
      message: `Incident status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating Rootly incident:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update incident',
      },
      { status: 500 }
    );
  }
}
