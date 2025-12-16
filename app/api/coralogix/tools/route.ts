import { NextResponse } from 'next/server';
import { loadMCPTools } from '@/lib/mcp/client';

/**
 * Debug endpoint to list all available Coralogix MCP tools
 * GET /api/coralogix/tools
 */
export async function GET() {
  try {
    // Load Coralogix MCP tools
    const { tools, serverNames, failedServers } = await loadMCPTools(['coralogix']);

    if (failedServers.includes('coralogix')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coralogix MCP server is not available',
          connectedServers: serverNames,
          failedServers,
        },
        { status: 503 }
      );
    }

    // Return list of all available tools with their schemas
    return NextResponse.json({
      success: true,
      connectedServers: serverNames,
      failedServers,
      toolCount: tools.length,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.input_schema,
      })),
    });
  } catch (error) {
    console.error('Coralogix tools API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Coralogix tools',
      },
      { status: 500 }
    );
  }
}
