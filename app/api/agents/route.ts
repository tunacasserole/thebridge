import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/agents - List agents for a role
// Query params:
//   - role (required): Filter by role
//   - includeHidden (optional): If 'true', include hidden agents (default: false)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const includeHidden = searchParams.get('includeHidden') === 'true';

  if (!role) {
    return NextResponse.json(
      { error: 'Role parameter is required' },
      { status: 400 }
    );
  }

  const agents = await prisma.agent.findMany({
    where: {
      role,
      // Filter out hidden agents unless explicitly requested
      ...(includeHidden ? {} : { isHidden: false }),
    },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(agents);
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, role, name, description, systemPrompt, icon, sortOrder } = body;

    if (!slug || !role || !name || !systemPrompt) {
      return NextResponse.json(
        { error: 'slug, role, name, and systemPrompt are required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        slug,
        role,
        name,
        description,
        systemPrompt,
        icon,
        isDefault: false,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    // Check for unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'An agent with this slug already exists for this role' },
        { status: 409 }
      );
    }
    throw error;
  }
}
