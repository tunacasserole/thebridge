// GitHub Issues API Route - Create issues for TheBridge project
// SAFETY: This route ONLY creates issues in tunacasserole/thebridge
// It does NOT use GITHUB_OWNER/GITHUB_REPOS env vars to prevent accidental
// issues being created in other repositories
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// HARDCODED for safety - issues should only go to TheBridge repo
const ISSUES_OWNER = 'tunacasserole';
const ISSUES_REPO = 'thebridge';

interface CreateIssueBody {
  title: string;
  body?: string;
  labels?: string[];
}

export async function POST(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'GitHub token not configured' },
      { status: 503 }
    );
  }

  let body: CreateIssueBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  if (!body.title?.trim()) {
    return NextResponse.json(
      { success: false, error: 'Issue title is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${ISSUES_OWNER}/${ISSUES_REPO}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: body.title.trim(),
          body: body.body?.trim() || '',
          labels: body.labels || [],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GitHub Issues API] Error:', errorText);
      return NextResponse.json(
        { success: false, error: `GitHub API error: ${response.status}` },
        { status: response.status }
      );
    }

    const issue = await response.json();
    return NextResponse.json({
      success: true,
      data: {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        state: issue.state,
      },
    });
  } catch (error) {
    console.error('[GitHub Issues API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}
