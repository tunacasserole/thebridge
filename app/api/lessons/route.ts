import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/lessons
 * Returns all published lessons ordered by sortOrder
 */
export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('[Lessons API] Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lessons
 * Create a new lesson (admin only in future)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, content, prompt, sortOrder } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    // Get the maximum sortOrder to place new lesson at the end
    const maxSortOrder = await prisma.lesson.aggregate({
      _max: { sortOrder: true },
    });
    const newSortOrder = sortOrder ?? ((maxSortOrder._max.sortOrder ?? 0) + 1);

    const lesson = await prisma.lesson.create({
      data: {
        name,
        content,
        prompt,
        sortOrder: newSortOrder,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('[Lessons API] Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
