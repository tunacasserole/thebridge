import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import type { BridgeConfig, FileEntry, ToolParams } from './types.js';
import { validateFileAccess, validateCommand } from './security.js';

const execAsync = promisify(exec);

/**
 * Read a file's contents
 */
export async function readFile(
  params: ToolParams['read_file'],
  config: BridgeConfig
): Promise<{ content: string }> {
  const validation = validateFileAccess(params.path, config, 'read');
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  const content = await fs.readFile(params.path, 'utf-8');
  return { content };
}

/**
 * Write content to a file
 */
export async function writeFile(
  params: ToolParams['write_file'],
  config: BridgeConfig
): Promise<{ success: boolean }> {
  const validation = validateFileAccess(params.path, config, 'write');
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  // Ensure directory exists
  const dir = path.dirname(params.path);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(params.path, params.content, 'utf-8');
  return { success: true };
}

/**
 * List directory contents
 */
export async function listDirectory(
  params: ToolParams['list_directory'],
  config: BridgeConfig
): Promise<{ entries: FileEntry[] }> {
  const validation = validateFileAccess(params.path, config, 'read');
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  const entries: FileEntry[] = [];

  async function processDir(dirPath: string, depth: number = 0): Promise<void> {
    if (depth > 5) return; // Limit recursion depth

    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      // Skip hidden files and node_modules
      if (item.name.startsWith('.') || item.name === 'node_modules') {
        continue;
      }

      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        entries.push({
          name: item.name,
          path: fullPath,
          type: 'directory',
        });

        if (params.recursive) {
          await processDir(fullPath, depth + 1);
        }
      } else if (item.isFile()) {
        const stats = await fs.stat(fullPath);
        entries.push({
          name: item.name,
          path: fullPath,
          type: 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
      }
    }
  }

  await processDir(params.path);
  return { entries };
}

/**
 * Create a directory
 */
export async function createDirectory(
  params: ToolParams['create_directory'],
  config: BridgeConfig
): Promise<{ success: boolean }> {
  const validation = validateFileAccess(params.path, config, 'write');
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  await fs.mkdir(params.path, { recursive: true });
  return { success: true };
}

/**
 * Delete a file
 */
export async function deleteFile(
  params: ToolParams['delete_file'],
  config: BridgeConfig
): Promise<{ success: boolean }> {
  const validation = validateFileAccess(params.path, config, 'delete');
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  await fs.unlink(params.path);
  return { success: true };
}

/**
 * Run a shell command
 */
export async function runCommand(
  params: ToolParams['run_command'],
  config: BridgeConfig
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const cwd = params.cwd || process.cwd();
  const validation = validateCommand(params.command, cwd, config);

  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  if (validation.requiresConfirmation) {
    throw new Error(
      `Dangerous command detected: ${validation.reason}. This command requires explicit user confirmation.`
    );
  }

  return new Promise((resolve, reject) => {
    const timeout = params.timeout || 30000;

    const proc = spawn('bash', ['-c', params.command], {
      cwd,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGTERM');
    }, timeout);

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (killed) {
        reject(new Error(`Command timed out after ${timeout}ms`));
      } else {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Run Claude Code CLI
 */
export async function runClaudeCode(
  params: ToolParams['claude_code'],
  config: BridgeConfig,
  onOutput?: (chunk: string) => void
): Promise<{ output: string; exitCode: number }> {
  const cwd = params.cwd || process.cwd();
  const validation = validateFileAccess(cwd, config, 'read');

  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(
      'claude',
      ['-p', params.prompt, '--output-format', 'stream-json'],
      {
        cwd,
        env: { ...process.env },
      }
    );

    let output = '';

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      onOutput?.(chunk);
    });

    proc.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      onOutput?.(chunk);
    });

    proc.on('close', (code) => {
      resolve({
        output,
        exitCode: code ?? 1,
      });
    });

    proc.on('error', (err) => {
      // Claude CLI might not be installed
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            'Claude Code CLI is not installed. Install it with: npm install -g @anthropic-ai/claude-code'
          )
        );
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Get git status
 */
export async function gitStatus(
  params: ToolParams['git_status'],
  config: BridgeConfig
): Promise<{ status: string; branch: string; changes: string[] }> {
  const validation = validateFileAccess(params.cwd, config, 'read');
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  const { stdout: branch } = await execAsync('git branch --show-current', { cwd: params.cwd });
  const { stdout: status } = await execAsync('git status --porcelain', { cwd: params.cwd });

  const changes = status
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.trim());

  return {
    status: status || 'Clean',
    branch: branch.trim(),
    changes,
  };
}

/**
 * Get git diff
 */
export async function gitDiff(
  params: ToolParams['git_diff'],
  config: BridgeConfig
): Promise<{ diff: string }> {
  const validation = validateFileAccess(params.cwd, config, 'read');
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  const command = params.staged ? 'git diff --staged' : 'git diff';
  const { stdout } = await execAsync(command, { cwd: params.cwd });

  return { diff: stdout };
}

/**
 * Search files using grep
 */
export async function searchFiles(
  params: ToolParams['search_files'],
  config: BridgeConfig
): Promise<{ matches: Array<{ file: string; line: number; content: string }> }> {
  const validation = validateFileAccess(params.cwd, config, 'read');
  if (!validation.allowed) {
    throw new Error(validation.reason);
  }

  const glob = params.glob || '*.{ts,tsx,js,jsx,json,md}';
  const command = `grep -rn --include="${glob}" "${params.pattern}" . 2>/dev/null || true`;

  const { stdout } = await execAsync(command, { cwd: params.cwd, maxBuffer: 10 * 1024 * 1024 });

  const matches = stdout
    .split('\n')
    .filter((line) => line.trim())
    .slice(0, 100) // Limit results
    .map((line) => {
      const match = line.match(/^(.+?):(\d+):(.*)$/);
      if (match) {
        return {
          file: path.join(params.cwd, match[1]),
          line: parseInt(match[2], 10),
          content: match[3].trim(),
        };
      }
      return null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return { matches };
}

// Re-export ToolParams for use by server.ts
export type { ToolParams } from './types.js';
