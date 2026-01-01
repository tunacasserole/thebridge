// Rootly Incidents API Route - Create new incidents

import { NextRequest, NextResponse } from 'next/server';
import { createIncident, fetchSeverities, fetchServices, fetchEnvironments } from '@/lib/rootly';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rootly/incidents
 * Create a new incident in Rootly
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ROOTLY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Rootly API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { title, severity_id, summary, service_ids, environment_ids } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const incident = await createIncident(apiKey, title.trim(), {
      severity_id,
      summary: summary?.trim() || undefined,
      service_ids: Array.isArray(service_ids) ? service_ids : undefined,
      environment_ids: Array.isArray(environment_ids) ? environment_ids : undefined,
    });

    return NextResponse.json({
      success: true,
      data: incident,
      message: 'Incident created successfully',
    });
  } catch (error) {
    console.error('Error creating Rootly incident:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create incident',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rootly/incidents?type=severities|services|environments
 * Fetch reference data for incident creation
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ROOTLY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Rootly API key not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    switch (type) {
      case 'severities': {
        const severities = await fetchSeverities(apiKey);
        return NextResponse.json({ success: true, data: severities });
      }
      case 'services': {
        const services = await fetchServices(apiKey);
        return NextResponse.json({ success: true, data: services });
      }
      case 'environments': {
        const environments = await fetchEnvironments(apiKey);
        return NextResponse.json({ success: true, data: environments });
      }
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter. Use: severities, services, or environments' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching Rootly reference data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reference data',
      },
      { status: 500 }
    );
  }
}
