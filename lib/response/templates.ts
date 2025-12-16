/**
 * Response Templates
 *
 * Defines standard response formats and structured output schemas.
 * Uses Zod schemas to constrain response structure and reduce token usage.
 */

import { z } from 'zod';

/**
 * Standard response templates for common query types
 */
export const RESPONSE_TEMPLATES = {
  status_check: {
    format: `Status: [status]
Details: [brief details]
Action Required: [yes/no]`,
    maxTokens: 512,
  },

  error_analysis: {
    format: `Error: [error message]
Cause: [root cause]
Solution: [fix steps]
Prevention: [how to prevent]`,
    maxTokens: 2048,
  },

  list_items: {
    format: `Total: [count]

[Items listed in structured format]

Summary: [brief summary]`,
    maxTokens: 1024,
  },

  yes_no: {
    format: `Answer: [Yes/No]
Reason: [brief explanation]`,
    maxTokens: 256,
  },

  metric_analysis: {
    format: `Metric: [metric name]
Current Value: [value]
Trend: [up/down/stable]
Status: [normal/warning/critical]
Recommendation: [action if needed]`,
    maxTokens: 1024,
  },

  troubleshooting: {
    format: `Issue: [problem description]
Investigation Steps:
1. [step 1]
2. [step 2]
...

Findings: [what was found]
Root Cause: [identified cause]
Resolution: [solution steps]`,
    maxTokens: 4096,
  },
};

/**
 * Zod schemas for structured responses
 */

// Status Check Schema
export const StatusCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'down', 'unknown']),
  details: z.string().max(500),
  actionRequired: z.boolean(),
  recommendation: z.string().max(200).optional(),
});

export type StatusCheckResponse = z.infer<typeof StatusCheckSchema>;

// Error Analysis Schema
export const ErrorAnalysisSchema = z.object({
  error: z.string().max(300),
  cause: z.string().max(500),
  solution: z.array(z.string().max(200)),
  prevention: z.string().max(300).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

export type ErrorAnalysisResponse = z.infer<typeof ErrorAnalysisSchema>;

// List Items Schema
export const ListItemsSchema = z.object({
  total: z.number(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.string().optional(),
  })).max(50), // Limit list size
  summary: z.string().max(200),
});

export type ListItemsResponse = z.infer<typeof ListItemsSchema>;

// Yes/No Schema
export const YesNoSchema = z.object({
  answer: z.boolean(),
  reason: z.string().max(200),
  confidence: z.number().min(0).max(1).optional(),
});

export type YesNoResponse = z.infer<typeof YesNoSchema>;

// Metric Analysis Schema
export const MetricAnalysisSchema = z.object({
  metric: z.string(),
  currentValue: z.union([z.string(), z.number()]),
  trend: z.enum(['up', 'down', 'stable']),
  status: z.enum(['normal', 'warning', 'critical']),
  recommendation: z.string().max(300).optional(),
  threshold: z.object({
    value: z.number(),
    breached: z.boolean(),
  }).optional(),
});

export type MetricAnalysisResponse = z.infer<typeof MetricAnalysisSchema>;

// Troubleshooting Schema
export const TroubleshootingSchema = z.object({
  issue: z.string().max(300),
  investigationSteps: z.array(z.string().max(200)),
  findings: z.string().max(500),
  rootCause: z.string().max(300),
  resolution: z.array(z.string().max(200)),
  preventionMeasures: z.array(z.string().max(200)).optional(),
});

export type TroubleshootingResponse = z.infer<typeof TroubleshootingSchema>;

// Generic Structured Response Schema
export const StructuredResponseSchema = z.object({
  summary: z.string().max(500),
  details: z.record(z.any()).optional(),
  actions: z.array(z.string().max(200)).optional(),
  metadata: z.record(z.string()).optional(),
});

export type StructuredResponse = z.infer<typeof StructuredResponseSchema>;

/**
 * Template Selector - determines which template to use based on query
 */
