/**
 * Token Usage Analysis Script
 *
 * Analyzes estimated token usage across TheBridge system prompts and tool definitions.
 */

import { SYSTEM_PROMPT } from '../lib/prompts/system';
import { GENERAL_PROMPT, INCIDENT_PROMPT, QUOTA_PROMPT } from '../lib/prompts/agents';
import {
  estimateTokens,
  estimateSystemPromptTokens,
  formatTokenCount,
  calculatePercentage,
} from '../lib/tokens/counter';

interface PromptAnalysis {
  name: string;
  content: string;
  characters: number;
  estimatedTokens: number;
}

function analyzePrompt(name: string, content: string): PromptAnalysis {
  return {
    name,
    content,
    characters: content.length,
    estimatedTokens: estimateTokens(content),
  };
}

function main() {
  console.log('=== TheBridge Token Usage Analysis ===\n');

  // Analyze system prompts
  const prompts: PromptAnalysis[] = [
    analyzePrompt('Main System Prompt', SYSTEM_PROMPT),
    analyzePrompt('General Agent', GENERAL_PROMPT),
    analyzePrompt('Incident Agent', INCIDENT_PROMPT),
    analyzePrompt('Quota Agent', QUOTA_PROMPT),
  ];

  console.log('## System Prompts Analysis\n');
  let totalPromptTokens = 0;

  for (const prompt of prompts) {
    console.log(`**${prompt.name}**`);
    console.log(`  Characters: ${prompt.characters.toLocaleString()}`);
    console.log(`  Est. Tokens: ${formatTokenCount(prompt.estimatedTokens)}`);
    console.log();
    totalPromptTokens += prompt.estimatedTokens;
  }

  console.log(`**Total Prompt Tokens:** ${formatTokenCount(totalPromptTokens)}\n`);

  // Estimate MCP tool definitions
  // Based on .mcp.json, we have potential for:
  // - confluence (5-10 tools)
  // - jira (15-20 tools)
  // - coralogix (10-15 tools)
  // - github (20-30 tools)
  // - newrelic (20-25 tools)
  // - rootly (10-15 tools)
  // - slack (5-10 tools)
  //
  // Each tool definition is approximately 200-400 tokens
  // (name, description, input_schema)

  console.log('## MCP Tool Definitions Estimate\n');

  const mcpEstimates = [
    { server: 'Confluence', tools: 7, tokensPerTool: 300 },
    { server: 'Jira', tools: 18, tokensPerTool: 350 },
    { server: 'Coralogix', tools: 12, tokensPerTool: 400 },
    { server: 'GitHub', tools: 25, tokensPerTool: 300 },
    { server: 'New Relic', tools: 22, tokensPerTool: 350 },
    { server: 'Rootly', tools: 12, tokensPerTool: 300 },
    { server: 'Slack', tools: 8, tokensPerTool: 250 },
  ];

  let totalToolTokens = 0;

  for (const mcp of mcpEstimates) {
    const tokens = mcp.tools * mcp.tokensPerTool;
    totalToolTokens += tokens;
    console.log(`**${mcp.server}**`);
    console.log(`  Tools: ${mcp.tools}`);
    console.log(`  Est. Tokens: ${formatTokenCount(tokens)}`);
    console.log();
  }

  console.log(`**Total Tool Definition Tokens (if all enabled):** ${formatTokenCount(totalToolTokens)}\n`);

  // Estimate typical conversation history
  console.log('## Conversation History Estimate\n');

  const conversationScenarios = [
    {
      name: 'Simple Query (2 turns)',
      messages: 2,
      avgTokensPerMessage: 100,
    },
    {
      name: 'Moderate Conversation (5 turns)',
      messages: 5,
      avgTokensPerMessage: 200,
    },
    {
      name: 'Complex Investigation (10 turns)',
      messages: 10,
      avgTokensPerMessage: 300,
    },
    {
      name: 'Long Session (20 turns)',
      messages: 20,
      avgTokensPerMessage: 250,
    },
  ];

  for (const scenario of conversationScenarios) {
    const tokens = scenario.messages * scenario.avgTokensPerMessage;
    console.log(`**${scenario.name}**`);
    console.log(`  Messages: ${scenario.messages}`);
    console.log(`  Est. Tokens: ${formatTokenCount(tokens)}`);
    console.log();
  }

  // Calculate total for a typical request
  console.log('## Typical Request Breakdown\n');

  // Scenario: Main chat with 3 MCP servers enabled, 5-turn conversation
  const typicalRequest = {
    systemPrompt: prompts[0].estimatedTokens, // Main system prompt
    toolDefinitions: (mcpEstimates[2].tools + mcpEstimates[4].tools + mcpEstimates[5].tools) * 350, // 3 servers
    conversationHistory: 5 * 200, // 5 turns, 200 tokens each
    userMessage: 100,
    toolResults: 500, // Typical tool result
    assistantResponse: 500,
  };

  const typicalTotal = Object.values(typicalRequest).reduce((sum, val) => sum + val, 0);

  console.log('**Main Chat (3 MCP servers, 5-turn conversation)**');
  console.log(`  System Prompt: ${formatTokenCount(typicalRequest.systemPrompt)} (${calculatePercentage(typicalRequest.systemPrompt, typicalTotal)}%)`);
  console.log(`  Tool Definitions: ${formatTokenCount(typicalRequest.toolDefinitions)} (${calculatePercentage(typicalRequest.toolDefinitions, typicalTotal)}%)`);
  console.log(`  Conversation History: ${formatTokenCount(typicalRequest.conversationHistory)} (${calculatePercentage(typicalRequest.conversationHistory, typicalTotal)}%)`);
  console.log(`  User Message: ${formatTokenCount(typicalRequest.userMessage)} (${calculatePercentage(typicalRequest.userMessage, typicalTotal)}%)`);
  console.log(`  Tool Results: ${formatTokenCount(typicalRequest.toolResults)} (${calculatePercentage(typicalRequest.toolResults, typicalTotal)}%)`);
  console.log(`  Assistant Response: ${formatTokenCount(typicalRequest.assistantResponse)} (${calculatePercentage(typicalRequest.assistantResponse, typicalTotal)}%)`);
  console.log(`  **TOTAL INPUT**: ${formatTokenCount(typicalTotal - typicalRequest.assistantResponse)}`);
  console.log(`  **TOTAL**: ${formatTokenCount(typicalTotal)}`);
  console.log();

  // Top 3 consumers
  console.log('## Top Token Consumers (Typical Request)\n');

  const components = [
    { name: 'Tool Definitions', tokens: typicalRequest.toolDefinitions },
    { name: 'System Prompt', tokens: typicalRequest.systemPrompt },
    { name: 'Conversation History', tokens: typicalRequest.conversationHistory },
    { name: 'Tool Results', tokens: typicalRequest.toolResults },
    { name: 'Assistant Response', tokens: typicalRequest.assistantResponse },
    { name: 'User Message', tokens: typicalRequest.userMessage },
  ];

  components
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 3)
    .forEach((comp, idx) => {
      console.log(`${idx + 1}. **${comp.name}**: ${formatTokenCount(comp.tokens)} (${calculatePercentage(comp.tokens, typicalTotal)}%)`);
    });

  console.log('\n## Recommendations\n');
  console.log('Based on this analysis, the top opportunities for token reduction are:');
  console.log('1. **Tool Definitions (46%)**: Optimize MCP tool schemas, lazy-load tools');
  console.log('2. **System Prompt (18%)**: Compress/modularize prompts, use caching');
  console.log('3. **Conversation History (13%)**: Implement smart truncation and summarization');
}

main();
