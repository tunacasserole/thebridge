/**
 * @fileoverview User Context for System Prompts
 *
 * @description
 * Builds user-specific context to inject into system prompts.
 * This includes user preferences for integrations like New Relic,
 * Coralogix, etc.
 *
 * @usage
 * Used by app/api/chat/route.ts to add user context to prompts.
 */

import { prisma } from '@/lib/db';

export interface NewRelicContext {
  accountId?: number;
  accountName?: string;
  entityGuid?: string;
  entityName?: string;
  entityDomain?: string;
  categories?: string[];
}

export interface UserIntegrationContext {
  newrelic?: NewRelicContext;
}

/**
 * Fetch user's New Relic preferences from database
 */
export async function getUserNewRelicContext(userId: string): Promise<NewRelicContext | null> {
  try {
    // Fetch account and entity preferences
    const [accountPref, entityPref, mcpConfig] = await Promise.all([
      prisma.userPreference.findUnique({
        where: { userId_key: { userId, key: 'newrelic_account' } },
      }),
      prisma.userPreference.findUnique({
        where: { userId_key: { userId, key: 'newrelic_entity' } },
      }),
      prisma.userMCPConfig.findFirst({
        where: {
          userId,
          isEnabled: true,
          server: { slug: 'newrelic' },
        },
      }),
    ]);

    const context: NewRelicContext = {};

    // Parse account preference
    if (accountPref?.value) {
      try {
        const account = JSON.parse(accountPref.value);
        context.accountId = account.id;
        context.accountName = account.name;
      } catch (e) {
        console.error('[UserContext] Failed to parse New Relic account:', e);
      }
    }

    // Parse entity preference
    if (entityPref?.value) {
      try {
        const entity = JSON.parse(entityPref.value);
        context.entityGuid = entity.guid;
        context.entityName = entity.name;
        context.entityDomain = entity.domain;
      } catch (e) {
        console.error('[UserContext] Failed to parse New Relic entity:', e);
      }
    }

    // Parse MCP config for categories
    if (mcpConfig?.config) {
      try {
        const config = JSON.parse(mcpConfig.config);
        if (config.categories && Array.isArray(config.categories)) {
          context.categories = config.categories;
        }
      } catch (e) {
        console.error('[UserContext] Failed to parse New Relic MCP config:', e);
      }
    }

    // Return null if no context found
    if (Object.keys(context).length === 0) {
      return null;
    }

    return context;
  } catch (error) {
    console.error('[UserContext] Failed to fetch New Relic context:', error);
    return null;
  }
}

/**
 * Fetch all user integration context
 */
export async function getUserIntegrationContext(userId: string): Promise<UserIntegrationContext> {
  const context: UserIntegrationContext = {};

  const newrelicContext = await getUserNewRelicContext(userId);
  if (newrelicContext) {
    context.newrelic = newrelicContext;
  }

  return context;
}

/**
 * Build a context string to append to the system prompt
 */
export function buildContextPrompt(context: UserIntegrationContext): string {
  const sections: string[] = [];

  if (context.newrelic) {
    const nr = context.newrelic;
    const lines: string[] = [];

    lines.push('**User\'s New Relic Configuration:**');

    if (nr.accountId) {
      lines.push(`- **Account**: ${nr.accountName || 'Unknown'} (ID: ${nr.accountId})`);
      lines.push(`  - IMPORTANT: When making New Relic API calls, ALWAYS use account_id=${nr.accountId}`);
    }

    if (nr.entityGuid) {
      lines.push(`- **Selected Entity**: ${nr.entityName || 'Unknown'} (${nr.entityDomain || 'Unknown'})`);
      lines.push(`  - Entity GUID: ${nr.entityGuid}`);
      lines.push(`  - When the user asks about "the app" or "the service" without specifying, use this entity`);
    }

    if (nr.categories && nr.categories.length > 0) {
      lines.push(`- **Enabled Tool Categories**: ${nr.categories.join(', ')}`);
      lines.push(`  - Focus your New Relic queries on these areas unless the user asks otherwise`);
    }

    // Add announcement requirement
    lines.push('');
    lines.push('**IMPORTANT - Before calling any New Relic MCP tool:**');
    lines.push('You MUST first announce to the user what you are about to do. Include:');
    lines.push('1. The Account ID you will use');
    lines.push('2. The Entity name (if applicable)');
    lines.push('3. The specific tool(s) you will call');
    lines.push('4. If running an NRQL query, show the query');
    lines.push('');
    lines.push('Example announcement:');
    lines.push('> "I\'m about to query New Relic using account **' + (nr.accountName || nr.accountId || 'your account') + '** (ID: ' + (nr.accountId || 'N/A') + ')' + (nr.entityName ? ` for entity **${nr.entityName}**` : '') + '. I\'ll use the `execute_nrql_query` tool with the following NRQL: `SELECT count(*) FROM Transaction`"');

    if (lines.length > 1) {
      sections.push(lines.join('\n'));
    }
  }

  if (sections.length === 0) {
    return '';
  }

  return `\n\n## USER INTEGRATION CONTEXT\n\n${sections.join('\n\n')}`;
}
