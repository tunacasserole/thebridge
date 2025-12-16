/**
 * Test script to debug chat API exit code 1 issue
 * Run with: npx tsx scripts/test-chat-api.ts
 */

async function testChatAPI() {
  const baseUrl = 'http://localhost:3000';

  console.log('🔍 Testing Chat API...\n');

  // Test 1: Simple message with NO MCP servers (minimal config)
  console.log('Test 1: Simple message with no MCP servers');
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, just say hi back.',
        conversationHistory: [],
        enabledTools: [], // No tools at all
        extendedThinking: false,
        effort: 'low',
        model: 'sonnet',
        verbose: false,
        files: []
      }),
    });

    console.log(`  Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  Error: ${errorText}`);
      return;
    }

    // Read streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      console.log('  No response body reader');
      return;
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    let events: string[] = [];

    console.log('  Reading stream...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;

      // Parse SSE events
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          events.push(data.type);

          if (data.type === 'text') {
            process.stdout.write(data.content);
          } else if (data.type === 'error') {
            console.log(`\n  ❌ Error event: ${data.message}`);
          } else if (data.type === 'done') {
            console.log(`\n  ✅ Done! Response length: ${data.response?.length || 0}`);
          }
        } catch (e) {
          // Ignore parse errors for heartbeat comments
        }
      }
    }

    console.log(`  Event types received: ${[...new Set(events)].join(', ')}`);

  } catch (error) {
    console.log(`  ❌ Fetch error: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n---\n');

  // Test 2: With Kubernetes MCP (most likely to be configured)
  console.log('Test 2: With Kubernetes MCP server');
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, just say hi back.',
        conversationHistory: [],
        enabledTools: ['kubernetes'], // Only k8s
        extendedThinking: false,
        effort: 'low',
        model: 'sonnet',
        verbose: false,
        files: []
      }),
    });

    console.log(`  Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  Error: ${errorText}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      console.log('  No response body reader');
      return;
    }

    const decoder = new TextDecoder();
    let events: string[] = [];

    console.log('  Reading stream...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          events.push(data.type);

          if (data.type === 'text') {
            process.stdout.write(data.content);
          } else if (data.type === 'error') {
            console.log(`\n  ❌ Error event: ${data.message}`);
          } else if (data.type === 'done') {
            console.log(`\n  ✅ Done!`);
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    console.log(`  Event types: ${[...new Set(events)].join(', ')}`);

  } catch (error) {
    console.log(`  ❌ Fetch error: ${error instanceof Error ? error.message : error}`);
  }
}

testChatAPI().catch(console.error);
