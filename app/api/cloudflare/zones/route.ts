import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';

export async function GET() {
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

    // Try to find and execute the zones list tool
    const zonesToolNames = [
      'cloudflare__list_zones',
      'cloudflare__get_zones',
      'cloudflare__zones',
    ];

    let result;
    let foundTool = false;

    for (const toolName of zonesToolNames) {
      const tool = tools.find(t => t.name === toolName);
      if (tool) {
        foundTool = true;
        result = await executeMCPTool(toolName, {});
        break;
      }
    }

    if (!foundTool) {
      return NextResponse.json({
        zones: [],
        message: 'Zones endpoint not available - Cloudflare MCP server does not provide zones tool',
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch zones',
        },
        { status: 500 }
      );
    }

    // Transform the result to a consistent format
    const zones = Array.isArray(result.data) ? result.data : result.data?.zones || [];

    return NextResponse.json({
      success: true,
      zones,
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
