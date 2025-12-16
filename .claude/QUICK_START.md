# Claude Code Quick Start Guide

## Node.js Commands (npm, npx, node)

### The Problem
Node.js commands fail with "command not found" because Claude Code uses non-interactive shells.

### The Solution (Copy-Paste This)

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

**That's it!** After running this, all Node.js commands work normally.

### Usage Example

```bash
# 1. Initialize nvm (do this once per session)
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# 2. Use node commands normally
node --version
npm install
npx create-next-app
npm run dev
```

## Other Common Tools

### Python (if pyenv is used)
```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

### Ruby (if rbenv is used)
```bash
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"
```

### General Pattern
If a command isn't found, it's likely because its version manager isn't initialized. Check:
1. Does the command work in your normal terminal? → Yes? It's a version manager issue
2. Which version manager? (nvm, pyenv, rbenv, asdf, etc.)
3. Source the appropriate init script (usually in `~/.{tool}/` or check `.zshrc`)

## Why This Happens

- **Interactive shells** (your terminal) source `.zshrc` which initializes version managers
- **Non-interactive shells** (Claude Code, scripts) do NOT source `.zshrc`
- Solution: Manually source the init scripts when needed

## Full Documentation

See [SHELL_ENVIRONMENT.md](./SHELL_ENVIRONMENT.md) for complete details, troubleshooting, and advanced usage.

---

**Quick Help**: If you get "command not found", try sourcing nvm first (the one-liner above).
