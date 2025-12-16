import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';
import type { CoralogixAlertsResponse, CoralogixAlert } from '@/lib/coralogix/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status')?.split(',') || ['firing', 'pending'];
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Load Coralogix MCP tools
    const { tools, failedServers } = await loadMCPTools(['coralogix']);

    if (failedServers.includes('coralogix')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coralogix MCP server is not available',
        },
        { status: 503 }
      );
    }

    // Try to find and execute the alerts tool
    // Look for tools that might provide alerts
    const alertsToolNames = [
      'coralogix__list_alerts',
      'coralogix__get_alerts',
      'coralogix__query_alerts',
    ];

    let result: { success: boolean; data?: unknown; error?: string } | undefined;

    for (const toolName of alertsToolNames) {
      const tool = tools.find(t => t.name === toolName);
      if (tool) {
        result = await executeMCPTool(toolName, {
          filter: {
            status,
          },
          pagination: {
            limit,
            offset,
          },
        });
        break;
      }
    }

    if (!result) {
      // If no dedicated alerts tool, return empty response
      return NextResponse.json({
        alerts: [],
        message: 'Alerts endpoint not available - Coralogix MCP server does not provide alerts tool',
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch alerts',
        },
        { status: 500 }
      );
    }

    // Transform the result to match the expected CoralogixAlertsResponse format
    // MCP data is untyped, so we cast it to the expected format
    const resultData = result.data as { alerts?: CoralogixAlert[] } | CoralogixAlert[];
    const response: CoralogixAlertsResponse = {
      alerts: Array.isArray(resultData) ? resultData : resultData?.alerts || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Coralogix alerts API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Coralogix alerts',
      },
      { status: 500 }
    );
  }
}
