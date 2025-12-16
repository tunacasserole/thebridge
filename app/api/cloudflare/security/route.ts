import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get('zoneId');
  const eventType = searchParams.get('eventType') || 'all';
  const limit = parseInt(searchParams.get('limit') || '100', 10);

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

    // Try to find and execute the security events tool
    const securityToolNames = [
      'cloudflare__get_security_events',
      'cloudflare__security_events',
      'cloudflare__firewall_events',
    ];

    let result;
    let foundTool = false;

    for (const toolName of securityToolNames) {
      const tool = tools.find(t => t.name === toolName);
      if (tool) {
        foundTool = true;
        result = await executeMCPTool(toolName, {
          zoneId,
          eventType,
          limit,
        });
        break;
      }
    }

    if (!foundTool) {
      return NextResponse.json({
        events: [],
        message: 'Security events endpoint not available - Cloudflare MCP server does not provide security events tool',
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch security events',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
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
