import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';
import type { CoralogixAPMResponse, CoralogixAPMService } from '@/lib/coralogix/types';

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

    // Execute the APM services tool
    // The exact tool name depends on what Coralogix MCP provides
    // Common names might be: list_apm_services, get_apm_services, get_services
    const result = await executeMCPTool('coralogix__list_apm_services', {});

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch APM services',
        },
        { status: 500 }
      );
    }

    // Transform the result to match the expected CoralogixAPMResponse format
    // MCP data is untyped, so we cast it to the expected format
    const resultData = result.data as { services?: CoralogixAPMService[] } | CoralogixAPMService[];
    const response: CoralogixAPMResponse = {
      services: Array.isArray(resultData) ? resultData : resultData?.services || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Coralogix APM API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Coralogix APM services',
      },
      { status: 500 }
    );
  }
}
