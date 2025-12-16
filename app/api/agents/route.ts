import { NextRequest, NextResponse } from 'next/server';

// Default agents - used when database is unavailable (e.g., on Vercel serverless)
const DEFAULT_AGENTS: Record<string, Array<{
  id: string;
  slug: string;
  role: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  isDefault: boolean;
  isHidden: boolean;
  sortOrder: number;
}>> = {
  sre: [
    {
      id: 'default-sre-commander',
      slug: 'incident-commander',
      role: 'sre',
      name: 'Incident Commander',
      description: 'Lead incident response and coordinate teams',
      systemPrompt: 'You are an experienced Incident Commander helping to manage and resolve incidents.',
      icon: 'shield',
      isDefault: true,
      isHidden: false,
      sortOrder: 0,
    },
    {
      id: 'default-sre-analyst',
      slug: 'log-analyzer',
      role: 'sre',
      name: 'Log Analyzer',
      description: 'Analyze logs and identify patterns',
      systemPrompt: 'You are an expert at analyzing logs, metrics, and traces to identify issues.',
      icon: 'search',
      isDefault: true,
      isHidden: false,
      sortOrder: 1,
    },
    {
      id: 'default-sre-oncall',
      slug: 'oncall-assistant',
      role: 'sre',
      name: 'On-Call Assistant',
      description: 'Help with on-call duties and runbooks',
      systemPrompt: 'You are an on-call assistant helping engineers respond to alerts and follow runbooks.',
      icon: 'phone',
      isDefault: true,
      isHidden: false,
      sortOrder: 2,
    },
  ],
};

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

  // Try database first, fallback to defaults if unavailable
  try {
    const { prisma } = await import('@/lib/db');
    const agents = await prisma.agent.findMany({
      where: {
        role,
        // Filter out hidden agents unless explicitly requested
        ...(includeHidden ? {} : { isHidden: false }),
      },
      orderBy: { sortOrder: 'asc' },
    });

    // If database has agents, return them
    if (agents.length > 0) {
      return NextResponse.json(agents);
    }

    // Fall through to defaults if database is empty
  } catch (error) {
    console.warn('[Agents API] Database unavailable, using defaults:', error);
  }

  // Return default agents for the role
  const defaultAgents = DEFAULT_AGENTS[role] || [];
  const filteredAgents = includeHidden
    ? defaultAgents
    : defaultAgents.filter((a) => !a.isHidden);

  return NextResponse.json(filteredAgents);
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

    try {
      const { prisma } = await import('@/lib/db');
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
    } catch (dbError) {
      // Check for unique constraint violation
      if (
        dbError instanceof Error &&
        dbError.message.includes('Unique constraint')
      ) {
        return NextResponse.json(
          { error: 'An agent with this slug already exists for this role' },
          { status: 409 }
        );
      }
      // Database unavailable - return error
      console.error('[Agents API] Database error on create:', dbError);
      return NextResponse.json(
        { error: 'Database is not available. Custom agents require a database.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('[Agents API] Error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
