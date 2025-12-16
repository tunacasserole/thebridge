import { NextResponse } from 'next/server';
import { loadMCPTools, executeMCPTool } from '@/lib/mcp/client';
import type { CoralogixUsageResponse } from '@/lib/coralogix/types';

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

    // Execute the usage/quota tool
    // The exact tool name depends on what Coralogix MCP provides
    // Common names might be: get_usage, get_quota, list_usage_stats
    const result = await executeMCPTool('coralogix__get_usage', {});

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch usage data',
        },
        { status: 500 }
      );
    }

    // Transform the result to match the expected CoralogixUsageResponse format
    const resultData = result.data as { usage?: CoralogixUsageResponse['usage']; quota?: CoralogixUsageResponse['quota'] } | null;
    const response: CoralogixUsageResponse = {
      usage: resultData?.usage || {
        totalGB: 0,
        byPriority: {
          high: 0,
          medium: 0,
          low: 0,
        },
        byApplication: {},
      },
      quota: resultData?.quota,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Coralogix usage API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch Coralogix usage',
      },
      { status: 500 }
    );
  }
}
