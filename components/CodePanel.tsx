'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocalBridge, FileEntry, ConnectionState } from '@/contexts/LocalBridgeContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodePanelProps {
  className?: string;
  defaultPath?: string;
}

/**
 * Get language from file extension
 */
function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    json: 'json',
    md: 'markdown',
    css: 'css',
    scss: 'scss',
    html: 'html',
    py: 'python',
    go: 'go',
    rs: 'rust',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
  };
  return languageMap[ext || ''] || 'plaintext';
}

/**
 * Format file size
 */
function formatSize(bytes?: number): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Connection status indicator
 */
function ConnectionStatus({ state, error }: { state: ConnectionState; error: string | null }) {
  const statusColors = {
    disconnected: 'bg-gray-500',
    connecting: 'bg-yellow-500 animate-pulse',
    connected: 'bg-green-500',
    error: 'bg-red-500',
  };

  const statusText = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    connected: 'Connected',
    error: 'Error',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${statusColors[state]}`} />
      <span className="text-[--text-secondary]">{statusText[state]}</span>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

/**
 * Common allowed directories
 */
const COMMON_DIRECTORIES = [
  { name: 'Development', path: '/Users/ahenderson/dev' },
  { name: 'Projects', path: '/Users/ahenderson/projects' },
  { name: 'Documents', path: '/Users/ahenderson/Documents' },
  { name: 'This Project', path: '/Users/ahenderson/dev/thebridge' },
];

/**
 * Directory picker for initial selection
 */
function DirectoryPicker({ onSelect }: { onSelect: (path: string) => void }) {
  const [customPath, setCustomPath] = useState('');

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-[--border-primary]">
        <span className="text-sm font-medium text-[--text-secondary]">Select Directory</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-xs text-[--text-tertiary] mb-3">
          Choose a directory to browse:
        </p>
        {COMMON_DIRECTORIES.map((dir) => (
          <button
            key={dir.path}
            onClick={() => onSelect(dir.path)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[--bg-tertiary] text-left mb-1"
          >
            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="truncate text-[--text-primary]">{dir.name}</div>
              <div className="truncate text-xs text-[--text-tertiary]">{dir.path}</div>
            </div>
          </button>
        ))}
        <div className="mt-4 pt-3 border-t border-[--border-primary]">
          <label className="text-xs text-[--text-tertiary] block mb-1">Custom path:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="/path/to/directory"
              className="flex-1 px-2 py-1 text-sm bg-[--bg-primary] border border-[--border-primary] rounded focus:outline-none focus:border-[--accent-primary]"
            />
            <button
              onClick={() => customPath && onSelect(customPath)}
              disabled={!customPath}
              className="px-3 py-1 text-sm bg-[--accent-primary] text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * File tree component
 */
function FileTree({
  entries,
  currentPath,
  selectedPath,
  onSelect,
  onRefresh,
  onBack,
}: {
  entries: FileEntry[];
  currentPath: string;
  selectedPath: string | null;
  onSelect: (entry: FileEntry) => void;
  onRefresh: () => void;
  onBack: () => void;
}) {
  const directories = entries.filter((e) => e.type === 'directory').sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter((e) => e.type === 'file').sort((a, b) => a.name.localeCompare(b.name));
  const pathParts = currentPath.split('/').filter(Boolean);
  const currentDirName = pathParts[pathParts.length - 1] || 'Root';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-[--border-primary]">
        <div className="flex items-center gap-1 min-w-0">
          <button
            onClick={onBack}
            className="p-1 hover:bg-[--bg-tertiary] rounded text-[--text-secondary] flex-shrink-0"
            title="Go up / Change directory"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-[--text-secondary] truncate" title={currentPath}>
            {currentDirName}
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 hover:bg-[--bg-tertiary] rounded text-[--text-secondary] flex-shrink-0"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {entries.length === 0 && (
          <p className="text-xs text-[--text-tertiary] p-2">No files found</p>
        )}
        {directories.map((entry) => (
          <button
            key={entry.path}
            onClick={() => onSelect(entry)}
            className={`w-full flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-[--bg-tertiary] text-left ${
              selectedPath === entry.path ? 'bg-[--bg-tertiary]' : ''
            }`}
          >
            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="truncate">{entry.name}</span>
          </button>
        ))}
        {files.map((entry) => (
          <button
            key={entry.path}
            onClick={() => onSelect(entry)}
            className={`w-full flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-[--bg-tertiary] text-left ${
              selectedPath === entry.path ? 'bg-[--bg-tertiary] text-[--text-primary]' : 'text-[--text-secondary]'
            }`}
          >
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate flex-1">{entry.name}</span>
            <span className="text-xs text-[--text-tertiary]">{formatSize(entry.size)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Setup instructions when not connected
 */
function SetupInstructions({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 mb-4 text-[--text-tertiary]">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[--text-primary] mb-2">Local Bridge Not Connected</h3>
      <p className="text-[--text-secondary] mb-4 max-w-md">
        To enable local coding capabilities, you need to run the TheBridge local server on your machine.
      </p>
      <div className="bg-[--bg-tertiary] rounded-lg p-4 mb-4 text-left font-mono text-sm">
        <div className="text-[--text-secondary] mb-2"># Install and run the local bridge</div>
        <div className="text-[--accent-primary]">npx @thebridge/local start</div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[--accent-primary] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Retry Connection
        </button>
        <a
          href="https://github.com/tunacasserole/thebridge/tree/main/packages/local-bridge"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-[--border-primary] rounded-lg hover:bg-[--bg-tertiary] transition-colors text-[--text-secondary]"
        >
          Documentation
        </a>
      </div>
    </div>
  );
}

/**
 * Main CodePanel component
 */
export default function CodePanel({ className = '', defaultPath }: CodePanelProps) {
  const {
    connectionState,
    error,
    connect,
    readFile,
    writeFile,
    listDirectory,
    runClaudeCode,
  } = useLocalBridge();

  const [currentPath, setCurrentPath] = useState<string>(defaultPath || '');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [claudePrompt, setClaudePrompt] = useState('');
  const [claudeOutput, setClaudeOutput] = useState('');
  const [isRunningClaude, setIsRunningClaude] = useState(false);

  // Load directory contents
  const loadDirectory = useCallback(async (path: string) => {
    if (connectionState !== 'connected') return;

    setIsLoading(true);
    try {
      const result = await listDirectory(path);
      setEntries(result);
      setCurrentPath(path);
    } catch (err) {
      console.error('Failed to list directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [connectionState, listDirectory]);

  // Load file content
  const loadFile = useCallback(async (entry: FileEntry) => {
    if (entry.type === 'directory') {
      await loadDirectory(entry.path);
      return;
    }

    setIsLoading(true);
    try {
      const content = await readFile(entry.path);
      setSelectedFile(entry);
      setFileContent(content);
      setEditContent(content);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to read file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [readFile, loadDirectory]);

  // Save file
  const saveFile = useCallback(async () => {
    if (!selectedFile) return;

    setIsSaving(true);
    try {
      await writeFile(selectedFile.path, editContent);
      setFileContent(editContent);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save file:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, editContent, writeFile]);

  // Run Claude Code
  const runClaude = useCallback(async () => {
    if (!claudePrompt.trim() || !currentPath) return;

    setIsRunningClaude(true);
    setClaudeOutput('');

    try {
      const result = await runClaudeCode(claudePrompt, currentPath, (chunk) => {
        setClaudeOutput((prev) => prev + chunk);
      });

      if (result.exitCode !== 0) {
        setClaudeOutput((prev) => prev + `\n\nExit code: ${result.exitCode}`);
      }

      // Refresh directory after Claude makes changes
      await loadDirectory(currentPath);
    } catch (err) {
      setClaudeOutput(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRunningClaude(false);
    }
  }, [claudePrompt, currentPath, runClaudeCode, loadDirectory]);

  // Don't auto-load - let user select from defaultPath or sidebar
  // This avoids the "path not allowed" error on initial load

  if (connectionState !== 'connected') {
    return (
      <div className={`flex flex-col bg-[--bg-secondary] rounded-lg border border-[--border-primary] ${className}`}>
        <div className="flex items-center justify-between p-3 border-b border-[--border-primary]">
          <h2 className="text-sm font-medium text-[--text-primary]">Code Editor</h2>
          <ConnectionStatus state={connectionState} error={error} />
        </div>
        <SetupInstructions onRetry={() => connect()} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[--bg-secondary] rounded-lg border border-[--border-primary] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[--border-primary]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-[--text-primary]">Code Editor</h2>
          {currentPath && (
            <span className="text-xs text-[--text-tertiary] font-mono truncate max-w-[300px]">
              {currentPath}
            </span>
          )}
        </div>
        <ConnectionStatus state={connectionState} error={error} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: '400px' }}>
        {/* File tree sidebar */}
        <div className="w-56 border-r border-[--border-primary] flex-shrink-0">
          {currentPath ? (
            <FileTree
              entries={entries}
              currentPath={currentPath}
              selectedPath={selectedFile?.path || null}
              onSelect={loadFile}
              onRefresh={() => loadDirectory(currentPath)}
              onBack={() => {
                setCurrentPath('');
                setEntries([]);
                setSelectedFile(null);
                setFileContent('');
              }}
            />
          ) : (
            <DirectoryPicker onSelect={loadDirectory} />
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[--border-primary]">
                <span className="text-sm font-mono text-[--text-secondary]">{selectedFile.name}</span>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setEditContent(fileContent);
                          setIsEditing(false);
                        }}
                        className="px-3 py-1 text-xs border border-[--border-primary] rounded hover:bg-[--bg-tertiary]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveFile}
                        disabled={isSaving}
                        className="px-3 py-1 text-xs bg-[--accent-primary] text-white rounded hover:opacity-90 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 text-xs border border-[--border-primary] rounded hover:bg-[--bg-tertiary]"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Code content */}
              <div className="flex-1 overflow-auto">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full p-4 bg-[--bg-primary] text-[--text-primary] font-mono text-sm resize-none focus:outline-none"
                    spellCheck={false}
                  />
                ) : (
                  <SyntaxHighlighter
                    language={getLanguage(selectedFile.name)}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: 'var(--bg-primary)',
                      fontSize: '0.875rem',
                      height: '100%',
                    }}
                    showLineNumbers
                  >
                    {fileContent}
                  </SyntaxHighlighter>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[--text-tertiary]">
              Select a file to view
            </div>
          )}
        </div>
      </div>

      {/* Claude Code panel */}
      <div className="border-t border-[--border-primary]">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-[--text-secondary]">Claude Code</span>
            {isRunningClaude && (
              <span className="text-xs text-[--accent-primary] animate-pulse">Running...</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={claudePrompt}
              onChange={(e) => setClaudePrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && runClaude()}
              placeholder="Ask Claude to help with your code..."
              className="flex-1 px-3 py-2 bg-[--bg-primary] border border-[--border-primary] rounded text-sm focus:outline-none focus:border-[--accent-primary]"
              disabled={isRunningClaude}
            />
            <button
              onClick={runClaude}
              disabled={isRunningClaude || !claudePrompt.trim()}
              className="px-4 py-2 bg-[--accent-primary] text-white rounded hover:opacity-90 disabled:opacity-50 text-sm"
            >
              Run
            </button>
          </div>
          {claudeOutput && (
            <pre className="mt-2 p-3 bg-[--bg-primary] rounded text-xs font-mono text-[--text-secondary] max-h-32 overflow-auto whitespace-pre-wrap">
              {claudeOutput}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
