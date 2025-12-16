/**
 * User MCP Configuration API
 *
 * GET /api/mcp/user-configs - Get current user's MCP configurations
 * POST /api/mcp/user-configs - Create/update a user's MCP configuration
 * DELETE /api/mcp/user-configs?serverId=xxx - Remove a user's MCP configuration
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const configs = await prisma.userMCPConfig.findMany({
      where: { userId: session.user.id },
      include: {
        server: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            icon: true,
            transportType: true,
            configTemplate: true,
            docsUrl: true,
            isOfficial: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Parse JSON fields
    const parsedConfigs = configs.map((config) => ({
      ...config,
      config: JSON.parse(config.config),
      server: {
        ...config.server,
        configTemplate: JSON.parse(config.server.configTemplate),
      },
    }));

    return NextResponse.json(parsedConfigs);
  } catch (error) {
    console.error('[MCP API] Failed to fetch user configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP configurations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serverId, config, isEnabled, priority } = body;

    if (!serverId || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: serverId, config' },
        { status: 400 }
      );
    }

    // Verify server exists
    const server = await prisma.mCPServerDefinition.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      );
    }

    // Upsert the configuration
    const userConfig = await prisma.userMCPConfig.upsert({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId,
        },
      },
      update: {
        config: JSON.stringify(config),
        isEnabled: isEnabled ?? true,
        priority: priority ?? 0,
      },
      create: {
        userId: session.user.id,
        serverId,
        config: JSON.stringify(config),
        isEnabled: isEnabled ?? true,
        priority: priority ?? 0,
      },
      include: {
        server: true,
      },
    });

    return NextResponse.json({
      ...userConfig,
      config: JSON.parse(userConfig.config),
      server: {
        ...userConfig.server,
        configTemplate: JSON.parse(userConfig.server.configTemplate),
      },
    });
  } catch (error) {
    console.error('[MCP API] Failed to save user config:', error);
    return NextResponse.json(
      { error: 'Failed to save MCP configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { error: 'Missing serverId parameter' },
        { status: 400 }
      );
    }

    await prisma.userMCPConfig.delete({
      where: {
        userId_serverId: {
          userId: session.user.id,
          serverId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MCP API] Failed to delete user config:', error);
    return NextResponse.json(
      { error: 'Failed to delete MCP configuration' },
      { status: 500 }
    );
  }
}
