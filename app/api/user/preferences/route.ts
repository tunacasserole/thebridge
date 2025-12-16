/**
 * User Preferences API
 *
 * GET /api/user/preferences - Get all user preferences
 * GET /api/user/preferences?key=xxx - Get a specific preference
 * POST /api/user/preferences - Set a user preference
 * DELETE /api/user/preferences?key=xxx - Delete a user preference
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Get specific preference
      const preference = await prisma.userPreference.findUnique({
        where: {
          userId_key: {
            userId: session.user.id,
            key,
          },
        },
      });

      if (!preference) {
        return NextResponse.json({ value: null });
      }

      return NextResponse.json({
        key: preference.key,
        value: JSON.parse(preference.value),
      });
    }

    // Get all preferences
    const preferences = await prisma.userPreference.findMany({
      where: { userId: session.user.id },
    });

    const parsed = preferences.reduce((acc, pref) => {
      acc[pref.key] = JSON.parse(pref.value);
      return acc;
    }, {} as Record<string, unknown>);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('[Preferences API] Failed to fetch preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
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
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Missing required field: key' },
        { status: 400 }
      );
    }

    const preference = await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId: session.user.id,
          key,
        },
      },
      update: {
        value: JSON.stringify(value),
      },
      create: {
        userId: session.user.id,
        key,
        value: JSON.stringify(value),
      },
    });

    return NextResponse.json({
      key: preference.key,
      value: JSON.parse(preference.value),
    });
  } catch (error) {
    console.error('[Preferences API] Failed to save preference:', error);
    return NextResponse.json(
      { error: 'Failed to save preference' },
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
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    await prisma.userPreference.delete({
      where: {
        userId_key: {
          userId: session.user.id,
          key,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Preferences API] Failed to delete preference:', error);
    return NextResponse.json(
      { error: 'Failed to delete preference' },
      { status: 500 }
    );
  }
}
