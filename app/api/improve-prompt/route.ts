import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const IMPROVE_PROMPT_SYSTEM = `You are an expert at writing system prompts for AI agents. Your task is to improve the given system prompt to make it more effective.

Guidelines for improvement:
1. Make the prompt clearer and more specific about the agent's role and capabilities
2. Add structure with sections if the prompt is long (e.g., Role, Capabilities, Guidelines, Constraints)
3. Include specific examples or scenarios when helpful
4. Add tone and style guidance if not present
5. Ensure the prompt defines boundaries and limitations
6. Make instructions actionable and unambiguous
7. Keep the core intent but enhance clarity and effectiveness

Return ONLY the improved prompt text, no explanations or commentary.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, agentName, agentDescription } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt text is required' },
        { status: 400 }
      );
    }

    // Build context about the agent if available
    let userMessage = `Please improve this system prompt:\n\n${prompt}`;

    if (agentName || agentDescription) {
      userMessage = `Context about the agent:\n- Name: ${agentName || 'Not specified'}\n- Description: ${agentDescription || 'Not specified'}\n\nPlease improve this system prompt:\n\n${prompt}`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: IMPROVE_PROMPT_SYSTEM,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text from the response
    const improvedPrompt = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return NextResponse.json({ improvedPrompt });
  } catch (error) {
    console.error('Error improving prompt:', error);
    return NextResponse.json(
      { error: 'Failed to improve prompt' },
      { status: 500 }
    );
  }
}
