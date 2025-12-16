// Jira API Route - Server-side only
import { NextResponse } from 'next/server';
import { fetchJiraDashboardData, createJiraStory } from '@/lib/jira';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;
  const epicLinkField = process.env.JIRA_EPIC_LINK_FIELD || 'customfield_10014';

  if (!baseUrl || !email || !apiToken) {
    return NextResponse.json(
      { success: false, error: 'Jira credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const data = await fetchJiraDashboardData(baseUrl, email, apiToken, projectKey, epicLinkField);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Jira API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!baseUrl || !email || !apiToken || !projectKey) {
    return NextResponse.json(
      { success: false, error: 'Jira credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { summary, description } = body;

    if (!summary || !summary.trim()) {
      return NextResponse.json(
        { success: false, error: 'Summary is required' },
        { status: 400 }
      );
    }

    const issue = await createJiraStory(
      baseUrl,
      email,
      apiToken,
      projectKey,
      summary,
      description
    );

    return NextResponse.json({
      success: true,
      data: {
        key: issue.key,
        url: `${baseUrl}/browse/${issue.key}`
      }
    });
  } catch (error) {
    console.error('Jira create story error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
