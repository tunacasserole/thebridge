import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import type { BridgeConfig, ProjectConfig } from './types.js';

const CONFIG_DIR = path.join(os.homedir(), '.thebridge');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const PROJECTS_FILE = path.join(CONFIG_DIR, 'projects.json');

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: BridgeConfig = {
  port: 3001,
  allowedOrigins: [
    'https://thebridge.vercel.app',
    'https://*.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  allowedDirectories: [
    path.join(os.homedir(), 'dev'),
    path.join(os.homedir(), 'projects'),
    path.join(os.homedir(), 'code'),
    path.join(os.homedir(), 'Documents'),
  ],
  requireToken: false,
};

/**
 * Ensure config directory exists
 */
export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load configuration from disk
 */
export function loadConfig(): BridgeConfig {
  ensureConfigDir();

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const loaded = JSON.parse(data) as Partial<BridgeConfig>;
      return { ...DEFAULT_CONFIG, ...loaded };
    } catch {
      console.warn('Failed to load config, using defaults');
      return DEFAULT_CONFIG;
    }
  }

  return DEFAULT_CONFIG;
}

/**
 * Save configuration to disk
 */
export function saveConfig(config: BridgeConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Generate a new authentication token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Add a directory to allowed directories
 */
export function addAllowedDirectory(dir: string): BridgeConfig {
  const config = loadConfig();
  const absolutePath = path.resolve(dir);

  if (!config.allowedDirectories.includes(absolutePath)) {
    config.allowedDirectories.push(absolutePath);
    saveConfig(config);
  }

  return config;
}

/**
 * Remove a directory from allowed directories
 */
export function removeAllowedDirectory(dir: string): BridgeConfig {
  const config = loadConfig();
  const absolutePath = path.resolve(dir);

  config.allowedDirectories = config.allowedDirectories.filter(
    (d) => d !== absolutePath
  );
  saveConfig(config);

  return config;
}

/**
 * Check if a path is within allowed directories
 */
export function isPathAllowed(filePath: string, config: BridgeConfig): boolean {
  const absolutePath = path.resolve(filePath);

  return config.allowedDirectories.some((dir) => {
    const absoluteDir = path.resolve(dir);
    return absolutePath.startsWith(absoluteDir);
  });
}

/**
 * Load saved projects
 */
export function loadProjects(): ProjectConfig[] {
  ensureConfigDir();

  if (fs.existsSync(PROJECTS_FILE)) {
    try {
      const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      return JSON.parse(data) as ProjectConfig[];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Save projects list
 */
export function saveProjects(projects: ProjectConfig[]): void {
  ensureConfigDir();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

/**
 * Add or update a project
 */
export function addProject(project: ProjectConfig): void {
  const projects = loadProjects();
  const existing = projects.findIndex((p) => p.path === project.path);

  if (existing >= 0) {
    projects[existing] = { ...projects[existing], ...project, lastOpened: new Date().toISOString() };
  } else {
    projects.push({ ...project, lastOpened: new Date().toISOString() });
  }

  saveProjects(projects);
}
