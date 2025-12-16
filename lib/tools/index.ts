/**
 * Tools Module
 *
 * ALL tools come from MCP servers dynamically.
 * No hardcoded tools - users control which MCPs are enabled via the UI.
 */

// MCP dynamic tools - the only source of tools
export {
  loadMCPTools,
  executeMCPTool,
  closeMCPConnections,
  getConnectedServers,
  getAvailableMCPServers,
} from '../mcp/client';
