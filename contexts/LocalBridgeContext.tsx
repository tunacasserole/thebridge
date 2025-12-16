'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';

/**
 * File entry from directory listing
 */
export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

/**
 * Git status result
 */
export interface GitStatus {
  status: string;
  branch: string;
  changes: string[];
}

/**
 * Search match result
 */
export interface SearchMatch {
  file: string;
  line: number;
  content: string;
}

/**
 * Local bridge connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Local bridge context value
 */
export interface LocalBridgeContextValue {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Error message if connection failed */
  error: string | null;
  /** Available tools from the bridge */
  availableTools: string[];
  /** Attempt to connect to local bridge */
  connect: (token?: string) => void;
  /** Disconnect from local bridge */
  disconnect: () => void;
  /** Read a file's contents */
  readFile: (path: string) => Promise<string>;
  /** Write content to a file */
  writeFile: (path: string, content: string) => Promise<void>;
  /** List directory contents */
  listDirectory: (path: string, recursive?: boolean) => Promise<FileEntry[]>;
  /** Create a directory */
  createDirectory: (path: string) => Promise<void>;
  /** Delete a file */
  deleteFile: (path: string) => Promise<void>;
  /** Run a shell command */
  runCommand: (command: string, cwd?: string, timeout?: number) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
  /** Run Claude Code CLI */
  runClaudeCode: (prompt: string, cwd?: string, onStream?: (chunk: string) => void) => Promise<{ output: string; exitCode: number }>;
  /** Get git status */
  gitStatus: (cwd: string) => Promise<GitStatus>;
  /** Get git diff */
  gitDiff: (cwd: string, staged?: boolean) => Promise<string>;
  /** Search files */
  searchFiles: (pattern: string, cwd: string, glob?: string) => Promise<SearchMatch[]>;
}

const LocalBridgeContext = createContext<LocalBridgeContextValue | null>(null);

const BRIDGE_URL = 'ws://localhost:3001';

interface BridgeResponse {
  id: string;
  success?: boolean;
  result?: unknown;
  error?: string;
  type?: 'connected' | 'stream';
  tools?: string[];
  chunk?: string;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  onStream?: (chunk: string) => void;
}

export function LocalBridgeProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [availableTools, setAvailableTools] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());
  const tokenRef = useRef<string | undefined>(undefined);

  const connect = useCallback((token?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState('connecting');
    setError(null);
    tokenRef.current = token;

    const url = token ? `${BRIDGE_URL}?token=${token}` : BRIDGE_URL;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('Connected to local bridge');
      // Connection state will be set when we receive the 'connected' message
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as BridgeResponse;

        if (data.type === 'connected') {
          setConnectionState('connected');
          setAvailableTools(data.tools || []);
          return;
        }

        if (data.type === 'stream' && data.id) {
          const pending = pendingRequests.current.get(data.id);
          if (pending?.onStream && data.chunk) {
            pending.onStream(data.chunk);
          }
          return;
        }

        if (data.id) {
          const pending = pendingRequests.current.get(data.id);
          if (pending) {
            pendingRequests.current.delete(data.id);
            if (data.success) {
              pending.resolve(data.result);
            } else {
              pending.reject(new Error(data.error || 'Unknown error'));
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse bridge message:', err);
      }
    };

    ws.onerror = () => {
      setConnectionState('error');
      setError('Failed to connect to local bridge. Make sure thebridge-local is running.');
    };

    ws.onclose = () => {
      setConnectionState('disconnected');
      wsRef.current = null;

      // Reject all pending requests
      pendingRequests.current.forEach((pending) => {
        pending.reject(new Error('Connection closed'));
      });
      pendingRequests.current.clear();
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState('disconnected');
    setAvailableTools([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    // Try to connect without token first
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const callTool = useCallback(async <T,>(
    tool: string,
    params: Record<string, unknown>,
    onStream?: (chunk: string) => void
  ): Promise<T> => {
    if (connectionState !== 'connected' || !wsRef.current) {
      throw new Error('Not connected to local bridge');
    }

    const id = crypto.randomUUID();

    return new Promise<T>((resolve, reject) => {
      pendingRequests.current.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        onStream,
      });

      wsRef.current?.send(JSON.stringify({ id, tool, params }));

      // Timeout after 5 minutes
      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error('Request timed out'));
        }
      }, 5 * 60 * 1000);
    });
  }, [connectionState]);

  const readFile = useCallback(async (path: string): Promise<string> => {
    const result = await callTool<{ content: string }>('read_file', { path });
    return result.content;
  }, [callTool]);

  const writeFile = useCallback(async (path: string, content: string): Promise<void> => {
    await callTool('write_file', { path, content });
  }, [callTool]);

  const listDirectory = useCallback(async (path: string, recursive?: boolean): Promise<FileEntry[]> => {
    const result = await callTool<{ entries: FileEntry[] }>('list_directory', { path, recursive });
    return result.entries;
  }, [callTool]);

  const createDirectory = useCallback(async (path: string): Promise<void> => {
    await callTool('create_directory', { path });
  }, [callTool]);

  const deleteFile = useCallback(async (path: string): Promise<void> => {
    await callTool('delete_file', { path });
  }, [callTool]);

  const runCommand = useCallback(async (
    command: string,
    cwd?: string,
    timeout?: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    return callTool('run_command', { command, cwd, timeout });
  }, [callTool]);

  const runClaudeCode = useCallback(async (
    prompt: string,
    cwd?: string,
    onStream?: (chunk: string) => void
  ): Promise<{ output: string; exitCode: number }> => {
    return callTool('claude_code', { prompt, cwd }, onStream);
  }, [callTool]);

  const gitStatus = useCallback(async (cwd: string): Promise<GitStatus> => {
    return callTool('git_status', { cwd });
  }, [callTool]);

  const gitDiff = useCallback(async (cwd: string, staged?: boolean): Promise<string> => {
    const result = await callTool<{ diff: string }>('git_diff', { cwd, staged });
    return result.diff;
  }, [callTool]);

  const searchFiles = useCallback(async (
    pattern: string,
    cwd: string,
    glob?: string
  ): Promise<SearchMatch[]> => {
    const result = await callTool<{ matches: SearchMatch[] }>('search_files', { pattern, cwd, glob });
    return result.matches;
  }, [callTool]);

  const value: LocalBridgeContextValue = {
    connectionState,
    error,
    availableTools,
    connect,
    disconnect,
    readFile,
    writeFile,
    listDirectory,
    createDirectory,
    deleteFile,
    runCommand,
    runClaudeCode,
    gitStatus,
    gitDiff,
    searchFiles,
  };

  return (
    <LocalBridgeContext.Provider value={value}>
      {children}
    </LocalBridgeContext.Provider>
  );
}

/**
 * Hook to access local bridge functionality
 */
export function useLocalBridge(): LocalBridgeContextValue {
  const context = useContext(LocalBridgeContext);
  if (!context) {
    throw new Error('useLocalBridge must be used within a LocalBridgeProvider');
  }
  return context;
}
