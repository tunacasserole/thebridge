import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'applications';
  const application = searchParams.get('application');

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

    // List available tools for debugging
    console.log('[Coralogix Metadata] Available tools:', tools.map(t => t.name));

    // Try to find appropriate metadata tool
    const metadataToolNames = [
      'coralogix__get_applications',
      'coralogix__list_applications',
      'coralogix__get_subsystems',
      'coralogix__list_subsystems',
      'coralogix__list_metadata',
      'coralogix__get_metadata',
    ];

    let result: { success: boolean; data?: unknown; error?: string } | undefined;

    if (type === 'applications') {
      // Try application tools
      for (const toolName of ['coralogix__get_applications', 'coralogix__list_applications']) {
        const tool = tools.find(t => t.name === toolName);
        if (tool) {
          result = await executeMCPTool(toolName, {});
          break;
        }
      }
    } else if (type === 'subsystems') {
      // Try subsystem tools
      const params: Record<string, unknown> = {};
      if (application) {
        params.application = application;
      }

      for (const toolName of ['coralogix__get_subsystems', 'coralogix__list_subsystems']) {
        const tool = tools.find(t => t.name === toolName);
        if (tool) {
          result = await executeMCPTool(toolName, params);
          break;
        }
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown metadata type: ${type}`,
        },
        { status: 400 }
      );
    }

    // If no specific tool found, return empty array
    if (!result) {
      return NextResponse.json({
        success: true,
        data: [],
        message: `Metadata endpoint for ${type} not available - Coralogix MCP server does not provide this tool`,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch metadata',
        },
        { status: 500 }
      );
    }

    // Return the data
    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Coralogix metadata API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Coralogix metadata',
      },
      { status: 500 }
    );
  }
}
