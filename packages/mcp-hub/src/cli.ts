#!/usr/bin/env node
/**
 * MCP Hub CLI
 *
 * Usage:
 *   npx @thebridge/mcp-hub start [--port 3001]
 *   npx @thebridge/mcp-hub list
 *   npx @thebridge/mcp-hub test <server>
 */

import { Command } from 'commander';
import { MCP_SERVERS } from './servers.js';

const program = new Command();

program
  .name('mcp-hub')
  .description('MCP Hub Server - stdio-to-SSE bridge for multiple MCP servers')
  .version('1.0.0');

program
  .command('start')
  .description('Start the MCP Hub server')
  .option('-p, --port <port>', 'Port to listen on', '3001')
  .action(async (options) => {
    process.env.PORT = options.port;
    // Dynamic import to start server
    await import('./index.js');
  });

program
  .command('list')
  .description('List all available MCP servers')
  .action(() => {
    console.log('\nAvailable MCP Servers:\n');
    console.log('┌─────────────────────┬────────────────────────────────────────────┐');
    console.log('│ Slug                │ Name                                       │');
    console.log('├─────────────────────┼────────────────────────────────────────────┤');

    for (const server of MCP_SERVERS) {
      const slug = server.slug.padEnd(19);
      const name = server.name.padEnd(42);
      console.log(`│ ${slug} │ ${name} │`);
    }

    console.log('└─────────────────────┴────────────────────────────────────────────┘');
    console.log(`\nTotal: ${MCP_SERVERS.length} servers\n`);
  });

program
  .command('env')
  .description('Show required environment variables for all servers')
  .action(() => {
    console.log('\nRequired Environment Variables:\n');

    for (const server of MCP_SERVERS) {
      const envVars = Object.keys(server.env);
      if (envVars.length > 0) {
        console.log(`${server.name} (${server.slug}):`);
        for (const env of envVars) {
          const value = process.env[env] ? '✓ Set' : '✗ Missing';
          console.log(`  ${env}: ${value}`);
        }
        console.log();
      }
    }
  });

program
  .command('test <server>')
  .description('Test connection to a specific MCP server')
  .action(async (serverSlug: string) => {
    const server = MCP_SERVERS.find((s) => s.slug === serverSlug);

    if (!server) {
      console.error(`Unknown server: ${serverSlug}`);
      console.log('\nAvailable servers:', MCP_SERVERS.map((s) => s.slug).join(', '));
      process.exit(1);
    }

    console.log(`\nTesting ${server.name}...`);

    // Check env vars
    const missingEnv = Object.entries(server.env)
      .filter(([key, defaultValue]) => !process.env[key] && !defaultValue)
      .map(([key]) => key);

    if (missingEnv.length > 0) {
      console.log('\n⚠️  Missing environment variables:');
      for (const env of missingEnv) {
        console.log(`   - ${env}`);
      }
      console.log('\nSet these variables and try again.');
      process.exit(1);
    }

    // Try to spawn and initialize
    const { ProcessManager } = await import('./process-manager.js');
    const manager = new ProcessManager({ requestTimeout: 10000 });

    try {
      console.log(`Spawning ${server.command} ${server.args.join(' ')}...`);
      await manager.getOrSpawn(server);

      console.log('Listing tools...');
      const response = await manager.listTools(serverSlug, server);

      if (response.error) {
        console.error('Error:', response.error);
        process.exit(1);
      }

      const tools = (response.result as { tools: Array<{ name: string; description?: string }> })?.tools || [];
      console.log(`\n✓ ${server.name} is working!`);
      console.log(`  Available tools: ${tools.length}`);

      if (tools.length > 0) {
        console.log('\n  Tools:');
        for (const tool of tools.slice(0, 10)) {
          console.log(`    - ${tool.name}`);
        }
        if (tools.length > 10) {
          console.log(`    ... and ${tools.length - 10} more`);
        }
      }
    } catch (error) {
      console.error('\n✗ Failed to connect:', error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      await manager.shutdown();
    }
  });

program.parse();
