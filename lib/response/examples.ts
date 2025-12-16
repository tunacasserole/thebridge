/**
 * Response Optimization Usage Examples
 *
 * This file demonstrates how to use the response optimization system
 * in TheBridge applications.
 */

import {
  getResponseLengthConfig,
  getTemplateInstruction,
  compressResponse,
  autoCompress,
  type ResponseProfile,
} from './index';

// Example 1: Simple query optimization
export function exampleSimpleQuery() {
  const message = 'Is service X healthy?';

  const config = getResponseLengthConfig({
    message,
    conversationLength: 5,
    hasFiles: false,
    toolsEnabled: false,
  });

  console.log('Simple Query Example:');
  console.log('Query:', message);
  console.log('Profile:', config.profile); // 'concise'
  console.log('Max Tokens:', config.maxTokens); // ~256-512
  console.log('Thinking Budget:', config.thinkingBudget); // ~2000
  console.log('Estimated Complexity:', config.analysis.estimatedComplexity); // ~0.1

  return config;
}

// Example 2: Complex query optimization
export function exampleComplexQuery() {
  const message = 'Analyze the performance degradation across all services';

  const config = getResponseLengthConfig({
    message,
    conversationLength: 3,
    hasFiles: true,
    toolsEnabled: true,
  });

  console.log('\nComplex Query Example:');
  console.log('Query:', message);
  console.log('Profile:', config.profile); // 'detailed'
  console.log('Max Tokens:', config.maxTokens); // ~6000-8000
  console.log('Thinking Budget:', config.thinkingBudget); // ~10000
  console.log('Estimated Complexity:', config.analysis.estimatedComplexity); // ~0.7-0.9

  return config;
}

// Example 3: Using with API call
export function exampleAPIIntegration() {
  const message = 'List all active alerts';
  const conversationHistory = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi! How can I help?' },
  ];

  // Get optimized configuration
  const lengthConfig = getResponseLengthConfig({
    message,
    conversationLength: conversationHistory.length,
    hasFiles: false,
    toolsEnabled: true,
  });

  // Get template instruction
  const templateInstruction = getTemplateInstruction(message);

  // Build enhanced system prompt
  const enhancedSystemPrompt = `You are a helpful SRE assistant.

Response Guidelines:
${templateInstruction}

Be concise and direct. Avoid unnecessary preambles or verbose explanations.`;

  console.log('\nAPI Integration Example:');
  console.log('Enhanced System Prompt:', enhancedSystemPrompt);
  console.log('Max Tokens:', lengthConfig.maxTokens);
  console.log('Thinking Budget:', lengthConfig.thinkingBudget);

  // This would be used in the actual API call:
  const apiConfig = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: lengthConfig.maxTokens,
    system: enhancedSystemPrompt,
    messages: conversationHistory,
    thinking: {
      type: 'enabled' as const,
      budget_tokens: lengthConfig.thinkingBudget,
    },
  };

  return apiConfig;
}

// Example 4: Response compression
export function exampleCompression() {
  const verboseResponse = `I'll help you with that. Based on your request, I understand that you want to check the status of the service. Let me analyze that for you.

The service is currently running in a healthy state. As you can see, all metrics are within normal ranges. The system is operating efficiently with no errors detected.

It's important to note that there were no errors in the last 24 hours. Performance metrics are all within acceptable thresholds. Everything looks good from my analysis.

I hope this helps! Feel free to ask if you have any questions about the status. Let me know if you need anything else or if you'd like me to investigate further.`;

  // Manual compression
  const lightResult = compressResponse(verboseResponse, 'light');
  const moderateResult = compressResponse(verboseResponse, 'moderate');
  const aggressiveResult = compressResponse(verboseResponse, 'aggressive');

  console.log('\nCompression Example:');
  console.log('Original Length:', verboseResponse.length, 'chars');
  console.log('\nLight Compression:');
  console.log('  Length:', lightResult.compressedLength);
  console.log('  Ratio:', (lightResult.compressionRatio * 100).toFixed(1) + '%');
  console.log('  Tokens Saved:', lightResult.tokensRemoved);
  console.log('  Text:', lightResult.compressed);

  console.log('\nModerate Compression:');
  console.log('  Length:', moderateResult.compressedLength);
  console.log('  Ratio:', (moderateResult.compressionRatio * 100).toFixed(1) + '%');
  console.log('  Tokens Saved:', moderateResult.tokensRemoved);
  console.log('  Text:', moderateResult.compressed);

  console.log('\nAggressive Compression:');
  console.log('  Length:', aggressiveResult.compressedLength);
  console.log('  Ratio:', (aggressiveResult.compressionRatio * 100).toFixed(1) + '%');
  console.log('  Tokens Saved:', aggressiveResult.tokensRemoved);
  console.log('  Text:', aggressiveResult.compressed);

  // Auto compression
  const autoResult = autoCompress(verboseResponse);
  console.log('\nAuto Compression:');
  console.log('  Selected mode based on length');
  console.log('  Ratio:', (autoResult.compressionRatio * 100).toFixed(1) + '%');

  return { lightResult, moderateResult, aggressiveResult, autoResult };
}

// Example 5: Using explicit response profiles
export function exampleResponseProfiles() {
  const message = 'Analyze the system architecture';

  const profiles: ResponseProfile[] = ['concise', 'standard', 'detailed'];

  console.log('\nResponse Profiles Example:');
  console.log('Query:', message);

  profiles.forEach((profile) => {
    const config = getResponseLengthConfig({
      message,
      profile,
      conversationLength: 5,
      hasFiles: false,
      toolsEnabled: false,
    });

    console.log(`\n${profile.toUpperCase()} Profile:`);
    console.log('  Max Tokens:', config.maxTokens);
    console.log('  Thinking Budget:', config.thinkingBudget);
  });
}

// Example 6: Context-aware optimization
export function exampleContextAware() {
  const message = 'List all services';

  // Short conversation
  const shortConv = getResponseLengthConfig({
    message,
    conversationLength: 2,
    hasFiles: false,
    toolsEnabled: false,
  });

  // Long conversation
  const longConv = getResponseLengthConfig({
    message,
    conversationLength: 25,
    hasFiles: false,
    toolsEnabled: false,
  });

  // With files
  const withFiles = getResponseLengthConfig({
    message,
    conversationLength: 5,
    hasFiles: true,
    toolsEnabled: false,
  });

  // With tools
  const withTools = getResponseLengthConfig({
    message,
    conversationLength: 5,
    hasFiles: false,
    toolsEnabled: true,
  });

  console.log('\nContext-Aware Example:');
  console.log('Query:', message);
  console.log('\nShort Conversation (2 msgs):', shortConv.maxTokens, 'tokens');
  console.log('Long Conversation (25 msgs):', longConv.maxTokens, 'tokens');
  console.log('With Files:', withFiles.maxTokens, 'tokens');
  console.log('With Tools:', withTools.maxTokens, 'tokens');

  return { shortConv, longConv, withFiles, withTools };
}

// Run all examples
export function runAllExamples() {
  console.log('=== Response Optimization Examples ===\n');

  exampleSimpleQuery();
  exampleComplexQuery();
  exampleAPIIntegration();
  exampleCompression();
  exampleResponseProfiles();
  exampleContextAware();

  console.log('\n=== Examples Complete ===');
}

// Uncomment to run examples
// runAllExamples();
