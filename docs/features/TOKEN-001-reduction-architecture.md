# TOKEN-001: Token Usage Reduction Architecture

**Status**: In Progress (Week 1/10)
**Start Date**: 2024-12-16
**Owner**: Platform Engineering
**Target**: 40-60% token reduction

---

## Executive Summary

TheBridge currently consumes significant tokens per chat request due to large system prompts, verbose MCP tool definitions, and unbounded conversation history. This 10-week initiative aims to reduce token usage by 40-60% through systematic optimization across all components.

**Current Baseline** (Estimated):
- **Typical Request**: ~16.8K tokens input
- **System Prompt**: ~1.4K tokens (18%)
- **Tool Definitions**: ~7.7K tokens (46%)
- **Conversation History**: ~2.2K tokens (13%)
- **Tool Results**: ~500 tokens (6%)
- **User Message**: ~100 tokens (1%)
- **Assistant Response**: ~500 tokens (output)

**Target After Optimization**:
- **Typical Request**: ~6.7-10K tokens input (40-60% reduction)
- **Cost Savings**: ~$0.02 per request → ~$0.008-0.012 per request

---

## Current State Analysis

### Token Consumption Breakdown

Based on analysis of production code and configurations:

#### 1. System Prompts (18% of input tokens)

| Component | Characters | Est. Tokens | Notes |
|-----------|-----------|-------------|-------|
| Main System Prompt | 5,625 | 1,406 | Used in `/api/chat/route.ts` |
| General Agent | 909 | 227 | Used for general assistant |
| Incident Agent | 2,135 | 534 | Used for incident investigation |
| Quota Agent | 2,094 | 524 | Used for quota management |

**Issues**:
- Verbose formatting rules (46 lines of Markdown examples)
- Redundant capability descriptions
- Integration lists duplicated across agents
- No prompt compression or caching

#### 2. MCP Tool Definitions (46% of input tokens)

Based on `.mcp.json` configuration:

| MCP Server | Est. Tools | Tokens/Tool | Total Tokens |
|------------|-----------|-------------|--------------|
| Coralogix | 12 | 400 | 4,800 |
| New Relic | 22 | 350 | 7,700 |
| Rootly | 12 | 300 | 3,600 |
| GitHub | 25 | 300 | 7,500 |
| Jira | 18 | 350 | 6,300 |
| Confluence | 7 | 300 | 2,100 |
| Slack | 8 | 250 | 2,000 |

**Typical Usage**: 3 servers enabled = ~7,700 tokens

**Issues**:
- All tools loaded upfront, even if never used
- Verbose JSON schemas with example values
- No tool definition caching
- No lazy loading or dynamic tool injection

#### 3. Conversation History (13% of input tokens)

**Typical Scenarios**:
- Simple query (2 turns): ~400 tokens
- Moderate conversation (5 turns): ~2,200 tokens
- Complex investigation (10 turns): ~6,000 tokens
- Long session (20 turns): ~15,000 tokens

**Issues**:
- No truncation or summarization
- Full tool results included in history
- No sliding window implementation
- Unbounded growth in long sessions

#### 4. Tool Results (6% of input tokens)

**Issues**:
- Full JSON payloads returned
- No result compression
- Repeated queries return duplicate data
- No caching of tool results

---

## Top 3 Token Consumers

1. **Tool Definitions: 7.7K tokens (46%)**
   - Opportunity: Lazy loading, schema optimization, caching
   - Potential Savings: 3-4K tokens (40-50% reduction)

2. **System Prompt: 1.4K tokens (18%)**
   - Opportunity: Compression, modularization, prompt caching
   - Potential Savings: 600-900 tokens (40-65% reduction)

3. **Conversation History: 2.2K tokens (13%)**
   - Opportunity: Smart truncation, summarization
   - Potential Savings: 800-1,200 tokens (35-55% reduction)

---

## Architecture Strategy

### Design Principles

