/**
 * Conversations API - List and Create
 *
 * GET: List user's conversations
 * POST: Create a new conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

interface ConversationWithMessages {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: { content: string }[];
  _count: { messages: number };
}

// GET /api/conversations - List user's conversations
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { content: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    // Transform to include preview and message count
    const transformed = conversations.map((conv: ConversationWithMessages) => ({
      id: conv.id,
      title: conv.title || conv.messages[0]?.content?.slice(0, 50) || 'New conversation',
      preview: conv.messages[0]?.content?.slice(0, 100) || '',
      messageCount: conv._count.messages,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('[Conversations] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await request.json().catch(() => ({}));

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: title || null,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('[Conversations] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
