/**
 * Tests for Response Templates
 */

import {
  selectTemplate,
  getTemplateInstruction,
  validateResponse,
  formatResponse,
  StatusCheckSchema,
  YesNoSchema,
  ErrorAnalysisSchema,
} from '../templates';

describe('Response Templates', () => {
  describe('selectTemplate', () => {
    it('selects yes_no template for yes/no questions', () => {
      const queries = [
        'Is the service healthy?',
        'Are there any errors?',
        'Can you check status?',
        'Does this work?',
      ];

      queries.forEach((query) => {
        const { template, schema } = selectTemplate(query);
        expect(template).toBe('yes_no');
        expect(schema).toBe(YesNoSchema);
      });
    });

    it('selects status_check template for status queries', () => {
      const queries = [
        'What is the status of service X?',
        'Check status of deployment',
        'Status of the system',
      ];

      queries.forEach((query) => {
        const { template } = selectTemplate(query);
        expect(template).toBe('status_check');
      });
    });

    it('selects error_analysis template for error queries', () => {
      const queries = [
        'Why is the service failing?',
        'Error in deployment',
        'What caused the failure?',
        'Service is not working',
      ];

      queries.forEach((query) => {
        const { template } = selectTemplate(query);
        expect(template).toBe('error_analysis');
      });
    });

    it('selects list_items template for list queries', () => {
      const queries = [
        'List all active alerts',
        'Show me all services',
        'Get all errors',
      ];

      queries.forEach((query) => {
        const { template } = selectTemplate(query);
        expect(template).toBe('list_items');
      });
    });

    it('selects metric_analysis template for metric queries', () => {
      const queries = [
        'What is the latency metric?',
        'Check error rate',
        'Show performance metrics',
      ];

      queries.forEach((query) => {
        const { template } = selectTemplate(query);
        expect(template).toBe('metric_analysis');
      });
    });

    it('selects troubleshooting template for investigation queries', () => {
      const queries = [
        'Troubleshoot the service',
        'Investigate the issue',
        'Why is X happening?',
        'What caused Y?',
      ];

      queries.forEach((query) => {
        const { template } = selectTemplate(query);
        expect(template).toBe('troubleshooting');
      });
    });

    it('returns null for unmatched queries', () => {
      const { template, schema } = selectTemplate('Tell me about your day');
      expect(template).toBeNull();
      expect(schema).toBeNull();
    });
  });

  describe('getTemplateInstruction', () => {
    it('provides instruction for yes/no questions', () => {
      const instruction = getTemplateInstruction('Is the service healthy?');

      expect(instruction).toContain('yes/no');
      expect(instruction).toContain('reason');
    });

    it('provides instruction for status checks', () => {
      const instruction = getTemplateInstruction('What is the status?');

      expect(instruction).toContain('status');
      expect(instruction).toContain('action');
    });

    it('provides generic instruction for unmatched queries', () => {
      const instruction = getTemplateInstruction('Random question');

      expect(instruction).toContain('concisely');
    });
  });

  describe('validateResponse', () => {
    it('validates yes/no response', () => {
      const response = {
        answer: true,
        reason: 'All metrics are normal',
      };

      const result = validateResponse('Is the service healthy?', response);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(response);
    });

    it('rejects invalid yes/no response', () => {
      const response = {
        answer: 'yes', // Should be boolean
        reason: 'All good',
      };

      const result = validateResponse('Is the service healthy?', response);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('validates status check response', () => {
      const response = {
        status: 'healthy',
        details: 'All systems operational',
        actionRequired: false,
      };

      const result = validateResponse('What is the status?', response);

      expect(result.valid).toBe(true);
    });

    it('validates error analysis response', () => {
      const response = {
        error: 'Service timeout',
        cause: 'Database connection pool exhausted',
        solution: ['Increase pool size', 'Add connection timeout'],
        severity: 'high',
      };

      const result = validateResponse('Why is the service failing?', response);

      expect(result.valid).toBe(true);
    });

    it('rejects response with string exceeding max length', () => {
      const response = {
        answer: true,
        reason: 'A'.repeat(300), // Exceeds 200 char limit
      };

      const result = validateResponse('Is the service healthy?', response);

      expect(result.valid).toBe(false);
    });
  });

  describe('formatResponse', () => {
    it('formats yes_no response', () => {
      const formatted = formatResponse('yes_no', {
        answer: 'Yes',
        reason: 'All systems operational',
      });

      expect(formatted).toContain('Answer: Yes');
      expect(formatted).toContain('Reason: All systems operational');
    });

    it('formats status_check response', () => {
      const formatted = formatResponse('status_check', {
        status: 'healthy',
        details: 'All systems operational',
        'Action Required': 'no',
      });

      expect(formatted).toContain('Status: healthy');
      expect(formatted).toContain('Details: All systems operational');
      expect(formatted).toContain('Action Required: no');
    });

    it('formats error_analysis response', () => {
      const formatted = formatResponse('error_analysis', {
        error: 'Service timeout',
        cause: 'Database overload',
        'fix steps': '1. Restart DB\n2. Scale up',
        'how to prevent': 'Add monitoring',
      });

      expect(formatted).toContain('Error: Service timeout');
      expect(formatted).toContain('Cause: Database overload');
    });
  });
});
