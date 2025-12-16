# TheBridge - Claude Code Instructions

## ⚠️ CRITICAL: Always Create PRs

**Every change MUST go through a Pull Request.** Do not commit directly to `main`.

- **One PR per issue** - Each GitHub issue gets its own branch and PR
- **One PR per task** - Even without an issue, create a PR for any meaningful change
- **Merge immediately** - Once the PR is created and passes checks, merge it right away
- **Don't batch changes** - Small, focused PRs are better than large ones

This applies to ALL Claude instances working on this repo. No exceptions.

---

## GitHub Issue Workflow

When handling a GitHub issue, follow this workflow:

### 1. Create a Feature Branch

Create a new branch from `main` with the naming convention:
```
{issue_number}-{issue-title-kebab-case}
```

Examples:
- Issue #1 "Add authentication" → `001-add-authentication`
- Issue #5 "Better chat output formatting" → `005-better-chat-output-formatting`
- Issue #12 "Fix API rate limiting" → `012-fix-api-rate-limiting`

```bash
git checkout main
git pull origin main
git checkout -b {branch-name}
```

### 2. Implement the Changes

- Make the necessary code changes to resolve the issue
- Commit frequently with descriptive messages
- Reference the issue number in commits: `fix: resolve #5 - improve chat formatting`

### 3. Create a Pull Request

After completing the implementation:

```bash
git push -u origin {branch-name}
gh pr create --title "{Issue Title}" --body "Closes #{issue_number}

## Summary
{Brief description of changes}

## Changes Made
- {Change 1}
- {Change 2}
"
```

### 4. Merge the Pull Request

Once the PR is created and ready:

```bash
gh pr merge --squash --delete-branch
```

### 5. Close the Issue

The issue should auto-close from the PR, but verify:

```bash
gh issue close {issue_number} --reason completed
```

## Complete Example

```bash
# For issue #5 "Better chat output formatting"
git checkout main && git pull origin main
git checkout -b 005-better-chat-output-formatting

# ... make changes ...

git add .
git commit -m "feat: improve chat output formatting

- Add syntax highlighting for code blocks
- Improve paragraph spacing
- Add copy button for code

Closes #5"

git push -u origin 005-better-chat-output-formatting

gh pr create --title "Better chat output formatting" --body "Closes #5

## Summary
Improved chat message formatting with better typography and code highlighting.

## Changes Made
- Added react-syntax-highlighter for code blocks
- Improved paragraph and list spacing
- Added copy-to-clipboard for code blocks
"

gh pr merge --squash --delete-branch
```

## Branch Naming Rules

1. Pad issue numbers to 3 digits (001, 012, 123)
2. Use kebab-case for the title portion
3. Keep branch names concise but descriptive
4. Maximum 50 characters for the title portion

---

## Automated Issue Implementation (GitHub Actions)

TheBridge uses Claude Code GitHub Actions to automatically implement issues.

### How It Works

1. **Issue Triage** (`claude-triage.yml`): When a new issue is opened, Claude automatically:
   - Analyzes the issue content
   - Adds appropriate labels (bug, enhancement, frontend, backend, etc.)
   - Identifies if it's a good candidate for auto-implementation
   - Optionally adds the `claude-implement` label for straightforward tasks

2. **Auto-Implementation** (`claude-implement.yml`): When an issue has the `claude-implement` label:
   - Claude reads the issue and CLAUDE.md guidelines
   - Creates a feature branch following naming conventions
   - Implements the requested changes
   - Creates a pull request that closes the issue

### Triggering Implementation

**Automatic (via label):**
- Add the `claude-implement` label to any issue
- Claude will begin implementation automatically

**Manual (via mention):**
- Comment `@claude implement this` on any issue
- Claude will respond and begin implementation

### Required Setup

1. **Install the Claude Code GitHub App**:
   - Visit: https://github.com/apps/claude
   - Click "Install" and select this repository
   - Or run `/install-github-app` in Claude Code terminal

2. **Add the Anthropic API Key** to repository secrets:
   ```
   Settings → Secrets and variables → Actions → New repository secret
   Name: ANTHROPIC_API_KEY
   Value: <your-api-key>
   ```

3. **Create the `claude-implement` label** (optional, for safety):
   ```bash
   gh label create claude-implement --color "5319E7" --description "Claude will auto-implement this issue"
   ```

### Safety Controls

- Issues require the `claude-implement` label for automatic implementation
- The triage workflow is conservative about adding this label
- Complex or ambiguous issues are flagged for human review
- Failed implementations post a comment with the workflow run link

### Best Practices for Issues

For best auto-implementation results, write issues that include:
- Clear, specific title describing the task
- Detailed description of what needs to be done
- Acceptance criteria or expected behavior
- Any relevant file paths or code references
- Edge cases or constraints to consider
