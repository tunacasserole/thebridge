import { NextRequest, NextResponse } from 'next/server';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// GET: Fetch available transitions for an issue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueKey: string }> }
) {
  try {
    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Jira credentials not configured' },
        { status: 500 }
      );
    }

    const { issueKey } = await params;
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

    const response = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jira API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Failed to fetch transitions: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.transitions || [],
    });
  } catch (error) {
    console.error('Error fetching transitions:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch transitions' },
      { status: 500 }
    );
  }
}

// PATCH: Update issue status via transition or update fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ issueKey: string }> }
) {
  try {
    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Jira credentials not configured' },
        { status: 500 }
      );
    }

    const { issueKey } = await params;
    const body = await request.json();
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

    // Check if this is a transition request
    if (body.transitionId) {
      const payload = {
        transition: {
          id: body.transitionId,
        },
      };

      const response = await fetch(
        `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jira API error:', response.status, errorText);
        return NextResponse.json(
          { success: false, error: `Failed to update status: ${response.status}` },
          { status: response.status }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Otherwise, update fields (summary, description, etc.)
    const payload: { fields: Record<string, unknown> } = { fields: {} };

    if (body.summary) {
      payload.fields.summary = body.summary;
    }

    if (body.description) {
      payload.fields.description = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: body.description,
              },
            ],
          },
        ],
      };
    }

    const response = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jira API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Failed to update issue: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update issue' },
      { status: 500 }
    );
  }
}
