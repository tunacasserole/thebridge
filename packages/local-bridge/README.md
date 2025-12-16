# @thebridge/local

Local bridge server for TheBridge - enables local coding capabilities from the web interface.

## Features

- **File Operations**: Read, write, create, delete files and directories
- **Terminal Access**: Run shell commands with security sandboxing
- **Claude Code Integration**: Run Claude Code CLI directly from TheBridge
- **Git Integration**: View status, diffs, and changes
- **Code Search**: Search files with grep patterns
- **Security**: Path restrictions, dangerous command detection, origin validation

## Installation

```bash
npm install -g @thebridge/local
```

Or run directly with npx:

```bash
npx @thebridge/local start
```

## Quick Start

### 1. Setup (first time only)

```bash
thebridge-local setup
```

This creates a config file at `~/.thebridge/config.json` with default settings.

### 2. Start the server

```bash
thebridge-local start
```

The server will start on `ws://localhost:3001` by default.

### 3. Connect from TheBridge

Open [TheBridge](https://thebridge.vercel.app) or your local development server. The app will automatically detect and connect to your local bridge.

## Commands

### `thebridge-local start`

Start the local bridge server.

Options:
- `-p, --port <port>`: Port to listen on (default: 3001)

### `thebridge-local setup`

Run interactive setup to configure the bridge.

### `thebridge-local allow <directory>`

Add a directory to the allowed list. The bridge can only access files within allowed directories.

```bash
thebridge-local allow ~/projects
thebridge-local allow /path/to/my/code
```

### `thebridge-local disallow <directory>`

Remove a directory from the allowed list.

### `thebridge-local config`

Show current configuration.

### `thebridge-local projects`

List saved projects that have been opened through TheBridge.

### `thebridge-local token`

Generate a new authentication token for secure connections. When a token is set, TheBridge must provide it to connect.

### `thebridge-local reset`

Reset configuration to defaults.

## Security

The local bridge implements several security measures:

### Path Restrictions

- Only files within allowed directories can be accessed
- Sensitive files (SSH keys, AWS credentials, etc.) are blocked
- Hidden files and `node_modules` are excluded from directory listings

### Command Restrictions

Dangerous commands are flagged and require explicit confirmation:
- `rm -rf`
- `sudo`
- Commands that pipe to shell (`curl | bash`)
- Force push to git
- etc.

### Origin Validation

Only connections from allowed origins are accepted:
- `https://thebridge.vercel.app`
- `http://localhost:3000`

### Token Authentication (optional)

Enable token authentication for additional security:

```bash
thebridge-local token
```

Add the generated token to TheBridge settings.

## Configuration

Configuration is stored at `~/.thebridge/config.json`:

```json
{
  "port": 3001,
  "allowedOrigins": [
    "https://thebridge.vercel.app",
    "http://localhost:3000"
  ],
  "allowedDirectories": [
    "/Users/you/dev",
    "/Users/you/projects"
  ],
  "requireToken": false,
  "token": null
}
```

## Available Tools

The bridge exposes these tools via WebSocket:

| Tool | Description |
|------|-------------|
| `read_file` | Read a file's contents |
| `write_file` | Write content to a file |
| `list_directory` | List directory contents |
| `create_directory` | Create a new directory |
| `delete_file` | Delete a file |
| `run_command` | Run a shell command |
| `claude_code` | Run Claude Code CLI |
| `git_status` | Get git status for a repo |
| `git_diff` | Get git diff |
| `search_files` | Search files with grep |

## WebSocket Protocol

### Connection

Connect to `ws://localhost:3001`. Optionally append `?token=YOUR_TOKEN` if token authentication is enabled.

### Request Format

```json
{
  "id": "unique-request-id",
  "tool": "read_file",
  "params": {
    "path": "/path/to/file.ts"
  }
}
```

### Response Format

```json
{
  "id": "unique-request-id",
  "success": true,
  "result": {
    "content": "file contents..."
  }
}
```

### Streaming (Claude Code)

For `claude_code` tool, responses may include streaming chunks:

```json
{
  "id": "unique-request-id",
  "type": "stream",
  "chunk": "partial output..."
}
```

Followed by final response when complete.

## Development

```bash
# Clone the repo
git clone https://github.com/tunacasserole/thebridge.git
cd thebridge/packages/local-bridge

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/cli.js start
```

## License

MIT
