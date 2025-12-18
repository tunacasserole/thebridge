// GitHub Issues API Route - Create and fetch issues for TheBridge project
// SAFETY: This route ONLY works with issues in tunacasserole/thebridge
// It does NOT use GITHUB_OWNER/GITHUB_REPOS env vars to prevent accidental
// issues being created in other repositories
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

// HARDCODED for safety - issues should only go to TheBridge repo
const ISSUES_OWNER = 'tunacasserole';
const ISSUES_REPO = 'thebridge';

// Helper function to generate a concise title from the issue description
async function generateTitle(description: string): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Generate a concise, descriptive title (max 10 words) for this GitHub issue. Return ONLY the title text, nothing else:\n\n${description}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    // Fallback: use first line or first 50 chars
    return description.split('\n')[0].substring(0, 50).trim();
  } catch (error) {
    console.error('[GitHub Issues API] Error generating title:', error);
    // Fallback: use first line or first 50 chars
    return description.split('\n')[0].substring(0, 50).trim();
  }
}

interface CreateIssueBody {
  title?: string;
  body: string;
  labels?: string[];
}

export async function GET(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'GitHub token not configured' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || 'open';
  const per_page = searchParams.get('per_page') || '30';

  try {
    const response = await fetch(
      `https://api.github.com/repos/${ISSUES_OWNER}/${ISSUES_REPO}/issues?state=${state}&per_page=${per_page}&sort=updated&direction=desc`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 60 },
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

    const issues = await response.json();
    const filteredIssues = issues.filter((issue: { pull_request?: unknown }) => !issue.pull_request);

    return NextResponse.json({
      success: true,
      data: filteredIssues.map((issue: {
        id: number;
        number: number;
        title: string;
        html_url: string;
        state: string;
        created_at: string;
        updated_at: string;
        labels: Array<{ name: string; color: string }>;
        user: { login: string };
      }) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        state: issue.state,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        labels: issue.labels.map(l => ({ name: l.name, color: l.color })),
        author: issue.user.login,
      })),
    });
  } catch (error) {
    console.error('[GitHub Issues API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
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

  if (!body.body?.trim()) {
    return NextResponse.json(
      { success: false, error: 'Issue description is required' },
      { status: 400 }
    );
  }

  try {
    // Generate title if not provided
    const title = body.title?.trim() || await generateTitle(body.body);

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
          title: title,
          body: body.body.trim(),
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

export async function PATCH(request: NextRequest) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'GitHub token not configured' },
      { status: 503 }
    );
  }

  let body: { issueNumber: number; state: 'open' | 'closed' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  if (!body.issueNumber || !body.state) {
    return NextResponse.json(
      { success: false, error: 'Issue number and state are required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${ISSUES_OWNER}/${ISSUES_REPO}/issues/${body.issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: body.state,
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
      { success: false, error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}