1. **Lazy Loading**: Load only what's needed, when needed
2. **Caching**: Cache expensive operations (prompts, tool definitions)
3. **Compression**: Reduce verbosity without losing functionality
4. **Intelligence**: Smart truncation and summarization
5. **Measurement**: Track and validate all optimizations

### Key Technologies

- **Prompt Caching** (Anthropic): Cache system prompts and tool definitions
- **Dynamic Tool Loading**: Inject tools only when needed
- **Smart Truncation**: Sliding window with importance scoring
- **Schema Optimization**: Minimal viable tool definitions
- **Result Compression**: Summarize large tool outputs

---

## 10-Week Implementation Plan

### Week 1: Assessment & Architecture ✅ IN PROGRESS
**Deliverables**:
- [x] Token tracking infrastructure (`lib/tokens/`)
- [x] Current usage analysis
- [x] Architecture document (this document)
- [x] Success metrics defined

**Success Criteria**:
- Token counter utilities implemented
- Baseline measurements documented
- Architecture approved

### Week 2: Prompt Optimization
**Goal**: Reduce system prompt tokens by 40-65%

**Tasks**:
1. Compress main system prompt formatting rules
2. Extract common capabilities to shared modules
3. Remove redundant integration lists
4. Implement prompt caching with Anthropic API
5. A/B test compressed vs original prompts

**Target**: 1,406 → 500-850 tokens (550-900 token savings)

### Week 3: Tool Definition Optimization
**Goal**: Reduce tool definition tokens by 40-50%

**Tasks**:
1. Optimize MCP tool JSON schemas
2. Remove example values and verbose descriptions
3. Implement tool definition caching
4. Add compression for repeated tool loads

**Target**: 7,700 → 3,850-4,620 tokens (3,100-3,850 token savings)

### Week 4: Lazy Tool Loading
**Goal**: Load only required tools per request

**Tasks**:
1. Implement tool requirement detection from user message
2. Build dynamic tool injection system
3. Add tool usage analytics
4. Create tool recommendation engine

**Target**: 7,700 → 1,000-2,000 tokens (5,700-6,700 token savings for typical requests)

### Week 5: Conversation History Management
**Goal**: Implement smart truncation and summarization

**Tasks**:
1. Build sliding window with configurable size
2. Implement message importance scoring
3. Add conversation summarization for long sessions
4. Create conversation compression API

**Target**: Unbounded → Max 3,000 tokens per conversation

### Week 6: Tool Result Optimization
**Goal**: Reduce tool result verbosity

**Tasks**:
1. Implement result summarization for large payloads
2. Add result caching to avoid duplicate queries
3. Build result compression system
4. Add configurable result size limits

**Target**: Variable → Max 1,000 tokens per result

### Week 7: Agent-Specific Optimization
**Goal**: Optimize specialized agents

**Tasks**:
1. Compress Incident Agent prompt
2. Compress Quota Agent prompt
3. Compress General Agent prompt
4. Implement agent-specific tool sets

**Target**: Agent prompts 534 → 200-300 tokens each

### Week 8: Caching Infrastructure
**Goal**: Implement comprehensive caching

**Tasks**:
1. Integrate Anthropic Prompt Caching API
2. Build token cache system
3. Add cache hit/miss monitoring
4. Optimize cache invalidation strategy

**Target**: 50-70% cache hit rate on prompts and tools

### Week 9: Performance Testing & Tuning
**Goal**: Validate optimizations and tune

**Tasks**:
1. Run A/B tests with production traffic
2. Measure response quality impact
3. Fine-tune compression levels
4. Optimize cache settings

**Success Criteria**:
- 40-60% token reduction achieved
- <5% quality degradation
- <10ms latency increase

### Week 10: Documentation & Rollout
**Goal**: Complete rollout and documentation

**Tasks**:
1. Update all documentation
2. Create optimization playbook
3. Train team on token management
4. Monitor production metrics

**Success Criteria**:
- Full production rollout
- Documentation complete
- Team trained
- Monitoring in place

---

## Success Metrics

