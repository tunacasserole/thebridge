# TheBridge: Agent Implementation Guide
**Version:** 1.0  
**Date:** December 12, 2025

## Overview

This guide provides production-ready implementation patterns for building intelligent agents using the Claude Agent SDK in TypeScript. Each agent is specialized for specific SRE tasks and integrates seamlessly with TheBridge's MCP layer.

---

## Agent Framework Core

### Base Agent Class

```typescript
// lib/agents/base-agent.ts
import { query, type Query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { MCPManager } from '../mcp/manager';
import { Logger } from '../observability/logger';

export abstract class BaseAgent {
  protected logger: Logger;
  protected mcpManager: MCPManager;
  
  constructor(
    protected name: string,
    protected description: string,
    protected allowedTools: string[]
  ) {
    this.logger = new Logger(`agent:${name}`);
    this.mcpManager = MCPManager.getInstance();
  }
  
  abstract buildSystemPrompt(): string;
  abstract getRequiredMCPs(): string[];
  
  async execute(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    this.logger.info('Executing agent', { request });
    
    try {
      // Build comprehensive prompt
      const prompt = this.buildPrompt(request);
      
      // Execute with Claude Agent SDK
      const stream: Query = query({
        prompt,
        options: {
          model: 'sonnet', // Claude Sonnet 4.5
          allowedTools: this.allowedTools,
          permissionMode: 'auto',
          resume: request.sessionId,
        },
      });
      
      // Process stream
      const result = await this.processStream(stream);
      
      // Log execution metrics
      const duration = Date.now() - startTime;
      await this.logExecution(request, result, duration);
      
      return result;
    } catch (error) {
      this.logger.error('Agent execution failed', { error, request });
      throw error;
    }
  }
  
  protected buildPrompt(request: AgentExecutionRequest): string {
    return `
${this.buildSystemPrompt()}

## Current Context
${this.formatContext(request.context)}

## User Request
${request.prompt}

## Instructions
1. Analyze the request and available context
2. Use tools to gather additional information if needed
3. Provide a clear, actionable response
4. Include specific next steps or recommendations
5. Cite sources for any data referenced
    `.trim();
  }
  
  protected async processStream(stream: Query): Promise<AgentExecutionResult> {
    const chunks: string[] = [];
    const toolCalls: ToolCall[] = [];
    let sessionId: string | undefined;
    
    for await (const message of stream) {
      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            sessionId = message.session_id;
          }
          break;
          
        case 'assistant':
          for (const content of message.message.content) {
            if (content.type === 'text') {
              chunks.push(content.text);
            } else if (content.type === 'tool_use') {
              toolCalls.push({
                id: content.id,
                name: content.name,
                input: content.input,
              });
            }
          }
          break;
          
        case 'tool_result':
          this.logger.debug('Tool executed', {
            toolUseId: message.tool_use_id,
            isError: message.is_error,
          });
          break;
      }
    }
    
    return {
      sessionId,
      response: chunks.join(''),
      toolCalls,
      timestamp: new Date(),
      metadata: {
        tokensUsed: await this.estimateTokens(chunks.join('')),
        toolsExecuted: toolCalls.length,
      },
    };
  }
  
  protected formatContext(context: Record<string, unknown>): string {
    return Object.entries(context)
      .map(([key, value]) => `- **${key}**: ${JSON.stringify(value, null, 2)}`)
      .join('\n');
  }
  
  protected async logExecution(
    request: AgentExecutionRequest,
    result: AgentExecutionResult,
    duration: number
  ): Promise<void> {
    await db.agentExecutions.create({
      data: {
        agentName: this.name,
        executionTime: new Date(),
        input: request,
        output: result,
        status: 'success',
        durationMs: duration,
        tokensUsed: result.metadata.tokensUsed,
      },
    });
  }
  
  protected async estimateTokens(text: string): number {
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
  }
}
```

---

## Incident Investigation Agent

### Implementation

