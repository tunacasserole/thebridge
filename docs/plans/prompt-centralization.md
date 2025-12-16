# Plan: Centralized Prompt Management

## Overview

Reorganize prompts from inline strings scattered across code files into a dedicated `lib/prompts/` directory. Each prompt becomes its own TypeScript file exporting a string or function. No frameworks, no JSON, no runtime loading—just organized TypeScript.

## Goals

1. **Visibility**: Prompts visible in sidebar for users/developers to inspect
2. **Separation**: Clean separation between prompt content and application logic
3. **Maintainability**: Easier to find, edit, and version control prompts
4. **Type Safety**: Full TypeScript support with no runtime surprises

## Non-Goals

- No YAML/JSON prompt files
- No dynamic runtime loading
- No prompt management UI
- No A/B testing infrastructure (can add later if needed)

---

## Current State

### Files with Embedded Prompts

| File | Prompt | Lines | Purpose |
|------|--------|-------|---------|
| `app/api/chat/route.ts` | `SYSTEM_PROMPT` | ~100 | Main chat agent system instructions |
| `lib/agents/configs.ts` | 5 `systemPrompt` fields | ~30-60 each | Agent-specific personas |

### Current Structure
```
lib/
  agents/
    configs.ts          # AgentConfig[] with inline systemPrompt strings
app/
  api/
    chat/
      route.ts          # SYSTEM_PROMPT constant inline (~100 lines)
```

---

## Proposed Structure

```
lib/
  prompts/
    index.ts            # Re-exports all prompts for convenient imports
    system.ts           # Main SYSTEM_PROMPT (from chat/route.ts)
    agents/
      index.ts          # Re-exports all agent prompts
      general.ts        # General Assistant prompt
      ui-ux.ts          # UI/UX Designer prompt
      security.ts       # Security Analyst prompt
      incident.ts       # Incident Investigator prompt
      quota.ts          # Quota Manager prompt
```

---

## Implementation Steps

### Step 1: Create Prompt Directory Structure

Create the `lib/prompts/` directory and subdirectories.

**Files to create:**
- `lib/prompts/index.ts`
- `lib/prompts/system.ts`
- `lib/prompts/agents/index.ts`
- `lib/prompts/agents/general.ts`
- `lib/prompts/agents/ui-ux.ts`
- `lib/prompts/agents/security.ts`
- `lib/prompts/agents/incident.ts`
- `lib/prompts/agents/quota.ts`

### Step 2: Extract Main System Prompt

Move `SYSTEM_PROMPT` from `app/api/chat/route.ts` to `lib/prompts/system.ts`.

**Before (`app/api/chat/route.ts`):**
```typescript
const SYSTEM_PROMPT = `You are TheBridge Agent...`;
```

**After (`lib/prompts/system.ts`):**
```typescript
/**
 * Main system prompt for TheBridge Agent
 * Used by: app/api/chat/route.ts
 *
 * This prompt defines the core personality, capabilities, and formatting
 * rules for the main chat interface.
 */
export const SYSTEM_PROMPT = `You are TheBridge Agent...`;
```

**Update (`app/api/chat/route.ts`):**
```typescript
import { SYSTEM_PROMPT } from '@/lib/prompts/system';
```

### Step 3: Extract Agent Prompts

Move each `systemPrompt` field from `lib/agents/configs.ts` to individual files.

**Example - `lib/prompts/agents/ui-ux.ts`:**
```typescript
/**
 * UI/UX Designer Agent Prompt
 *
 * Expertise: Interface design, accessibility, React/Next.js, Tailwind CSS
 * Used by: lib/agents/configs.ts (ui-ux agent)
 */
export const UI_UX_PROMPT = `You are an expert UI/UX designer...`;
```

**Update `lib/agents/configs.ts`:**
```typescript
import {
  GENERAL_PROMPT,
  UI_UX_PROMPT,
  SECURITY_PROMPT,
  INCIDENT_PROMPT,
  QUOTA_PROMPT
} from '@/lib/prompts/agents';

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'ui-ux': {
    id: 'ui-ux',
    name: 'UI/UX Designer',
    // ... other fields
    systemPrompt: UI_UX_PROMPT,
  },
  // ...
};
```

