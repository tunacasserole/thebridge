# Known Issues

This document tracks known issues that are outside of our direct control or are being monitored.

## GitHub CLI - Projects (Classic) Deprecation Warning

**Status**: Monitoring upstream fix
**Severity**: Low (cosmetic warning only)
**Issue**: [#71](https://github.com/tunacasserole/thebridge/issues/71)

### Description

When using the GitHub CLI (`gh`) commands, especially `gh pr` operations, you may see this deprecation warning:

```
GraphQL: Projects (classic) is being deprecated in favor of the new Projects experience,
see: https://github.blog/changelog/2024-05-23-sunset-notice-projects-classic/.
(repository.pullRequest.projectCards)
```

### Root Cause

This warning originates from the GitHub CLI tool itself, not from TheBridge code. The `gh` CLI internally queries the deprecated `repository.pullRequest.projectCards` GraphQL field when fetching pull request information.

### Impact

- **Functional**: None - all PR operations work correctly
- **Visual**: Warning message appears in terminal output
- **Action Required**: None from TheBridge maintainers

### Resolution

This will be resolved when:
1. GitHub completes their migration to the new Projects API
2. The GitHub CLI team updates `gh` to use the new Projects API endpoints

### Tracking

- GitHub Projects Classic sunset notice: https://github.blog/changelog/2024-05-23-sunset-notice-projects-classic/
- GitHub CLI issue tracker: https://github.com/cli/cli/issues

### Workarounds

None needed. The warning can be safely ignored as it does not affect functionality.

---

Last Updated: 2025-12-16
