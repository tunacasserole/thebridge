#!/usr/bin/env node
import { Command } from 'commander';
import { createServer } from './server.js';
import {
  loadConfig,
  saveConfig,
  addAllowedDirectory,
  removeAllowedDirectory,
  generateToken,
  loadProjects,
  DEFAULT_CONFIG,
} from './config.js';

const program = new Command();

program
  .name('thebridge-local')
  .description('Local bridge server for TheBridge - enables local coding capabilities')
  .version('0.1.0');

program
  .command('start')
  .description('Start the local bridge server')
  .option('-p, --port <port>', 'Port to listen on', '3001')
  .action(async (options) => {
    const config = loadConfig();
    config.port = parseInt(options.port, 10) || config.port;

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   TheBridge Local Bridge                      ║
╠═══════════════════════════════════════════════════════════════╣
║  Status: Starting...                                          ║
║  Port: ${config.port.toString().padEnd(54)}║
║  Allowed Origins:                                             ║
${config.allowedOrigins.map((o) => `║    - ${o.padEnd(54)}║`).join('\n')}
║                                                               ║
║  Allowed Directories:                                         ║
${config.allowedDirectories.map((d) => `║    - ${d.padEnd(54)}║`).join('\n')}
╚═══════════════════════════════════════════════════════════════╝
`);

    const server = createServer(config);

    server.on('listening', () => {
      console.log(`✅ Server running on ws://localhost:${config.port}`);
      console.log(`\n📝 Connect from TheBridge at https://thebridge.vercel.app`);
      console.log(`   or http://localhost:3000\n`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nShutting down...');
      server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
      });
    });
  });

program
  .command('setup')
  .description('Interactive setup for the local bridge')
  .action(async () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              TheBridge Local Bridge Setup                     ║
╚═══════════════════════════════════════════════════════════════╝
`);

    const config = loadConfig();

    // For now, just save default config and show instructions
    saveConfig(config);

    console.log('✅ Configuration saved to ~/.thebridge/config.json');
    console.log(`
Default allowed directories:
${config.allowedDirectories.map((d) => `  - ${d}`).join('\n')}

To add more directories, run:
  thebridge-local allow ~/your-projects

To start the server:
  thebridge-local start

The server will be accessible from:
  - https://thebridge.vercel.app
  - http://localhost:3000
`);
  });

program
  .command('allow <directory>')
  .description('Add a directory to the allowed list')
  .action(async (directory) => {
    const config = addAllowedDirectory(directory);
    console.log(`✅ Added ${directory} to allowed directories.`);
    console.log(`\nAllowed directories:`);
    config.allowedDirectories.forEach((d) => console.log(`  - ${d}`));
  });

program
  .command('disallow <directory>')
  .description('Remove a directory from the allowed list')
  .action(async (directory) => {
    const config = removeAllowedDirectory(directory);
    console.log(`✅ Removed ${directory} from allowed directories.`);
    console.log(`\nAllowed directories:`);
    config.allowedDirectories.forEach((d) => console.log(`  - ${d}`));
  });

program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    const config = loadConfig();
    console.log(JSON.stringify(config, null, 2));
  });

program
  .command('projects')
  .description('List saved projects')
  .action(async () => {
    const projects = loadProjects();
    if (projects.length === 0) {
      console.log('No saved projects.');
    } else {
      console.log('Saved projects:\n');
      projects.forEach((p) => {
        console.log(`  ${p.name}`);
        console.log(`    Path: ${p.path}`);
        if (p.lastOpened) {
          console.log(`    Last opened: ${new Date(p.lastOpened).toLocaleString()}`);
        }
        console.log('');
      });
    }
  });

program
  .command('token')
  .description('Generate a new authentication token')
  .action(async () => {
    const config = loadConfig();
    config.token = generateToken();
    config.requireToken = true;
    saveConfig(config);

    console.log('✅ New token generated and saved.');
    console.log(`\nToken: ${config.token}`);
    console.log(`\nAdd this token to TheBridge settings to connect securely.`);
  });

program
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    saveConfig(DEFAULT_CONFIG);
    console.log('✅ Configuration reset to defaults.');
  });

program.parse();