```typescript
// lib/agents/incident.agent.ts
import { BaseAgent } from './base-agent';

export class IncidentInvestigationAgent extends BaseAgent {
  constructor() {
    super(
      'incident-investigator',
      'Investigates incidents and provides root cause analysis',
      [
        'Bash',
        'WebSearch',
        'WebFetch',
        'ListMcpResources',
        'ReadMcpResource',
      ]
    );
  }
  
  buildSystemPrompt(): string {
    return `
# Role
You are an expert Site Reliability Engineer investigating production incidents. Your goal is to quickly identify root causes and provide actionable remediation steps.

# Available Data Sources
You have access to the following systems via MCP:
- **Coralogix**: Log search and analysis
- **New Relic**: APM metrics, traces, and alerts
- **Rootly**: Incident management and timeline
- **Kubernetes**: Pod status, deployments, and logs
- **Jira**: Related tickets and postmortems

# Investigation Process
1. **Gather Context**: Collect information from Rootly about the incident
2. **Analyze Logs**: Search Coralogix for errors/warnings around incident time
3. **Check Metrics**: Query New Relic for anomalies in key metrics
4. **Examine Infrastructure**: Check Kubernetes for pod restarts, OOMKills, etc.
5. **Correlate Events**: Look for recent deployments or configuration changes
6. **Find Similar Incidents**: Search past Jira tickets for patterns

# Output Format
Provide your analysis in this structure:
## Summary
[2-3 sentence overview of the incident]

## Timeline
[Key events in chronological order]

## Root Cause
[Your assessment of what caused the incident]

## Evidence
[Specific logs, metrics, or data supporting your conclusion]

## Remediation Steps
[Immediate and long-term actions to resolve and prevent recurrence]

## Related Incidents
[Links to similar past incidents]

# Important Guidelines
- Be concise but thorough
- Always cite specific evidence (log lines, metric values, timestamps)
- Prioritize quick resolution over perfect understanding
- Suggest immediate mitigations even if root cause is unclear
- Link to relevant runbooks when available
    `.trim();
  }
  
  getRequiredMCPs(): string[] {
    return ['coralogix', 'newrelic', 'rootly', 'kubernetes', 'jira'];
  }
  
  // Specialized method for incident investigations
  async investigateIncident(incidentId: string): Promise<IncidentAnalysis> {
    const result = await this.execute({
      prompt: `Investigate incident ${incidentId} and provide a comprehensive root cause analysis.`,
      context: {
        incidentId,
        requestedBy: 'on-call-engineer',
        urgency: 'high',
      },
    });
    
    return this.parseIncidentAnalysis(result.response);
  }
  
  private parseIncidentAnalysis(response: string): IncidentAnalysis {
    // Parse structured response
    const sections = this.extractSections(response);
    
    return {
      summary: sections['Summary'] || '',
      timeline: this.parseTimeline(sections['Timeline'] || ''),
      rootCause: sections['Root Cause'] || '',
      evidence: sections['Evidence'] || '',
      remediationSteps: this.parseSteps(sections['Remediation Steps'] || ''),
      relatedIncidents: this.extractLinks(sections['Related Incidents'] || ''),
    };
  }
  
  private extractSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const regex = /## (.+?)\n([\s\S]+?)(?=\n## |$)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      sections[match[1].trim()] = match[2].trim();
    }
    
    return sections;
  }
  
  private parseTimeline(text: string): TimelineEntry[] {
    const entries: TimelineEntry[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const match = line.match(/(\d{2}:\d{2}:\d{2})\s*[-:]\s*(.+)/);
      if (match) {
        entries.push({
          time: match[1],
          event: match[2].trim(),
        });
      }
    }
    
    return entries;
  }
  
  private parseSteps(text: string): string[] {
    return text
      .split('\n')
      .filter(line => line.trim().startsWith('-') || /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^[-\d.]+\s*/, '').trim());
  }
  
  private extractLinks(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }
}
```

### Usage Example

```typescript
// API Route: app/api/incidents/[id]/investigate/route.ts
import { IncidentInvestigationAgent } from '@/lib/agents/incident.agent';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const agent = new IncidentInvestigationAgent();
  
  try {
    const analysis = await agent.investigateIncident(params.id);
    
    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Quota Management Agent

### Implementation

```typescript
// lib/agents/quota.agent.ts
import { BaseAgent } from './base-agent';

