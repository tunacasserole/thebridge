# Shell Environment Guide for Claude Code

## Problem Overview

**Issue**: Commands like `node`, `npm`, `npx`, and other CLI tools fail with "command not found" errors in Claude Code sessions.

**Root Cause**: Claude Code runs **non-interactive shells** which do NOT source `.bashrc` or `.zshrc`. This means PATH modifications and tool initializations in those files are never executed.

## Understanding Shell Types

### Interactive vs Non-Interactive Shells

| Shell Type | When It Runs | Config Files Sourced (zsh) | Example |
|------------|--------------|---------------------------|---------|
| **Interactive Login** | Terminal app login | `.zprofile`, `.zlogin`, `.zshrc` | New terminal window |
| **Interactive Non-Login** | Subshells in terminal | `.zshrc` only | `zsh` command |
| **Non-Interactive** | Scripts, automation, **Claude Code** | `.zshenv`, `.zprofile` | Bash scripts, CI/CD |

**Key Point**: Claude Code uses **non-interactive shells**, so only `.zshenv` and `.zprofile` are sourced automatically.

## System Configuration Discovery

### Current Setup (on this machine)

```bash
# Node.js is managed by nvm (Node Version Manager)
# Location: ~/.nvm/
# Installed versions:
#   - v20.19.5 (current default)
#   - v22.20.0

# asdf is also installed but currently broken:
#   - Missing binary at /opt/homebrew/Cellar/asdf/0.14.0/libexec/bin/asdf
#   - Shims exist but won't work: ~/.asdf/shims/

# User's .zshrc contains nvm initialization (lines 19-21, 45)
# But .zshrc is NOT sourced in non-interactive shells!
```

### Why Commands Fail

1. Claude Code starts non-interactive zsh shell
2. Only `.zprofile` is sourced (not `.zshrc`)
3. `.zprofile` doesn't initialize nvm
4. nvm's bin directories aren't added to PATH
5. `node`, `npm`, `npx` commands not found

## The Solution

### Option 1: Source nvm at Session Start (RECOMMENDED)

Add this to the **beginning** of any Claude Code session where you need Node.js:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

After sourcing, all node commands work normally:

```bash
node --version   # ✅ Works
npm --version    # ✅ Works
npx --version    # ✅ Works
```

### Option 2: Use Full Paths (Alternative)

If you know which Node version to use, you can use full paths:

```bash
# For nvm v20.19.5 (current default):
~/.nvm/versions/node/v20.19.5/bin/node --version
~/.nvm/versions/node/v20.19.5/bin/npm install
~/.nvm/versions/node/v20.19.5/bin/npx create-next-app

# For nvm v22.20.0:
~/.nvm/versions/node/v22.20.0/bin/node --version
```

**Drawback**: Requires knowing exact version number and updating if version changes.

### Option 3: Add to .zprofile (PERMANENT FIX)

To make this automatic for ALL non-interactive shells, add nvm initialization to `.zprofile`:

```bash
# Add to ~/.zprofile
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

**Note**: This requires modifying the user's shell configuration. Only do this if explicitly requested.

## Quick Reference Commands

### Investigation Commands

```bash
# Check current PATH
echo $PATH

# Check shell type
[[ $- == *i* ]] && echo "Interactive" || echo "Non-interactive"

# Find node installations
which node || echo "node not in PATH"
ls -la ~/.nvm/versions/node/  # Check nvm versions
ls -la ~/.asdf/installs/nodejs/  # Check asdf versions

