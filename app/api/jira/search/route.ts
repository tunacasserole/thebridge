// Jira Search API Route - Server-side only
import { NextRequest, NextResponse } from 'next/server';
import { searchJiraIssues } from '@/lib/jira';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    return NextResponse.json(
      { success: false, error: 'Jira credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { assignee, status, project, issue_type, jql, max_results } = body;

    const result = await searchJiraIssues(baseUrl, email, apiToken, {
      assignee,
      status,
      project,
      issueType: issue_type,
      jql,
      maxResults: max_results,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Jira search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