export class QuotaManagementAgent extends BaseAgent {
  constructor() {
    super(
      'quota-manager',
      'Monitors and optimizes observability platform quotas',
      ['Bash', 'ListMcpResources', 'ReadMcpResource']
    );
  }
  
  buildSystemPrompt(): string {
    return `
# Role
You are an expert in observability cost optimization. Your goal is to prevent quota overages and identify cost-saving opportunities.

# Platforms You Monitor
- **Coralogix**: Log ingestion quotas
- **New Relic**: APM and infrastructure monitoring quotas
- **Prometheus**: Metrics storage

# Your Responsibilities
1. Monitor current usage vs quotas (daily and monthly)
2. Identify top consumers and usage trends
3. Detect anomalies (sudden spikes, sustained increases)
4. Recommend optimizations (sampling, filtering, retention)
5. Predict when quotas will be exhausted
6. Estimate cost savings from recommendations

# Analysis Framework
For each platform, provide:
- Current usage and % of quota
- Projected end-of-month usage
- Days until quota exhaustion (if trending toward limit)
- Top 5 consumers by volume
- Unusual patterns (>20% day-over-day increase)
- Specific optimization recommendations with estimated savings

# Output Format
## Platform: [Name]
### Current Status
- Daily Usage: X GB / Y GB (Z%)
- Monthly Usage: X GB / Y GB (Z%)
- Trend: [Increasing/Stable/Decreasing] by X%
- Status: [🟢 Healthy / 🟡 Warning / 🔴 Critical]

### Projections
- End of Month: X GB (Y% of quota)
- Days Until Full: X days
- Recommended Action: [None / Monitor / Optimize / Increase Quota]

### Top Consumers
1. [service-name]: X GB/day (Y% of total)
2. ...

### Optimization Opportunities
1. **[Service/Component]**
   - Issue: [Description]
   - Recommendation: [Action]
   - Estimated Savings: $X/month or Y GB/day
   - Implementation: [Steps]

## Cost Analysis
- Current Monthly Cost: $X
- Potential Savings: $Y
- ROI of Optimization: Z%

# Guidelines
- Be specific with numbers and percentages
- Prioritize recommendations by impact (cost savings)
- Include implementation difficulty (Easy/Medium/Hard)
- Reference industry best practices
- Consider trade-offs (e.g., reduced retention vs cost)
    `.trim();
  }
  
  getRequiredMCPs(): string[] {
    return ['coralogix', 'newrelic', 'prometheus'];
  }
  
  async analyzeQuotas(): Promise<QuotaAnalysis> {
    const result = await this.execute({
      prompt: `Analyze current quota usage across all observability platforms and provide optimization recommendations.`,
      context: {
        date: new Date().toISOString(),
        platforms: ['coralogix', 'newrelic', 'prometheus'],
      },
    });
    
    return this.parseQuotaAnalysis(result.response);
  }
  
  async optimizePlatform(
    platform: string,
    targetSavings: number
  ): Promise<OptimizationPlan> {
    const result = await this.execute({
      prompt: `Create a detailed optimization plan for ${platform} to achieve $${targetSavings}/month in cost savings.`,
      context: {
        platform,
        targetSavings,
        currentDate: new Date().toISOString(),
      },
    });
    
    return this.parseOptimizationPlan(result.response);
  }
  
  private parseQuotaAnalysis(response: string): QuotaAnalysis {
    const sections = this.extractSections(response);
    
    const platforms = Object.keys(sections)
      .filter(key => key.startsWith('Platform:'))
      .map(key => {
        const platformName = key.replace('Platform:', '').trim();
        const content = sections[key];
        
        return {
          name: platformName,
          status: this.extractStatus(content),
          currentUsage: this.extractUsage(content),
          projections: this.extractProjections(content),
          topConsumers: this.extractTopConsumers(content),
          optimizations: this.extractOptimizations(content),
        };
      });
    
    return {
      platforms,
      costAnalysis: this.extractCostAnalysis(sections['Cost Analysis'] || ''),
      generatedAt: new Date(),
    };
  }
  
