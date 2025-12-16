/**
 * Test script to discover available Coralogix MCP tools
 * Run with: npx tsx scripts/test-coralogix-mcp.ts
 */

import { loadMCPTools } from '../lib/mcp/client';

async function main() {
  console.log('Loading Coralogix MCP tools...\n');

  const { tools, serverNames, failedServers } = await loadMCPTools(['coralogix']);

  console.log('Connected servers:', serverNames);
  console.log('Failed servers:', failedServers);
  console.log('\nAvailable Coralogix tools:');
  console.log('='.repeat(50));

  tools.forEach((tool, index) => {
    console.log(`\n${index + 1}. ${tool.name}`);
    console.log(`   Description: ${tool.description}`);
    console.log(`   Input schema:`, JSON.stringify(tool.input_schema, null, 2));
  });

  console.log('\n' + '='.repeat(50));
  console.log(`\nTotal tools found: ${tools.length}`);
}

main().catch(console.error);
