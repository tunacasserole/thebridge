import { NextRequest, NextResponse } from 'next/server';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// POST: Add a comment to an issue
export async function POST(
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

    if (!body.comment) {
      return NextResponse.json(
        { success: false, error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

    const payload = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: body.comment,
              },
            ],
          },
        ],
      },
    };

    const response = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/comment`,
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
        { success: false, error: `Failed to add comment: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to add comment' },
      { status: 500 }
    );
  }
}
