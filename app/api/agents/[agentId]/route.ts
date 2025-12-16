import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ agentId: string }>;
}

// GET /api/agents/[agentId]?role=sre - Get a specific agent
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { agentId: slug } = await params;
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  if (!role) {
    return NextResponse.json(
      { error: 'Role parameter is required' },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findUnique({
    where: {
      slug_role: { slug, role },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json(agent);
}

// PUT /api/agents/[agentId] - Update an agent
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { agentId: slug } = await params;

  try {
    const body = await request.json();
    const { role, name, description, systemPrompt, icon, sortOrder } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'Role parameter is required in body' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.update({
      where: {
        slug_role: { slug, role },
      },
      data: {
        name,
        description,
        systemPrompt,
        icon,
        sortOrder,
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Record to update not found')
    ) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    throw error;
  }
}

// PATCH /api/agents/[agentId] - Toggle agent visibility (hide/show)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { agentId: slug } = await params;

  try {
    const body = await request.json();
    const { role, isHidden } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'Role parameter is required in body' },
        { status: 400 }
      );
    }

    if (typeof isHidden !== 'boolean') {
      return NextResponse.json(
        { error: 'isHidden must be a boolean' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.update({
      where: {
        slug_role: { slug, role },
      },
      data: {
        isHidden,
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Record to update not found')
    ) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    throw error;
  }
}

// DELETE /api/agents/[agentId]?role=sre - Delete an agent
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { agentId: slug } = await params;
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  if (!role) {
    return NextResponse.json(
      { error: 'Role parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Check if it's a default agent
    const agent = await prisma.agent.findUnique({
      where: { slug_role: { slug, role } },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agent.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default agents' },
        { status: 403 }
      );
    }

    await prisma.agent.delete({
      where: { slug_role: { slug, role } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Record to delete does not exist')
    ) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    throw error;
  }
}
