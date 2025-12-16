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
    const { name, content, sortOrder } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        name,
        content,
        sortOrder: sortOrder ?? 0,
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
