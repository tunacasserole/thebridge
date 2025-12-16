import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';
import type { CoralogixSLOResponse, CoralogixSLO } from '@/lib/coralogix/types';

export async function GET() {
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

    // Execute the SLO tool
    // The exact tool name depends on what Coralogix MCP provides
    // Common names might be: list_slos, get_slos, list_slo_status
    const result = await executeMCPTool('coralogix__list_slos', {});

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch SLOs',
        },
        { status: 500 }
      );
    }

    // Transform the result to match the expected CoralogixSLOResponse format
    // MCP data is untyped, so we cast it to the expected format
    const resultData = result.data as { slos?: CoralogixSLO[] } | CoralogixSLO[];
    const response: CoralogixSLOResponse = {
      slos: Array.isArray(resultData) ? resultData : resultData?.slos || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Coralogix SLO API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Coralogix SLOs',
      },
      { status: 500 }
    );
  }
}
