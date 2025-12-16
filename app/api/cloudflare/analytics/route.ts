import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get('zoneId');
  const since = searchParams.get('since') || '-7d';
  const until = searchParams.get('until') || 'now';

  try {
    // Load Cloudflare MCP tools
    const { tools, failedServers } = await loadMCPTools(['cloudflare']);

    if (failedServers.includes('cloudflare')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudflare MCP server is not available',
        },
        { status: 503 }
      );
    }

    // Try to find and execute the analytics tool
    const analyticsToolNames = [
      'cloudflare__get_analytics',
      'cloudflare__analytics',
      'cloudflare__zone_analytics',
    ];

    let result;
    let foundTool = false;

    for (const toolName of analyticsToolNames) {
      const tool = tools.find(t => t.name === toolName);
      if (tool) {
        foundTool = true;
        result = await executeMCPTool(toolName, {
          zoneId,
          since,
          until,
        });
        break;
      }
    }

    if (!foundTool) {
      // If no dedicated analytics tool, return empty response
      return NextResponse.json({
        analytics: {},
        message: 'Analytics endpoint not available - Cloudflare MCP server does not provide analytics tool',
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch analytics',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
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
