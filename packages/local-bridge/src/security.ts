import type { BridgeConfig } from './types.js';
import { isPathAllowed } from './config.js';

/**
 * Commands that are considered dangerous and require extra confirmation
 */
const DANGEROUS_PATTERNS = [
  /rm\s+(-rf?|--recursive)/i,
  /rmdir/i,
  /sudo/i,
  /chmod\s+777/i,
  /chown/i,
  /mkfs/i,
  /dd\s+if=/i,
  />\s*\/dev\//i,
  /curl.*\|\s*(bash|sh)/i,
  /wget.*\|\s*(bash|sh)/i,
  /eval\s*\(/i,
  /npm\s+publish/i,
  /git\s+push\s+--force/i,
  /git\s+reset\s+--hard/i,
];

/**
 * File patterns that should never be accessed
 */
const FORBIDDEN_PATHS = [
  /\.ssh\//i,
  /\.gnupg\//i,
  /\.aws\/credentials/i,
  /\.env\.local$/i,
  /\.env\.production$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.pem$/i,
  /\.key$/i,
  /password/i,
  /secret/i,
  /credentials\.json/i,
];

/**
 * Check if a command is potentially dangerous
 */
export function isDangerousCommand(command: string): { dangerous: boolean; reason?: string } {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return {
        dangerous: true,
        reason: `Command matches dangerous pattern: ${pattern.source}`,
      };
    }
  }
  return { dangerous: false };
}

/**
 * Check if a file path is forbidden
 */
export function isForbiddenPath(filePath: string): { forbidden: boolean; reason?: string } {
  for (const pattern of FORBIDDEN_PATHS) {
    if (pattern.test(filePath)) {
      return {
        forbidden: true,
        reason: `Path matches forbidden pattern: ${pattern.source}`,
      };
    }
  }
  return { forbidden: false };
}

/**
 * Validate a file operation
 */
export function validateFileAccess(
  filePath: string,
  config: BridgeConfig,
  operation: 'read' | 'write' | 'delete'
): { allowed: boolean; reason?: string } {
  // Check forbidden paths
  const forbidden = isForbiddenPath(filePath);
  if (forbidden.forbidden) {
    return { allowed: false, reason: forbidden.reason };
  }

  // Check allowed directories
  if (!isPathAllowed(filePath, config)) {
    return {
      allowed: false,
      reason: `Path is not within allowed directories. Allowed: ${config.allowedDirectories.join(', ')}`,
    };
  }

  // Write and delete operations have stricter checks
  if (operation === 'write' || operation === 'delete') {
    // Don't allow writing to sensitive config files
    if (/\.(env|pem|key|crt|p12|pfx)$/i.test(filePath)) {
      return {
        allowed: false,
        reason: 'Cannot modify sensitive configuration files',
      };
    }
  }

  return { allowed: true };
}

/**
 * Validate command execution
 */
export function validateCommand(
  command: string,
  cwd: string,
  config: BridgeConfig
): { allowed: boolean; reason?: string; requiresConfirmation?: boolean } {
  // Check if cwd is allowed
  if (!isPathAllowed(cwd, config)) {
    return {
      allowed: false,
      reason: `Working directory is not within allowed directories`,
    };
  }

  // Check for dangerous commands
  const dangerous = isDangerousCommand(command);
  if (dangerous.dangerous) {
    return {
      allowed: true,
      requiresConfirmation: true,
      reason: dangerous.reason,
    };
  }

  return { allowed: true };
}

/**
 * Validate WebSocket origin
 */
export function validateOrigin(origin: string | undefined, config: BridgeConfig): boolean {
  if (!origin) return false;

  return config.allowedOrigins.some((allowed) => {
    if (allowed.includes('*')) {
      // Convert wildcard pattern to regex
      const pattern = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
      return pattern.test(origin);
    }
    return origin === allowed;
  });
}

/**
 * Validate authentication token
 */
export function validateToken(token: string | undefined, config: BridgeConfig): boolean {
  if (!config.requireToken) return true;
  if (!config.token) return false;
  return token === config.token;
}
