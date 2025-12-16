/**
 * Configuration for the local bridge server
 */
export interface BridgeConfig {
  /** Port for WebSocket server */
  port: number;
  /** Allowed origins for CORS */
  allowedOrigins: string[];
  /** Directories the bridge can access */
  allowedDirectories: string[];
  /** Whether to require authentication token */
  requireToken: boolean;
  /** Authentication token (if requireToken is true) */
  token?: string;
}

/**
 * Message sent from TheBridge web app to local bridge
 */
export interface BridgeRequest {
  id: string;
  tool: string;
  params: Record<string, unknown>;
}

/**
 * Response from local bridge to TheBridge web app
 */
export interface BridgeResponse {
  id: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

/**
 * File system entry for directory listing
 */
export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

/**
 * Project configuration stored locally
 */
export interface ProjectConfig {
  name: string;
  path: string;
  lastOpened?: string;
}

/**
 * Tool definitions available through the bridge
 */
export type ToolName =
  | 'read_file'
  | 'write_file'
  | 'list_directory'
  | 'create_directory'
  | 'delete_file'
  | 'run_command'
  | 'claude_code'
  | 'git_status'
  | 'git_diff'
  | 'search_files';

/**
 * Parameters for each tool
 */
export interface ToolParams {
  read_file: { path: string };
  write_file: { path: string; content: string };
  list_directory: { path: string; recursive?: boolean };
  create_directory: { path: string };
  delete_file: { path: string };
  run_command: { command: string; cwd?: string; timeout?: number };
  claude_code: { prompt: string; cwd?: string };
  git_status: { cwd: string };
  git_diff: { cwd: string; staged?: boolean };
  search_files: { pattern: string; cwd: string; glob?: string };
}