### Primary Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Avg tokens/request | ~16,800 | 6,700-10,000 | Token counter logs |
| Cost/request | ~$0.02 | $0.008-0.012 | API usage tracking |
| P95 tokens/request | ~25,000 | 10,000-15,000 | Token distribution |
| Cache hit rate | 0% | 50-70% | Cache metrics |

### Quality Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Response accuracy | 100% | ≥95% | User feedback |
| Tool call success | 100% | ≥98% | Tool execution logs |
| User satisfaction | Baseline | ≥Baseline | CSAT surveys |
| Response time | Baseline | ≤+10ms | API latency |

### Component Metrics

| Component | Current | Target | Savings |
|-----------|---------|--------|---------|
| System Prompt | 1,406 | 500-850 | 550-900 |
| Tool Definitions | 7,700 | 1,000-4,620 | 3,100-6,700 |
| Conversation History | 2,200 | 800-1,500 | 700-1,400 |
| Tool Results | 500 | 200-400 | 100-300 |
| **Total Input** | **~16,800** | **~6,700-10,000** | **~6,800-10,100** |

---

## Technical Implementation Details

### 1. Token Tracking Infrastructure

**Location**: `/lib/tokens/`

**Components**:
- `types.ts`: Type definitions for token tracking
- `counter.ts`: Token estimation and calculation utilities
- `logger.ts`: Structured logging for token usage
- `index.ts`: Central export point

**Usage**:
```typescript
import { calculateTokenBreakdown, logTokenUsage } from '@/lib/tokens';

const breakdown = calculateTokenBreakdown({
  systemPrompt: SYSTEM_PROMPT,
  conversationHistory: messages,
  userMessage: message,
  toolDefinitions: tools,
  toolResults: results,
});

logTokenUsage({
  requestId: createRequestId(),
  timestamp: new Date(),
  model: 'sonnet',
  inputTokens: breakdown.total,
  outputTokens: responseTokens,
  totalTokens: breakdown.total + responseTokens,
  inputBreakdown: breakdown,
  responseTimeMs: duration,
  toolCalls: tools.length,
  iterations: loopCount,
});
```

### 2. Prompt Caching (Week 2)

**Anthropic API Support**:
```typescript
const response = await anthropic.messages.create({
  model: modelId,
  max_tokens: 8192,
  system: [
    {
      type: 'text',
      text: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' }
    }
  ],
  tools: tools.map(tool => ({
    ...tool,
    cache_control: { type: 'ephemeral' }
  })),
  messages,
});
```

**Benefits**:
- Cached prompts: 90% cost reduction (write: $3.75/MTok, read: $0.30/MTok)
- 5-minute cache TTL
- Automatic cache invalidation

### 3. Lazy Tool Loading (Week 4)

**Implementation**:
```typescript
// Detect required tools from user message
const requiredTools = detectRequiredTools(message, conversationHistory);

// Load only required MCP servers
const { tools } = await loadMCPTools(requiredTools);
```

**Tool Detection**:
- Keyword matching ("show me Coralogix logs" → load Coralogix)
- Context analysis (incident investigation → load observability tools)
- Explicit user specification (@tools: coralogix, newrelic)

### 4. Smart Conversation Truncation (Week 5)

**Strategy**:
- Sliding window: Keep last N important messages
- Importance scoring: User messages > Assistant > Tool results
- Summarization: Compress old conversation to summary
- Configurable limits: Max tokens per conversation type

