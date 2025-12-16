/**
 * MCP Server Definitions API
 *
 * GET /api/mcp/servers - List all available MCP server definitions
 * POST /api/mcp/servers - Create a new MCP server definition (admin only)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const servers = await prisma.mCPServerDefinition.findMany({
      where: { isEnabled: true },
      orderBy: [
        { category: 'asc' },
        { isOfficial: 'desc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        category: true,
        transportType: true,
        configTemplate: true,
        docsUrl: true,
        isOfficial: true,
      },
    });

    // Parse configTemplate JSON for each server
    const parsedServers = servers.map((server) => ({
      ...server,
      configTemplate: JSON.parse(server.configTemplate),
    }));

    return NextResponse.json(parsedServers);
  } catch (error) {
    console.error('[MCP API] Failed to fetch servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP servers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { slug, name, description, icon, category, transportType, configTemplate, docsUrl, isOfficial } = body;

    if (!slug || !name || !configTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, configTemplate' },
        { status: 400 }
      );
    }

    const server = await prisma.mCPServerDefinition.create({
      data: {
        slug,
        name,
        description,
        icon,
        category: category || 'observability',
        transportType: transportType || 'sse',
        configTemplate: JSON.stringify(configTemplate),
        docsUrl,
        isOfficial: isOfficial || false,
      },
    });

    return NextResponse.json({
      ...server,
      configTemplate: JSON.parse(server.configTemplate),
    });
  } catch (error) {
    console.error('[MCP API] Failed to create server:', error);
    return NextResponse.json(
      { error: 'Failed to create MCP server definition' },
      { status: 500 }
    );
  }
}