  private extractStatus(content: string): 'healthy' | 'warning' | 'critical' {
    if (content.includes('🟢')) return 'healthy';
    if (content.includes('🟡')) return 'warning';
    if (content.includes('🔴')) return 'critical';
    return 'healthy';
  }
  
  private extractUsage(content: string): UsageMetrics {
    const dailyMatch = content.match(/Daily Usage:\s*([\d.]+)\s*GB\s*\/\s*([\d.]+)\s*GB\s*\(([\d.]+)%\)/);
    const monthlyMatch = content.match(/Monthly Usage:\s*([\d.]+)\s*GB\s*\/\s*([\d.]+)\s*GB\s*\(([\d.]+)%\)/);
    
    return {
      daily: {
        used: parseFloat(dailyMatch?.[1] || '0'),
        quota: parseFloat(dailyMatch?.[2] || '0'),
        percentage: parseFloat(dailyMatch?.[3] || '0'),
      },
      monthly: {
        used: parseFloat(monthlyMatch?.[1] || '0'),
        quota: parseFloat(monthlyMatch?.[2] || '0'),
        percentage: parseFloat(monthlyMatch?.[3] || '0'),
      },
    };
  }
  
  private extractProjections(content: string): Projections {
    const eomMatch = content.match(/End of Month:\s*([\d.]+)\s*GB\s*\(([\d.]+)%/);
    const daysMatch = content.match(/Days Until Full:\s*([\d.]+)\s*days/);
    
    return {
      endOfMonth: {
        usage: parseFloat(eomMatch?.[1] || '0'),
        percentage: parseFloat(eomMatch?.[2] || '0'),
      },
      daysUntilFull: parseFloat(daysMatch?.[1] || '999'),
    };
  }
  
  private extractTopConsumers(content: string): TopConsumer[] {
    const consumers: TopConsumer[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/\d+\.\s*(.+?):\s*([\d.]+)\s*GB\/day\s*\(([\d.]+)%/);
      if (match) {
        consumers.push({
          name: match[1],
          usage: parseFloat(match[2]),
          percentage: parseFloat(match[3]),
        });
      }
    }
    
    return consumers;
  }
  
  private extractOptimizations(content: string): Optimization[] {
    const optimizations: Optimization[] = [];
    const sections = content.split(/\d+\.\s*\*\*/);
    
    for (const section of sections.slice(1)) {
      const serviceMatch = section.match(/^(.+?)\*\*/);
      const issueMatch = section.match(/Issue:\s*(.+)/);
      const recMatch = section.match(/Recommendation:\s*(.+)/);
      const savingsMatch = section.match(/Estimated Savings:\s*\$?([\d,]+)/);
      
      if (serviceMatch && issueMatch && recMatch) {
        optimizations.push({
          service: serviceMatch[1].trim(),
          issue: issueMatch[1].trim(),
          recommendation: recMatch[1].trim(),
          estimatedSavings: parseFloat(savingsMatch?.[1].replace(/,/g, '') || '0'),
        });
      }
    }
    
    return optimizations;
  }
  
  private extractCostAnalysis(content: string): CostAnalysis {
    const currentMatch = content.match(/Current Monthly Cost:\s*\$?([\d,]+)/);
    const savingsMatch = content.match(/Potential Savings:\s*\$?([\d,]+)/);
    const roiMatch = content.match(/ROI.*?(\d+)%/);
    
    return {
      currentCost: parseFloat(currentMatch?.[1].replace(/,/g, '') || '0'),
      potentialSavings: parseFloat(savingsMatch?.[1].replace(/,/g, '') || '0'),
      roi: parseFloat(roiMatch?.[1] || '0'),
    };
  }
}
```

---

## Knowledge Agent (RAG)

### Implementation

```typescript
// lib/agents/knowledge.agent.ts
import { BaseAgent } from './base-agent';
import { VectorStore } from '../rag/vector-store';

export class KnowledgeAgent extends BaseAgent {
  private vectorStore: VectorStore;
  