**Implementation**:
```typescript
interface TruncationConfig {
  maxTokens: number;
  windowSize: number;
  preserveRecent: number;
  summarizeOlder: boolean;
}

function truncateConversation(
  messages: Message[],
  config: TruncationConfig
): Message[] {
  // Keep recent messages
  // Summarize older messages
  // Return optimized history
}
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Quality degradation | Medium | High | A/B testing, gradual rollout |
| Cache invalidation issues | Low | Medium | Conservative TTLs, monitoring |
| Lazy loading misses required tools | Medium | High | Fallback to full tool set |
| Over-compression loses context | Low | High | Compression level tuning |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Increased development time | Medium | Low | Buffer weeks in plan |
| Breaking changes to API | Low | High | Backward compatibility |
| Team learning curve | Low | Low | Documentation and training |

---

## Dependencies

### External
- Anthropic Prompt Caching API (Week 2)
- MCP SDK dynamic tool loading (Week 4)

### Internal
- Token tracking infrastructure (Week 1) ✅
- Current codebase stability
- Testing infrastructure

---

## Rollout Strategy

### Phase 1: Development (Weeks 1-8)
- Build features in isolation
- Test with synthetic traffic
- Validate each optimization independently

### Phase 2: Beta Testing (Week 9)
- Deploy to staging environment
- Run A/B tests with small user percentage
- Monitor quality and performance metrics
- Collect user feedback

### Phase 3: Production Rollout (Week 10)
- Gradual rollout: 10% → 25% → 50% → 100%
- Real-time monitoring dashboard
- Automatic rollback on quality degradation
- Full team training

---

## Monitoring & Alerting

### Dashboards

**Token Usage Dashboard**:
- Real-time token consumption by component
- Cost per request trend
- Cache hit rate
- Token distribution (P50, P95, P99)

**Quality Dashboard**:
- Response accuracy metrics
- Tool call success rate
- User satisfaction scores
- Error rates

### Alerts

- Token usage exceeds baseline by >20%
- Cache hit rate drops below 40%
- Tool call failures >2%
- Response quality score <95%

---

## Open Questions

1. **Prompt Caching**: What's the optimal cache TTL for our usage patterns?
2. **Tool Detection**: Should we use AI to detect required tools or rules-based system?
3. **Conversation Limits**: What's the right max conversation length?
4. **Quality Trade-offs**: How much compression is acceptable before quality degrades?

---

## References

### Internal Documents
- [System Architecture](../01_system_architecture.md)
- [Agent Implementation Guide](../02_agent_implementation_guide.md)
- [Development Roadmap](../03_development_roadmap.md)

### External Resources
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Token Counting Best Practices](https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them)
- [MCP SDK Documentation](https://modelcontextprotocol.io)

---

## Change Log

| Date | Week | Changes | Author |
|------|------|---------|--------|
| 2024-12-16 | 1 | Initial architecture document | Platform Engineering |

---

## Appendix A: Token Estimation Methodology

**Character-to-Token Ratio**: 4:1 (conservative estimate for English text)

**Validation**:
- Tested against Claude API actual token counts
- ±10% accuracy for typical English text
- Higher variance for JSON/code

**Tool Definition Estimation**:
- Based on analysis of MCP tool schemas
- Average tool: 250-400 tokens
- Range validated against actual MCP server responses

**Future Improvement**:
- Replace with tiktoken library for exact counts
- Use Claude-specific tokenizer when available

---

## Appendix B: Cost Analysis

**Current State** (per 1,000 requests):
- Input: 16.8K tokens × 1,000 = 16.8M tokens
- Output: 500 tokens × 1,000 = 500K tokens
- Cost: (16.8 × $3) + (0.5 × $15) = $50.40 + $7.50 = **$57.90**

**Target State** (40% reduction):
- Input: 10K tokens × 1,000 = 10M tokens
- Output: 500 tokens × 1,000 = 500K tokens (unchanged)
- Cost: (10 × $3) + (0.5 × $15) = $30 + $7.50 = **$37.50**

**Monthly Savings** (100K requests/month):
- Current: $5,790/month
- Target: $3,750/month
- **Savings: $2,040/month ($24,480/year)**

**With Prompt Caching** (70% cache hit rate):
- Cached input reads: 7M × $0.30 = $2.10
- Cache writes: 3M × $3.75 = $11.25
- Output: 500K × $15 = $7.50
- Cost per 1K requests: **$20.85**

**Total Monthly Savings with Caching**:
- Without optimization: $5,790
- With optimization + caching: $2,085
- **Savings: $3,705/month ($44,460/year)**
