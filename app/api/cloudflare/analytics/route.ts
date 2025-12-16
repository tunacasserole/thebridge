import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

interface CloudflareAnalytics {
  totals: {
    requests: {
      all: number;
      cached: number;
      uncached: number;
      content_type: Record<string, number>;
      country: Record<string, number>;
      ssl: { encrypted: number; unencrypted: number };
      http_status: Record<string, number>;
    };
    bandwidth: {
      all: number;
      cached: number;
      uncached: number;
      content_type: Record<string, number>;
      country: Record<string, number>;
      ssl: { encrypted: number; unencrypted: number };
    };
    threats: {
      all: number;
      type: Record<string, number>;
      country: Record<string, number>;
    };
    pageviews: {
      all: number;
      search_engines: Record<string, number>;
    };
    uniques: {
      all: number;
    };
  };
  timeseries: Array<{
    since: string;
    until: string;
    requests: { all: number; cached: number; uncached: number };
    bandwidth: { all: number; cached: number; uncached: number };
    threats: { all: number };
    pageviews: { all: number };
    uniques: { all: number };
  }>;
}

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
  query: {
    since: string;
    until: string;
    time_delta: number;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get('zoneId');
  const since = searchParams.get('since') || '-7d';
  const until = searchParams.get('until') || 'now';

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
    // Try MCP first - Cloudflare Observability provides richer analytics
    const { tools, failedServers } = await loadMCPTools(['cloudflare-observability']);

    if (!failedServers.includes('cloudflare-observability') && tools.length > 0) {
      // Try to find analytics tools from MCP
      const analyticsToolNames = [
        'cloudflare-observability__get_analytics',
        'cloudflare-observability__zone_analytics',
        'cloudflare-observability__analytics',
        'cloudflare-observability__get_metrics',
      ];

      for (const toolName of analyticsToolNames) {
        const tool = tools.find(t => t.name === toolName);
        if (tool) {
          const result = await executeMCPTool(toolName, {
            zoneId,
            since,
            until,
          });
          if (result.success) {
            return NextResponse.json({
              success: true,
              zoneId,
              data: result.data,
              source: 'mcp',
            });
          }
        }
      }
    }

    // Fallback to direct REST API
    if (!zoneId) {
      // First get all zones
      const zonesResponse = await fetch(`${CLOUDFLARE_API_BASE}/zones`, {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!zonesResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch zones list',
          },
          { status: zonesResponse.status }
        );
      }

      const zonesData = await zonesResponse.json();

      // Get analytics for each zone
      const analyticsPromises = zonesData.result.slice(0, 5).map(async (zone: { id: string; name: string }) => {
        const analyticsUrl = `${CLOUDFLARE_API_BASE}/zones/${zone.id}/analytics/dashboard?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&continuous=true`;

        const response = await fetch(analyticsUrl, {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return {
            zoneId: zone.id,
            zoneName: zone.name,
            analytics: data.result,
          };
        }
        return {
          zoneId: zone.id,
          zoneName: zone.name,
          error: 'Failed to fetch analytics',
        };
      });

      const results = await Promise.all(analyticsPromises);

      return NextResponse.json({
        success: true,
        data: results,
        query: { since, until },
        source: 'rest-api',
      });
    }

    // Get analytics for specific zone
    const analyticsUrl = `${CLOUDFLARE_API_BASE}/zones/${zoneId}/analytics/dashboard?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}&continuous=true`;

    const response = await fetch(analyticsUrl, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudflare Analytics API error:', response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Cloudflare API error: ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data: CloudflareResponse<CloudflareAnalytics> = await response.json();

    if (!data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data.errors?.[0]?.message || 'Failed to fetch analytics',
          errors: data.errors,
        },
        { status: 500 }
      );
    }

    // Transform to a more usable format
    const analytics = {
      summary: {
        totalRequests: data.result.totals?.requests?.all || 0,
        cachedRequests: data.result.totals?.requests?.cached || 0,
        uncachedRequests: data.result.totals?.requests?.uncached || 0,
        cacheHitRate: data.result.totals?.requests?.all
          ? Math.round((data.result.totals.requests.cached / data.result.totals.requests.all) * 100)
          : 0,
        totalBandwidth: data.result.totals?.bandwidth?.all || 0,
        cachedBandwidth: data.result.totals?.bandwidth?.cached || 0,
        threats: data.result.totals?.threats?.all || 0,
        pageviews: data.result.totals?.pageviews?.all || 0,
        uniqueVisitors: data.result.totals?.uniques?.all || 0,
      },
      byCountry: data.result.totals?.requests?.country || {},
      byContentType: data.result.totals?.requests?.content_type || {},
      httpStatus: data.result.totals?.requests?.http_status || {},
      timeseries: data.result.timeseries || [],
      query: data.query,
    };

    return NextResponse.json({
      success: true,
      zoneId,
      data: analytics,
      source: 'rest-api',
    });
  } catch (error) {
    console.error('Cloudflare analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Cloudflare analytics',
      },
      { status: 500 }
    );
  }
}