  constructor() {
    super(
      'knowledge-assistant',
      'Answers questions using the SRE knowledge base',
      ['WebSearch', 'WebFetch']
    );
    this.vectorStore = new VectorStore();
  }
  
  buildSystemPrompt(): string {
    return `
# Role
You are an expert SRE knowledge assistant with access to complete technical documentation, runbooks, postmortems, and operational procedures.

# Knowledge Sources
- Confluence SRE documentation
- Jira postmortem tickets
- Runbooks repository
- Past incident reports
- Architecture diagrams
- Deployment procedures

# Your Capabilities
1. Answer technical questions with specific references
2. Find relevant runbooks for common issues
3. Summarize past incidents and their resolutions
4. Explain system architectures and data flows
5. Provide step-by-step operational procedures
6. Suggest related documentation

# Response Format
Always structure responses as:
## Answer
[Direct answer to the question]

## Supporting Evidence
[Relevant quotes or data from knowledge base]

## Related Resources
- [Link 1]: [Description]
- [Link 2]: [Description]

## Additional Context
[Any caveats, warnings, or related information]

# Guidelines
- Cite specific documents with links
- If unsure, say so and suggest where to find the answer
- Highlight if information might be outdated
- Provide multiple perspectives when applicable
- Use examples from past incidents when relevant
    `.trim();
  }
  
  getRequiredMCPs(): string[] {
    return ['confluence', 'jira', 'github'];
  }
  
  async answerQuestion(question: string): Promise<KnowledgeResponse> {
    // First, retrieve relevant context from vector store
    const context = await this.vectorStore.search(question, { limit: 5 });
    
    // Execute agent with enriched context
    const result = await this.execute({
      prompt: question,
      context: {
        retrievedDocs: context.map(doc => ({
          source: doc.metadata.source,
          content: doc.content,
          relevance: doc.score,
        })),
      },
    });
    
    return this.parseKnowledgeResponse(result.response);
  }
  
  async findRunbook(issue: string): Promise<Runbook | null> {
    const result = await this.execute({
      prompt: `Find the appropriate runbook for: ${issue}`,
      context: {
        taskType: 'runbook-lookup',
      },
    });
    
    return this.extractRunbook(result.response);
  }
  
  async searchIncidents(query: string): Promise<Incident[]> {
    const result = await this.execute({
      prompt: `Search for past incidents related to: ${query}`,
      context: {
        taskType: 'incident-search',
        timeRange: 'last-6-months',
      },
    });
    
    return this.parseIncidentsList(result.response);
  }
  
  private parseKnowledgeResponse(response: string): KnowledgeResponse {
    const sections = this.extractSections(response);
    
    return {
      answer: sections['Answer'] || '',
      evidence: sections['Supporting Evidence'] || '',
      relatedResources: this.extractResources(sections['Related Resources'] || ''),
      additionalContext: sections['Additional Context'] || '',
    };
  }
  
  private extractResources(text: string): Resource[] {
    const resources: Resource[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const match = line.match(/- \[(.+?)\]\((.+?)\):\s*(.+)/);
      if (match) {
        resources.push({
          title: match[1],
          url: match[2],
          description: match[3],
        });
      }
    }
    
    return resources;
  }
  
  private extractRunbook(response: string): Runbook | null {
    const urlMatch = response.match(/https:\/\/[^\s]+\/runbooks\/[^\s]+/);
    if (!urlMatch) return null;
    
    const titleMatch = response.match(/Runbook:\s*(.+)/);
    
    return {
      url: urlMatch[0],
      title: titleMatch?.[1] || 'Unknown',
      content: response,
    };
  }
  
