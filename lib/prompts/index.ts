/**
 * @fileoverview Prompts Index
 *
 * Central export point for all prompts used in TheBridge.
 * Provides convenient access to both the main system prompt
 * and all agent-specific prompts.
 *
 * @example
 * // Import main system prompt
 * import { SYSTEM_PROMPT } from '@/lib/prompts';
 *
 * // Import agent prompts
 * import { GENERAL_PROMPT, INCIDENT_PROMPT } from '@/lib/prompts';
 *
 * // Or import from agents subdirectory
 * import { GENERAL_PROMPT } from '@/lib/prompts/agents';
 */

// Main system prompt for TheBridge Agent
export { SYSTEM_PROMPT } from './system';

// Agent-specific prompts
export {
  GENERAL_PROMPT,
  INCIDENT_PROMPT,
  QUOTA_PROMPT,
} from './agents';
