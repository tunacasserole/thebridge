# CODE-001: Local Bridge for Coding Through TheBridge

## Overview

**Goal**: Enable users to code through TheBridge - both locally and on the web - by creating a bridge server that connects the web UI to local development tools.

**Value**: Users can edit local files, run terminal commands, and leverage Claude Code CLI directly from TheBridge's web interface, creating a seamless AI-assisted coding experience.

## Scope

### In Scope

- Local bridge server (`@thebridge/local` npm package)
- WebSocket-based communication protocol
- File operations (read, write, list, create, delete)
- Terminal command execution with security sandboxing
- Claude Code CLI integration
- Git operations (status, diff)
- Code search functionality
- React context and hooks for the web app
- Code editor panel with syntax highlighting
- Connection status indicator in header

### Out of Scope

- Monaco Editor (using syntax highlighter instead to avoid heavy dependency)
- WebContainers (browser-based Node.js) - future enhancement
- GitHub Codespaces integration - future enhancement
- Remote server execution - only local machine

## Current Status

- **Status**: Completed
- **Completion**: 100%
- **Blocking Issues**: None

## Implementation Progress

### Completed

1. **Local Bridge Package** (`packages/local-bridge/`)
   - `src/types.ts` - TypeScript type definitions
   - `src/config.ts` - Configuration management
   - `src/security.ts` - Security validation (path restrictions, dangerous commands)
   - `src/tools.ts` - Tool implementations (file ops, terminal, git, search)
   - `src/server.ts` - WebSocket server with MCP-style tool calling
   - `src/cli.ts` - CLI commands (start, setup, allow, config, etc.)
   - `src/index.ts` - Package exports
   - `package.json` - Package configuration
   - `tsconfig.json` - TypeScript configuration
   - `README.md` - Documentation

2. **React Integration**
   - `contexts/LocalBridgeContext.tsx` - React context with all bridge operations
   - `components/CodePanel.tsx` - Code editor with file tree, syntax highlighting
   - `components/header/LocalBridgeStatus.tsx` - Connection status indicator
   - `app/code/page.tsx` - Dedicated code editor page

3. **App Integration**
   - Added `LocalBridgeProvider` to app layout
   - Added `LocalBridgeStatus` to header
   - Excluded `packages/` from main TypeScript compilation

## Technical Details

### Architecture

```
TheBridge (Web) ←→ WebSocket ←→ Local Bridge Server ←→ Local Machine
      │                              │
      │                              ├── File System
      │                              ├── Terminal (bash)
      │                              ├── Claude Code CLI
      │                              └── Git
      │
      └── React Context (LocalBridgeContext)
           ├── Connection management
           ├── Tool calling (readFile, writeFile, etc.)
           └── Streaming support (Claude Code output)
```

### Files Modified/Created

```
packages/local-bridge/            # New npm package
├── src/
│   ├── types.ts                  # Type definitions
│   ├── config.ts                 # Configuration management
│   ├── security.ts               # Security validation
│   ├── tools.ts                  # Tool implementations
│   ├── server.ts                 # WebSocket server
│   ├── cli.ts                    # CLI interface
│   └── index.ts                  # Package exports
├── package.json
├── tsconfig.json
└── README.md

contexts/LocalBridgeContext.tsx   # React context
components/CodePanel.tsx          # Code editor component
components/header/LocalBridgeStatus.tsx  # Status indicator
app/code/page.tsx                 # Code editor page
app/layout.tsx                    # Added LocalBridgeProvider
components/Header.tsx             # Added LocalBridgeStatus
tsconfig.json                     # Excluded packages/
```

### Dependencies

**Local Bridge Package:**
- `@modelcontextprotocol/sdk` - MCP protocol support
- `ws` - WebSocket server
- `commander` - CLI framework
- `chokidar` - File watching (future)

**Web App (existing):**
- `react-syntax-highlighter` - Code syntax highlighting

### Key Decisions Made

1. **WebSocket over HTTP**: Chose WebSocket for bidirectional streaming, essential for Claude Code output
2. **Security-first**: Implemented path restrictions, dangerous command detection, and origin validation
3. **Separate package**: Created standalone npm package for easy distribution and versioning
4. **No Monaco**: Avoided heavy Monaco Editor dependency, used existing syntax highlighter
5. **MCP-style tools**: Used MCP tool calling pattern for consistency with Claude ecosystem

## Testing & Validation

### Manual Testing Checklist

- [ ] Run `npx @thebridge/local setup` - should create config
- [ ] Run `npx @thebridge/local start` - should start server on port 3001
- [ ] Connect from TheBridge web UI - should show green status
- [ ] Navigate to `/code` page
- [ ] List directory contents
- [ ] Open and view a file
- [ ] Edit and save a file
- [ ] Run Claude Code prompt
- [ ] Run terminal command
- [ ] View git status

### Security Testing

- [ ] Cannot access files outside allowed directories
- [ ] Cannot read SSH keys or credentials
- [ ] Dangerous commands are blocked
- [ ] Only allowed origins can connect

## Usage

### Quick Start

1. Start the local bridge:
   ```bash
   npx @thebridge/local start
   ```

2. Open TheBridge in your browser

3. The terminal icon in the header will show green when connected

4. Navigate to `/code` to use the full code editor

### CLI Commands

```bash
# Start server
npx @thebridge/local start

# Setup (creates config file)
npx @thebridge/local setup

# Add allowed directory
npx @thebridge/local allow ~/my-projects

# Remove allowed directory
npx @thebridge/local disallow ~/my-projects

# Show config
npx @thebridge/local config

# Generate auth token
npx @thebridge/local token
```

## Future Enhancements

1. **Monaco Editor**: Add Monaco for full IDE experience
2. **WebContainers**: Browser-based Node.js for web-only users
3. **GitHub Codespaces**: Integration for cloud development
4. **File Watching**: Auto-refresh when files change
5. **Multi-file Editing**: Tabs and split views
6. **Diff Viewer**: Visual diff for changes

## References

- Issue: #57
- MCP Protocol: https://modelcontextprotocol.io/
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
