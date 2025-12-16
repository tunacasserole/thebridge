/**
 * Lesson Content Generation API
 *
 * POST /api/lessons/generate
 * Generates lesson content using AI based on a name and prompt.
 */

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getUserApiKey } from '@/lib/auth';

// Get Anthropic client (creates per-request for user API key support)
async function getAnthropicClient(): Promise<Anthropic> {
  const user = await getAuthenticatedUser();

  if (user?.id) {
    // Try to get user's personal API key
    const userApiKey = await getUserApiKey(user.id);
    if (userApiKey) {
      return new Anthropic({ apiKey: userApiKey });
    }
  }

  // Fall back to server API key
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const LESSON_GENERATION_PROMPT = `You are an expert SRE educator creating content for "TheBridge", an AI-powered SRE command center training platform.

Your task is to generate a comprehensive, well-structured lesson in Markdown format based on the given topic and prompt.

Guidelines:
- Use clear, hierarchical headings (## for main sections, ### for subsections)
- Include practical examples and code snippets where relevant
- Use tables for structured information
- Include tips, warnings, and best practices in blockquotes
- Keep explanations clear and accessible
- Use bullet points and numbered lists for steps and key points
- Include real-world scenarios and use cases
- The content should be educational and actionable

Format the content so it renders beautifully in a web application using markdown.`;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { name, prompt } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Lesson name is required' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Lesson prompt is required' },
        { status: 400 }
      );
    }

    const anthropic = await getAnthropicClient();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: LESSON_GENERATION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Create a lesson titled "${name}".

Lesson requirements and focus:
${prompt}

Generate comprehensive, well-structured markdown content for this lesson. Start directly with the content (do not include the title as an H1 - it will be displayed separately).`,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text');
    const content = textContent?.type === 'text' ? textContent.text : '';

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate lesson content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('[Lessons API] Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson content' },
      { status: 500 }
    );
  }
}