export function selectTemplate(message: string): {
  template: keyof typeof RESPONSE_TEMPLATES | null;
  schema: z.ZodSchema | null;
  instruction: string;
} {
  const lowerMsg = message.toLowerCase();

  // Yes/No questions
  if (
    lowerMsg.startsWith('is ') ||
    lowerMsg.startsWith('are ') ||
    lowerMsg.startsWith('can ') ||
    lowerMsg.startsWith('does ') ||
    lowerMsg.startsWith('do ')
  ) {
    return {
      template: 'yes_no',
      schema: YesNoSchema,
      instruction: 'Respond with a clear yes/no answer and brief reason.',
    };
  }

  // Status checks
  if (
    lowerMsg.includes('status of') ||
    lowerMsg.includes('what is the status') ||
    lowerMsg.includes('check status')
  ) {
    return {
      template: 'status_check',
      schema: StatusCheckSchema,
      instruction: 'Provide status, brief details, and whether action is required.',
    };
  }

  // Error analysis
  if (
    lowerMsg.includes('error') ||
    lowerMsg.includes('failed') ||
    lowerMsg.includes('failure') ||
    lowerMsg.includes('not working')
  ) {
    return {
      template: 'error_analysis',
      schema: ErrorAnalysisSchema,
      instruction: 'Analyze the error, identify cause, provide solution steps.',
    };
  }

  // List requests
  if (
    lowerMsg.startsWith('list ') ||
    lowerMsg.includes('show me all') ||
    lowerMsg.includes('get all')
  ) {
    return {
      template: 'list_items',
      schema: ListItemsSchema,
      instruction: 'List items concisely with total count and brief summary.',
    };
  }

  // Metric analysis
  if (
    lowerMsg.includes('metric') ||
    lowerMsg.includes('latency') ||
    lowerMsg.includes('error rate') ||
    lowerMsg.includes('performance')
  ) {
    return {
      template: 'metric_analysis',
      schema: MetricAnalysisSchema,
      instruction: 'Analyze metric with current value, trend, status, and recommendation.',
    };
  }

  // Troubleshooting
  if (
    lowerMsg.includes('troubleshoot') ||
    lowerMsg.includes('investigate') ||
    lowerMsg.includes('why is') ||
    lowerMsg.includes('what caused')
  ) {
    return {
      template: 'troubleshooting',
      schema: TroubleshootingSchema,
      instruction: 'Investigate issue systematically and provide resolution steps.',
    };
  }

  // No specific template
  return {
    template: null,
    schema: null,
    instruction: 'Respond concisely and directly to the question.',
  };
}

/**
 * Generates system prompt instruction based on template
 */
export function getTemplateInstruction(message: string): string {
  const { template, instruction } = selectTemplate(message);

  if (!template) {
    return instruction;
  }

  const templateFormat = RESPONSE_TEMPLATES[template];

  return `${instruction}

Use this format:
${templateFormat.format}

Keep response under ${templateFormat.maxTokens} tokens.`;
}

/**
 * Validates response against schema if available
 */
export function validateResponse(
  message: string,
  response: unknown
): {
  valid: boolean;
  data?: unknown;
  errors?: z.ZodError;
} {
  const { schema } = selectTemplate(message);

  if (!schema) {
    return { valid: true, data: response };
  }

  try {
    const validated = schema.parse(response);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

/**
 * Extracts structured data from text response
 */
export function parseStructuredResponse(
  text: string,
  schema: z.ZodSchema
): {
  success: boolean;
  data?: unknown;
  error?: string;
} {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]+?)\n```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      const validated = schema.parse(parsed);
      return { success: true, data: validated };
    }

    // Try to parse entire response as JSON
    const parsed = JSON.parse(text);
    const validated = schema.parse(parsed);
    return { success: true, data: validated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Parse failed',
    };
  }
}

/**
 * Formats response according to template
 */
export function formatResponse(
  templateKey: keyof typeof RESPONSE_TEMPLATES,
  data: Record<string, unknown>
): string {
  const template = RESPONSE_TEMPLATES[templateKey];
  let formatted = template.format;

  // Replace placeholders with data
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `[${key}]`;
    formatted = formatted.replace(
      new RegExp(placeholder, 'g'),
      String(value)
    );
  }

  return formatted;
}