### Step 4: Create Index Files for Clean Imports

**`lib/prompts/index.ts`:**
```typescript
// Main system prompt
export { SYSTEM_PROMPT } from './system';

// Agent prompts
export * from './agents';
```

**`lib/prompts/agents/index.ts`:**
```typescript
export { GENERAL_PROMPT } from './general';
export { UI_UX_PROMPT } from './ui-ux';
export { SECURITY_PROMPT } from './security';
export { INCIDENT_PROMPT } from './incident';
export { QUOTA_PROMPT } from './quota';
```

### Step 5: Add JSDoc Documentation

Each prompt file should have clear documentation:

```typescript
/**
 * @fileoverview Security Analyst Agent Prompt
 *
 * @description
 * Defines the persona for the Security Analyst agent, specializing in:
 * - Vulnerability assessment (OWASP Top 10)
 * - Threat modeling and risk analysis
 * - Secure coding practices
 * - Infrastructure and Kubernetes security
 *
 * @usage
 * Used by lib/agents/configs.ts for the 'security' agent configuration.
 *
 * @see {@link lib/agents/configs.ts}
 */
export const SECURITY_PROMPT = `...`;
```

### Step 6: Update Imports in Consuming Files

| File | Change |
|------|--------|
| `app/api/chat/route.ts` | Import `SYSTEM_PROMPT` from `@/lib/prompts` |
| `lib/agents/configs.ts` | Import all agent prompts from `@/lib/prompts/agents` |

### Step 7: Verify and Test

1. Run TypeScript compilation: `npx tsc --noEmit`
2. Run the dev server: `npm run dev`
3. Test main chat functionality
4. Test each agent panel
5. Verify no runtime errors in console

---

## File Contents Summary

### `lib/prompts/system.ts` (~100 lines)
- Main TheBridge Agent system prompt
- Response formatting rules
- Capability descriptions
- Tool documentation
- Integration descriptions (New Relic, Coralogix, Jira, etc.)

### `lib/prompts/agents/general.ts` (~15 lines)
- Multi-purpose assistant
- Basic tool usage guidance

### `lib/prompts/agents/ui-ux.ts` (~30 lines)
- UI/UX designer persona
- React/Next.js/Tailwind expertise
- Accessibility focus (WCAG)

### `lib/prompts/agents/security.ts` (~35 lines)
- Security analyst persona
- OWASP Top 10, threat modeling
- Severity classification

### `lib/prompts/agents/incident.ts` (~45 lines)
- SRE/Incident investigator persona
- Root cause analysis process
- Output format template

### `lib/prompts/agents/quota.ts` (~45 lines)
- Cost optimization specialist
- Quota monitoring process
- Output format template

---

## Benefits After Implementation

1. **Sidebar visibility**: All prompts visible under `lib/prompts/` in file explorer
2. **Cleaner route file**: `app/api/chat/route.ts` drops from ~850 to ~750 lines
3. **Cleaner configs**: `lib/agents/configs.ts` drops from ~208 to ~80 lines
4. **Single responsibility**: Prompt files contain only prompts + documentation
5. **Easy to find**: Developer asks "what does the security agent do?" → `lib/prompts/agents/security.ts`
6. **Git history**: Prompt changes are isolated commits, easy to review/revert

---

## Future Considerations (Not in Scope)

These are NOT part of this plan but could be added later:

- **Prompt composition**: Helper functions to build prompts from parts
- **Prompt validation**: Runtime checks for required sections
- **Prompt testing**: Unit tests for prompt structure
- **Dynamic prompts**: Functions that generate prompts based on context
- **Prompt versioning**: Multiple versions of same prompt for A/B testing

---

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| `route.ts` lines | ~852 | ~750 |
| `configs.ts` lines | ~208 | ~80 |
| Prompt files | 0 | 7 |
| Total prompt lines | ~270 (scattered) | ~270 (organized) |

**Net effect**: Same total lines, but organized for discoverability and maintainability.
