// Main exports for @thebridge/local package
export { createServer } from './server.js';
export {
  loadConfig,
  saveConfig,
  addAllowedDirectory,
  removeAllowedDirectory,
  generateToken,
  loadProjects,
  saveProjects,
  addProject,
  DEFAULT_CONFIG,
} from './config.js';
export {
  validateFileAccess,
  validateCommand,
  validateOrigin,
  validateToken,
  isDangerousCommand,
  isForbiddenPath,
} from './security.js';
export * from './tools.js';
export * from './types.js';