  private parseIncidentsList(response: string): Incident[] {
    const incidents: Incident[] = [];
    const sections = response.split(/\d+\.\s*\*\*/);
    
    for (const section of sections.slice(1)) {
      const titleMatch = section.match(/^(.+?)\*\*/);
      const dateMatch = section.match(/Date:\s*(.+)/);
      const summaryMatch = section.match(/Summary:\s*(.+)/);
      const linkMatch = section.match(/(https:\/\/[^\s]+)/);
      
      if (titleMatch) {
        incidents.push({
          title: titleMatch[1].trim(),
          date: dateMatch?.[1].trim() || '',
          summary: summaryMatch?.[1].trim() || '',
          link: linkMatch?.[1] || '',
        });
      }
    }
    
    return incidents;
  }
}
```

---

## Remediation Agent

### Implementation

```typescript
// lib/agents/remediation.agent.ts
import { BaseAgent } from './base-agent';

export class RemediationAgent extends BaseAgent {
  constructor() {
    super(
      'remediation-executor',
      'Executes safe remediation actions',
      ['Bash', 'ListMcpResources', 'ReadMcpResource']
    );
  }
  
  buildSystemPrompt(): string {
    return `
# Role
You are an expert SRE automation agent capable of executing safe remediation actions. You must be extremely cautious and always verify before taking action.

# Available Actions
You can perform the following remediation tasks:
1. Restart pods/services
2. Scale deployments
3. Clear caches
4. Rollback deployments
5. Update configuration
6. Trigger manual sync jobs

# Safety Rules (CRITICAL)
⚠️ NEVER execute destructive actions without explicit approval
⚠️ ALWAYS verify current state before making changes
⚠️ ALWAYS create backup/snapshot before making changes
⚠️ ALWAYS test in non-prod first if possible
⚠️ STOP immediately if unexpected state detected

# Execution Process
1. **Analyze**: Understand the problem and proposed solution
2. **Verify**: Check current state and validate safety
3. **Plan**: Outline exact steps to be executed
4. **Approval**: Request user confirmation for risky actions
5. **Execute**: Perform action with monitoring
6. **Validate**: Confirm desired outcome achieved
7. **Rollback**: If validation fails, revert changes

# Output Format
## Analysis
[What is the problem and why this remediation?]

## Current State
[Relevant system state before action]

## Proposed Action
[Exact steps to be executed]

## Risk Assessment
- Severity: [Low/Medium/High]
- Reversible: [Yes/No]
- Approval Required: [Yes/No]

## Execution Plan
1. [Step 1]
2. [Step 2]
...

## Validation Steps
[How to verify success]

## Rollback Plan
[How to undo if it fails]

# Guidelines
- Be conservative - err on the side of caution
- Prefer gradual changes over big bang
- Monitor metrics during execution
- Document all actions taken
- Never guess - if unsure, ask for clarification
    `.trim();
  }
  
  getRequiredMCPs(): string[] {
    return ['kubernetes', 'github', 'datadog'];
  }
  
  async planRemediation(issue: string): Promise<RemediationPlan> {
    const result = await this.execute({
      prompt: `Create a remediation plan for: ${issue}`,
      context: {
        mode: 'planning',
        requiresApproval: true,
      },
    });
    
    return this.parseRemediationPlan(result.response);
  }
  
  async executeRemediation(
    plan: RemediationPlan,
    approved: boolean = false
  ): Promise<RemediationResult> {
    if (plan.riskLevel === 'high' && !approved) {
      throw new Error('High-risk remediation requires explicit approval');
    }
    
    const result = await this.execute({
      prompt: `Execute the following remediation plan:\n\n${JSON.stringify(plan, null, 2)}`,
      context: {
        mode: 'execution',
        approved,
      },
    });
    
    return this.parseRemediationResult(result.response);
  }
  