# Test if nvm is loaded
command -v nvm && echo "nvm is loaded" || echo "nvm NOT loaded"
```

### Solution Commands (Copy-Paste Ready)

```bash
# Initialize nvm in current session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Verify it works
node --version
npm --version
npx --version
which node  # Should show: /Users/ahenderson/.nvm/versions/node/v20.19.5/bin/node
```

### Common Workflow Pattern

```bash
# 1. Source nvm at start of session
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# 2. Now use node commands normally
npm install
npx prisma generate
node --version
npm run dev
```

## Understanding nvm

### What is nvm?

**nvm (Node Version Manager)** allows multiple Node.js versions on one machine. Each version is installed in its own directory:

```
~/.nvm/
├── versions/
│   └── node/
│       ├── v20.19.5/
│       │   └── bin/
│       │       ├── node
│       │       ├── npm
│       │       └── npx
│       └── v22.20.0/
│           └── bin/
│               ├── node
│               ├── npm
│               └── npx
└── nvm.sh  # Initialization script
```

### How nvm Works

1. `nvm.sh` is sourced in shell initialization
2. It modifies PATH to point to a specific Node version
3. Commands like `node`, `npm`, `npx` become available
4. You can switch versions with `nvm use v22.20.0`

### nvm Commands

```bash
# List installed versions
nvm list

# Show current version
nvm current

# Switch versions
nvm use v22.20.0

# Install new version
nvm install 22.20.0

# Set default version
nvm alias default v20.19.5
```

## Troubleshooting

### Q: Why doesn't my .zshrc configuration work?

**A**: Claude Code uses non-interactive shells. Only `.zshenv` and `.zprofile` are sourced.

### Q: Should I fix the broken asdf installation?

**A**: Not necessary if nvm works. The system has both nvm and asdf, but nvm is properly configured and working. asdf appears to be an older/unused installation.

### Q: Can I make this permanent without modifying user files?

**A**: No. The only way to make it automatic is to add nvm initialization to `.zprofile` or `.zshenv`. Otherwise, source nvm at the start of each session.

### Q: What about other version managers (rbenv, pyenv, etc.)?

**A**: Same principle applies. They all require initialization scripts that are typically in `.zshrc`. You must either:
1. Source their init scripts manually in non-interactive shells
2. Add initialization to `.zprofile` or `.zshenv`
3. Use full paths to their shims/binaries

### Q: How do I know which Node version is being used?

```bash
# After sourcing nvm
node --version          # Shows version: v20.19.5
which node             # Shows full path
nvm current            # Shows nvm's active version
```

## Best Practices for Claude Code Agents

### ✅ DO

1. **Source nvm at session start** if you need Node.js tools
2. **Use the one-liner** for quick initialization:
   ```bash
   export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
   ```
3. **Verify availability** before using commands:
   ```bash
   command -v node > /dev/null 2>&1 || { echo "Node not found, sourcing nvm..."; export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"; }
   ```
4. **Document when you source nvm** so other agents know it's been done

### ❌ DON'T

1. **Don't assume** node/npm/npx are in PATH
2. **Don't modify** `.zprofile` or `.zshrc` without explicit user permission
3. **Don't use** asdf shims (they're broken on this system)
4. **Don't waste time** searching for node in standard locations like `/usr/local/bin`

## Example Workflows

### Starting a New Node.js Project

```bash
# Initialize nvm
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Verify Node is available
node --version

# Create project
npx create-next-app my-project
cd my-project
npm install
npm run dev
```

### Running Package Scripts

```bash
# Initialize nvm
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Run commands
npm run build
npm test
npx prisma generate
```

### Multi-Command Session

```bash
# Source once at the start
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# All subsequent commands work
npm install
npm run lint
npm run build
npm test
node scripts/custom-script.js
```

## Summary

| Problem | Root Cause | Solution |
|---------|------------|----------|
| `node: command not found` | nvm not initialized in non-interactive shell | Source `nvm.sh` at session start |
| `npm: command not found` | Same as above | Same as above |
| `npx: command not found` | Same as above | Same as above |

**Key Takeaway**: Always source nvm at the beginning of Claude Code sessions that need Node.js tools.

**One-Line Solution**:
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

## Additional Notes

- **Current nvm default**: v20.19.5
- **Available versions**: v20.19.5, v22.20.0
- **nvm location**: `~/.nvm/`
- **Node binaries**: `~/.nvm/versions/node/[version]/bin/`
- **Shell type**: Non-interactive zsh
- **Config sourced**: `.zprofile` only (not `.zshrc`)

---

**Last Updated**: 2025-12-13
**System**: macOS (Darwin 25.2.0)
**Shell**: zsh 5.9
**Node Version Manager**: nvm 0.40.1
