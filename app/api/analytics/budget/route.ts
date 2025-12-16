/**
 * Budget Settings API
 *
 * Manage user budget limits and alert thresholds.
 */

import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { updateBudget, getBudgetStatus } from '@/lib/analytics/alerts';

/**
 * GET /api/analytics/budget
 * Get current budget settings and status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const budget = await getBudgetStatus(user.id);

    if (!budget) {
      return Response.json(
        {
          error: 'Budget not configured',
          message: 'No budget settings found. Use POST to create one.',
        },
        { status: 404 }
      );
    }

    return Response.json(budget);
  } catch (error) {
    console.error('[Budget] GET error:', error);
    return Response.json(
      {
        error: 'Failed to fetch budget',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/budget
 * Update budget settings
 *
 * Body:
 * {
 *   monthlyLimitCents: number,
 *   alertThreshold1?: number,
 *   alertThreshold2?: number,
 *   alertThreshold3?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { monthlyLimitCents, alertThreshold1, alertThreshold2, alertThreshold3 } = body;

    // Validate inputs
    if (monthlyLimitCents !== undefined) {
      if (typeof monthlyLimitCents !== 'number' || monthlyLimitCents < 0) {
        return Response.json(
          { error: 'monthlyLimitCents must be a positive number' },
          { status: 400 }
        );
      }
    }

    const thresholds = [alertThreshold1, alertThreshold2, alertThreshold3].filter(
      (t) => t !== undefined
    );

    for (const threshold of thresholds) {
      if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
        return Response.json(
          { error: 'Alert thresholds must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    const updatedBudget = await updateBudget(user.id, {
      monthlyLimitCents,
      alertThreshold1,
      alertThreshold2,
      alertThreshold3,
    });

    return Response.json({
      success: true,
      budget: updatedBudget,
    });
  } catch (error) {
    console.error('[Budget] POST error:', error);
    return Response.json(
      {
        error: 'Failed to update budget',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
