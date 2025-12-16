import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

interface FirewallEvent {
  action: string;
  clientASNDescription: string;
  clientAsn: string;
  clientCountryName: string;
  clientIP: string;
  clientRequestHTTPHost: string;
  clientRequestHTTPMethodName: string;
  clientRequestHTTPProtocol: string;
  clientRequestPath: string;
  clientRequestQuery: string;
  datetime: string;
  rayName: string;
  ruleId: string;
  source: string;
  userAgent: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get('zoneId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const since = searchParams.get('since') || '-24h';

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
    // Try MCP first - Cloudflare Audit and Observability provide security data
    const { tools, failedServers } = await loadMCPTools([
      'cloudflare-audit',
      'cloudflare-observability',
      'cloudflare-graphql',
    ]);

    const mcpAvailable =
      !failedServers.includes('cloudflare-audit') ||
      !failedServers.includes('cloudflare-observability') ||
      !failedServers.includes('cloudflare-graphql');

    if (mcpAvailable && tools.length > 0) {
      // Try to find security/firewall tools from MCP
      const securityToolNames = [
        'cloudflare-audit__get_events',
        'cloudflare-audit__firewall_events',
        'cloudflare-observability__security_events',
        'cloudflare-observability__firewall_events',
        'cloudflare-graphql__firewall_events',
      ];

      for (const toolName of securityToolNames) {
        const tool = tools.find(t => t.name === toolName);
        if (tool) {
          const result = await executeMCPTool(toolName, {
            zoneId,
            limit,
            since,
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

    // Fallback to direct REST/GraphQL API
    let targetZoneId = zoneId;

    if (!targetZoneId) {
      const zonesResponse = await fetch(`${CLOUDFLARE_API_BASE}/zones?per_page=1`, {
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
      if (zonesData.result && zonesData.result.length > 0) {
        targetZoneId = zonesData.result[0].id;
      } else {
        return NextResponse.json({
          success: true,
          events: [],
          message: 'No zones found in your Cloudflare account',
        });
      }
    }

    // Use the GraphQL API for security events (firewall events)
    const graphqlQuery = {
      query: `
        query FirewallEvents($zoneTag: string!, $limit: int!, $filter: FirewallEventsAdaptiveFilter_InputObject!) {
          viewer {
            zones(filter: {zoneTag: $zoneTag}) {
              firewallEventsAdaptive(limit: $limit, filter: $filter, orderBy: [datetime_DESC]) {
                action
                clientASNDescription
                clientAsn
                clientCountryName
                clientIP
                clientRequestHTTPHost
                clientRequestHTTPMethodName
                clientRequestHTTPProtocol
                clientRequestPath
                clientRequestQuery
                datetime
                rayName
                ruleId
                source
                userAgent
              }
            }
          }
        }
      `,
      variables: {
        zoneTag: targetZoneId,
        limit: limit,
        filter: {
          datetime_geq: since === '-24h'
            ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    };

    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlQuery),
    });

    if (!response.ok) {
      // Fallback to REST API for zone security settings
      const settingsResponse = await fetch(
        `${CLOUDFLARE_API_BASE}/zones/${targetZoneId}/settings/security_level`,
        {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        return NextResponse.json({
          success: true,
          zoneId: targetZoneId,
          securityLevel: settingsData.result?.value || 'unknown',
          events: [],
          message: 'Security events API requires Analytics Read permission. Showing security settings only.',
          source: 'rest-api',
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch security data',
          hint: 'Ensure your API token has Zone Analytics:Read permission',
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      // Try fallback to zone settings
      const settingsResponse = await fetch(
        `${CLOUDFLARE_API_BASE}/zones/${targetZoneId}/settings/security_level`,
        {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const settings = settingsResponse.ok ? await settingsResponse.json() : null;

      return NextResponse.json({
        success: true,
        zoneId: targetZoneId,
        securityLevel: settings?.result?.value || 'unknown',
        events: [],
        message: `GraphQL error: ${data.errors[0].message}. Security events may require additional permissions.`,
        source: 'rest-api',
      });
    }

    const events = data.data?.viewer?.zones?.[0]?.firewallEventsAdaptive || [];

    // Group events by action for summary
    const actionSummary: Record<string, number> = {};
    const countrySummary: Record<string, number> = {};

    events.forEach((event: FirewallEvent) => {
      actionSummary[event.action] = (actionSummary[event.action] || 0) + 1;
      countrySummary[event.clientCountryName] = (countrySummary[event.clientCountryName] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      zoneId: targetZoneId,
      data: {
        events: events.map((e: FirewallEvent) => ({
          action: e.action,
          source: e.source,
          clientIP: e.clientIP,
          clientCountry: e.clientCountryName,
          clientASN: e.clientASNDescription,
          host: e.clientRequestHTTPHost,
          method: e.clientRequestHTTPMethodName,
          path: e.clientRequestPath,
          userAgent: e.userAgent,
          ruleId: e.ruleId,
          rayId: e.rayName,
          datetime: e.datetime,
        })),
        summary: {
          total: events.length,
          byAction: actionSummary,
          byCountry: countrySummary,
        },
      },
      source: 'graphql',
    });
  } catch (error) {
    console.error('Cloudflare security API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Cloudflare security events',
      },
      { status: 500 }
    );
  }
}
