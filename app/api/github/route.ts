// GitHub API Route - Server-side only
import { NextResponse } from 'next/server';
import { fetchGitHubData } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const reposStr = process.env.GITHUB_REPOS;

  // For the main GitHub endpoint, use the first repo as default
  // or allow GITHUB_REPO to override
  const defaultRepo = process.env.GITHUB_REPO;
  const repos = reposStr?.split(',').map(r => r.trim()).filter(Boolean) || [];

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: 'GitHub token not configured',
        hint: 'Set GITHUB_TOKEN in .env.local',
      },
      { status: 503 }
    );
  }

  if (!owner) {
    return NextResponse.json(
      {
        success: false,
        error: 'GitHub owner not configured',
        hint: 'Set GITHUB_OWNER in .env.local (e.g., "your-org")',
      },
      { status: 503 }
    );
  }

  // Determine which repo to use for the main endpoint
  let repoName: string;
  if (defaultRepo) {
    // If GITHUB_REPO is set in format "owner/repo", parse it
    if (defaultRepo.includes('/')) {
      const [, parsedRepo] = defaultRepo.split('/');
      repoName = parsedRepo;
    } else {
      repoName = defaultRepo;
    }
  } else if (repos.length > 0) {
    // Fallback to first repo in the list
    repoName = repos[0];
  } else {
    return NextResponse.json(
      {
        success: false,
        error: 'No repository configured',
        hint: 'Set GITHUB_REPOS in .env.local (e.g., "repo1,repo2")',
      },
      { status: 503 }
    );
  }

  try {
    const data = await fetchGitHubData(token, owner, repoName);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GitHub API] Error:', error);

    // Return appropriate status codes based on error type
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMsg.includes('404') ? 404 :
                       errorMsg.includes('403') ? 403 :
                       errorMsg.includes('401') ? 401 :
                       500;

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        hint: statusCode === 404 ? 'Repository not found - check GITHUB_OWNER and GITHUB_REPOS configuration' :
              statusCode === 403 ? 'Permission denied - check GITHUB_TOKEN permissions' :
              statusCode === 401 ? 'Authentication failed - check GITHUB_TOKEN is valid' :
              'An unexpected error occurred',
      },
      { status: statusCode }
    );
  }
}
