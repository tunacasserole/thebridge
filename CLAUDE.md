# TheBridge - Claude Code Instructions

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