  private parseRemediationPlan(response: string): RemediationPlan {
    const sections = this.extractSections(response);
    
    const riskMatch = sections['Risk Assessment']?.match(/Severity:\s*(.+)/);
    const reversibleMatch = sections['Risk Assessment']?.match(/Reversible:\s*(.+)/);
    const approvalMatch = sections['Risk Assessment']?.match(/Approval Required:\s*(.+)/);
    
    return {
      analysis: sections['Analysis'] || '',
      currentState: sections['Current State'] || '',
      proposedAction: sections['Proposed Action'] || '',
      riskLevel: (riskMatch?.[1].trim().toLowerCase() || 'medium') as RiskLevel,
      reversible: reversibleMatch?.[1].trim().toLowerCase() === 'yes',
      requiresApproval: approvalMatch?.[1].trim().toLowerCase() === 'yes',
      executionSteps: this.parseSteps(sections['Execution Plan'] || ''),
      validationSteps: this.parseSteps(sections['Validation Steps'] || ''),
      rollbackPlan: sections['Rollback Plan'] || '',
    };
  }
  
  private parseRemediationResult(response: string): RemediationResult {
    const sections = this.extractSections(response);
    
    return {
      success: response.includes('✅') || response.includes('SUCCESS'),
      stepsExecuted: this.parseSteps(sections['Steps Executed'] || ''),
      validationResults: sections['Validation Results'] || '',
      errors: this.extractErrors(response),
      timestamp: new Date(),
    };
  }
  
  private extractErrors(text: string): string[] {
    const errors: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('ERROR') || line.includes('❌') || line.includes('FAILED')) {
        errors.push(line.trim());
      }
    }
    
    return errors;
  }
}
```

---

## Agent Testing

### Unit Tests

```typescript
// lib/agents/__tests__/incident.agent.test.ts
import { IncidentInvestigationAgent } from '../incident.agent';
import { mockMCPManager } from '../../mcp/__mocks__/manager';

describe('IncidentInvestigationAgent', () => {
  let agent: IncidentInvestigationAgent;
  
  beforeEach(() => {
    agent = new IncidentInvestigationAgent();
    mockMCPManager.reset();
  });
  
  it('should investigate incident and return analysis', async () => {
    const incidentId = 'INC-1234';
    const analysis = await agent.investigateIncident(incidentId);
    
    expect(analysis).toHaveProperty('summary');
    expect(analysis).toHaveProperty('rootCause');
    expect(analysis).toHaveProperty('remediationSteps');
    expect(analysis.timeline.length).toBeGreaterThan(0);
  });
  
  it('should handle MCP failures gracefully', async () => {
    mockMCPManager.simulateFailure('coralogix');
    
    const result = await agent.execute({
      prompt: 'Investigate incident',
      context: { incidentId: 'INC-5678' },
    });
    
    expect(result.response).toContain('Limited data available');
  });
});
```

---

## Monitoring & Observability

### Agent Metrics

```typescript
// lib/observability/agent-metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const agentMetrics = {
  executions: new Counter({
    name: 'thebridge_agent_executions_total',
    help: 'Total number of agent executions',
    labelNames: ['agent', 'status'],
  }),
  
  duration: new Histogram({
    name: 'thebridge_agent_duration_seconds',
    help: 'Agent execution duration',
    labelNames: ['agent'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  }),
  
  tokensUsed: new Counter({
    name: 'thebridge_agent_tokens_used_total',
    help: 'Total tokens used by agents',
    labelNames: ['agent'],
  }),
  
  activeSessions: new Gauge({
    name: 'thebridge_agent_active_sessions',
    help: 'Number of active agent sessions',
    labelNames: ['agent'],
  }),
};
```

---

## Best Practices

1. **Prompt Engineering**
   - Use clear, structured system prompts
   - Provide examples in the prompt
   - Specify output format explicitly
   - Include safety guardrails

2. **Error Handling**
   - Always wrap agent execution in try/catch
   - Log failures with context
   - Implement retry logic for transient failures
   - Degrade gracefully when tools unavailable

3. **Performance**
   - Cache repetitive queries
   - Limit tool calls per execution
   - Use sessions for multi-turn conversations
   - Monitor token usage

4. **Security**
   - Validate all inputs
   - Never expose raw API keys
   - Audit all tool executions
   - Require approval for risky actions

5. **Testing**
   - Unit test each agent in isolation
   - Integration test with mock MCPs
   - Load test with realistic scenarios
   - Validate output parsing logic

---

**Document Status:** Production Ready  
**Next Review:** January 15, 2026
