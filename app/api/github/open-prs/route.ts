// GitHub Open PRs API Route - Server-side only
import { NextResponse } from 'next/server';
import { fetchOpenPRsMultiRepo } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const reposStr = process.env.GITHUB_REPOS;

  if (!token || !owner || !reposStr) {
    return NextResponse.json(
      {
        success: false,
        error: 'GitHub configuration incomplete',
        hint: 'Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPOS in .env.local',
      },
      { status: 503 }
    );
  }

  // Parse repos from comma-separated string
  const repos = reposStr.split(',').map(r => r.trim()).filter(Boolean);

  if (repos.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'No repositories configured',
        hint: 'Set GITHUB_REPOS in .env.local (e.g., "repo1,repo2,repo3")',
      },
      { status: 503 }
    );
  }

  try {
    const data = await fetchOpenPRsMultiRepo(token, owner, repos);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GitHub Open PRs API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
