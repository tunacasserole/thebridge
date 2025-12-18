# /issues - Automated GitHub Issue Resolution

Process open GitHub issues with parallel sub-agent orchestration: triage, plan, implement, review, and merge.

## Execution Flow

You are an orchestrator agent. Execute the following workflow for TheBridge repository issues.

### Phase 1: Discovery

Fetch all open issues from GitHub:

```bash
gh issue list --state open --json number,title,body,labels,assignees --limit 50
```

Display a summary table of open issues with: number, title, labels, and complexity estimate (low/medium/high based on description length and scope).

### Phase 2: Issue Selection

If `$ARGUMENTS` contains a specific issue number, process only that issue.
Otherwise, ask the user which issues to process (can specify multiple, e.g., "1,5,12" or "all").

### Phase 3: Parallel Issue Processing

For EACH selected issue, spawn a dedicated sub-agent using the Task tool. Run up to 3 issues in parallel to balance speed with resource usage.

Each sub-agent receives this prompt template:

---

**Sub-Agent Task: Implement Issue #{number}**

You are implementing GitHub issue #{number}: "{title}"

**Issue Body:**
{body}

**Labels:** {labels}

**CRITICAL WORKFLOW - Follow TheBridge CLAUDE.md exactly:**

#### Step 1: Triage & Analysis
- Analyze the issue requirements thoroughly
- Identify affected files by searching the codebase
- Determine the implementation approach
- Estimate complexity and identify risks

#### Step 2: Update Issue with Plan
Update the issue body with a detailed implementation plan:

```bash
gh issue edit {number} --body "$(cat <<'EOF'
{original_body}

---

## Implementation Plan (Auto-Generated)

**Complexity:** {low|medium|high}
**Affected Files:**
- {file1}
- {file2}

**Approach:**
{detailed_approach}

**Tasks:**
- [ ] {task1}
- [ ] {task2}
- [ ] {task3}

**Risks/Considerations:**
- {risk1}
EOF
)"
```

#### Step 3: Create Feature Branch
Follow the exact naming convention from CLAUDE.md:

```bash
git checkout main && git pull origin main
git checkout -b {number_padded_to_3_digits}-{title-in-kebab-case}
```

Example: Issue #5 "Add dark mode" → branch `005-add-dark-mode`

#### Step 4: Implement the Solution
- Write clean, well-documented code
- Follow existing project patterns and conventions
- Include appropriate error handling
- Add/update tests if applicable
- Run typecheck: `npm run typecheck` (or equivalent)
- Run lint: `npm run lint` (if available)

#### Step 5: Commit Changes
Use conventional commit format referencing the issue:

```bash
git add .
git commit -m "{type}: {description}

{detailed_changes}

Closes #{number}"
```

#### Step 6: Push and Create PR

```bash
git push -u origin {branch-name}

gh pr create --title "{Issue Title}" --body "$(cat <<'EOF'
Closes #{number}

## Summary
{brief_summary_of_changes}

## Changes Made
- {change1}
- {change2}

## Testing
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Manual testing completed

## Screenshots (if UI changes)
{screenshots_if_applicable}
EOF
)"
```

#### Step 7: Code Review (Self-Review)
Before merging, perform a thorough self-review:

1. **Read the diff:** `gh pr diff`
2. **Check for:**
   - Security vulnerabilities (injection, XSS, exposed secrets)
   - Performance issues (N+1 queries, unnecessary re-renders)
   - Missing error handling
   - Code style consistency
   - Incomplete implementations
   - Hardcoded values that should be configurable

3. **If issues found:** Fix them, commit, and push before proceeding

#### Step 8: Merge PR

```bash
gh pr merge --squash --delete-branch
```

#### Step 9: Report Results
Return a structured summary:
```
ISSUE #{number} - {title}
STATUS: {SUCCESS|FAILED}
PR: {pr_url}
BRANCH: {branch_name}
COMMITS: {commit_count}
FILES CHANGED: {file_count}
REVIEW NOTES: {any_issues_found_and_fixed}
```

---

### Phase 4: Aggregation & Reporting

After all sub-agents complete, compile a final report:

```
## Issue Resolution Summary

### Completed
| Issue | Title | PR | Status |
|-------|-------|-----|--------|
| #X | Title | PR#Y | Merged |

### Failed (if any)
| Issue | Title | Error |
|-------|-------|-------|
| #X | Title | Reason |

### Statistics
- Issues Processed: X
- Successfully Merged: Y
- Failed: Z
- Total Files Changed: N
- Total Commits: M
```

## Options

- `$ARGUMENTS` - Specific issue number(s) to process (e.g., "5" or "1,5,12")
- Add `--dry-run` to plan without implementing
- Add `--skip-review` to skip the self-review step (not recommended)
- Add `--no-merge` to create PRs without auto-merging

## Safety Controls

- Never process issues labeled `do-not-automate` or `needs-discussion`
- Skip issues with assignees (someone is working on them)
- Maximum 5 issues per invocation to prevent runaway processing
- Always create PRs - never commit directly to main
- Typecheck must pass before creating PR

## Example Usage

```
/issues                    # List open issues and prompt for selection
/issues 42                 # Process only issue #42
/issues 1,5,12            # Process issues 1, 5, and 12
/issues --dry-run         # Show plan without implementing
/issues all --no-merge    # Process all eligible issues, create PRs but don't merge
```
