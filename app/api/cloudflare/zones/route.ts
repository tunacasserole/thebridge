import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[];
  original_registrar: string;
  original_dnshost: string;
  modified_on: string;
  created_on: string;
  activated_on: string;
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    frequency: string;
    is_subscribed: boolean;
    can_subscribe: boolean;
    legacy_id: string;
    legacy_discount: boolean;
    externally_managed: boolean;
  };
}

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

export async function GET() {
  if (!CLOUDFLARE_API_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        error: 'Cloudflare API token not configured',
        hint: 'Set CLOUDFLARE_API_TOKEN in your environment variables',
      },
      { status: 503 }
    );
  }

  try {
    // Try MCP first for richer data
    const { tools, failedServers } = await loadMCPTools(['cloudflare-observability', 'cloudflare-graphql']);

    // Check if any Cloudflare MCP server is available
    const mcpAvailable = !failedServers.includes('cloudflare-observability') ||
                         !failedServers.includes('cloudflare-graphql');

    if (mcpAvailable && tools.length > 0) {
      // Try to find a zones tool from MCP
      const zonesToolNames = [
        'cloudflare-observability__list_zones',
        'cloudflare-observability__zones',
        'cloudflare-graphql__zones',
        'cloudflare-graphql__list_zones',
      ];

      for (const toolName of zonesToolNames) {
        const tool = tools.find(t => t.name === toolName);
        if (tool) {
          const result = await executeMCPTool(toolName, {});
          if (result.success) {
            const mcpData = result.data as { zones?: unknown[] } | unknown[];
            return NextResponse.json({
              success: true,
              zones: Array.isArray(mcpData) ? mcpData : (mcpData as { zones?: unknown[] })?.zones || [],
              source: 'mcp',
            });
          }
        }
      }
    }

    // Fallback to direct REST API
    const response = await fetch(`${CLOUDFLARE_API_BASE}/zones`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudflare API error:', response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Cloudflare API error: ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data: CloudflareResponse<CloudflareZone[]> = await response.json();

    if (!data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data.errors?.[0]?.message || 'Failed to fetch zones',
          errors: data.errors,
        },
        { status: 500 }
      );
    }

    // Transform to a simpler format for the UI
    const zones = data.result.map(zone => ({
      id: zone.id,
      name: zone.name,
      status: zone.status,
      paused: zone.paused,
      type: zone.type,
      developmentMode: zone.development_mode > 0,
      plan: zone.plan?.name || 'Unknown',
      nameServers: zone.name_servers,
      createdOn: zone.created_on,
      modifiedOn: zone.modified_on,
    }));

    return NextResponse.json({
      success: true,
      zones,
      total: data.result_info?.total_count || zones.length,
      source: 'rest-api',
    });
  } catch (error) {
    console.error('Cloudflare zones API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Cloudflare zones',
      },
      { status: 500 }
    );
  }
}
