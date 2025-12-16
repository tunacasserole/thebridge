/**
 * Tool Analytics API
 *
 * Provides insights into tool usage for optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  getUsageAnalytics,
  getUserToolStats,
  exportAnalytics,
} from '@/lib/tools/analytics';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const agentId = searchParams.get('agentId') || undefined;

    // Get analytics data
    const analytics = await getUsageAnalytics(user.id, agentId);
    const detailedStats = await getUserToolStats(user.id);

    // Export format
    if (format === 'export') {
      const exportData = await exportAnalytics(user.id, agentId);
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="tool-analytics-${Date.now()}.json"`,
        },
      });
    }

    // JSON format (default)
    return NextResponse.json({
      summary: analytics,
      detailed: detailedStats,
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
