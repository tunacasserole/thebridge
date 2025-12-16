# AUTH-001: Authentication Architecture Plan

## Overview

**Goal**: Implement robust authentication for TheBridge that works in deployed web environments with multiple users, each having their own API keys, with proper support for main chat, spawned agents, and MCP integrations.

**Current Status**: In Progress (Research Complete, Implementation Pending)

**Priority**: Critical - Required for production deployment

---

## Executive Summary

After extensive research of the Anthropic documentation, Claude Agent SDK source, and community discussions, here are the key findings:

### Key Findings

1. **OAuth vs API Key**:
   - OAuth is for **Claude Code CLI interactive use** (developer terminals)
   - API Keys are for **SDK/programmatic use** (production applications)
   - Your "OAuth token expired" errors occur because the SDK subprocess may be trying to use OAuth authentication instead of API keys

2. **Claude Agent SDK Authentication**:
   - The SDK does **NOT** have an `apiKey` parameter in the `query()` function
   - Authentication is done via **environment variables** passed to the subprocess
   - The `env` option in `query()` allows passing custom environment variables per call
   - This is how you can pass different API keys per user!

3. **Multi-User Authentication**:
   - For production multi-user apps, you have **two viable approaches**:
     - **Option A**: Use `@anthropic-ai/sdk` directly (recommended for multi-user)
     - **Option B**: Use Claude Agent SDK with per-request `env` injection

4. **Current Implementation Analysis**:
   - Your code already passes `ANTHROPIC_API_KEY` via `env` option - this is correct!
   - The issue is you're reading from `process.env.ANTHROPIC_API_KEY` (server-side single key)
   - For multi-user, you need to get the API key from the **user's session/database**

---

## Authentication Options Comparison

### Option A: Direct Anthropic SDK (Recommended for Multi-User)

**Use `@anthropic-ai/sdk` instead of Claude Agent SDK**

```typescript
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const { message, userApiKey } = await request.json();

  // Create per-user client instance
  const client = new Anthropic({
    apiKey: userApiKey, // User's API key from session/DB
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: message }],
  });

  return Response.json(response);
}
```

**Pros**:
- Simple, direct API calls
- Full control over authentication per request
- Supports streaming via `client.messages.stream()`
- No subprocess management needed
- Works perfectly with per-user API keys

**Cons**:
- Loses Claude Agent SDK features (built-in tools, MCP servers, agentic loops)
- Must implement tool calling manually
- No automatic session management

**When to Use**:
- Simple chat applications
- When you don't need agentic capabilities
- Maximum control over multi-tenant isolation

---

### Option B: Claude Agent SDK with Per-Request Env (Current Approach - Needs Fix)

**Your current approach is correct but needs user API key injection**

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

export async function POST(request: NextRequest) {
  const { message, userApiKey } = await request.json();

  for await (const event of query({
    prompt: message,
    options: {
      model: 'claude-sonnet-4-20250514',
      maxTurns: 30,
      permissionMode: 'bypassPermissions',
      // KEY: Pass user's API key via env
      env: {
        ANTHROPIC_API_KEY: userApiKey, // User's API key from session/DB
        // Other MCP server credentials if needed per-user
        GITHUB_TOKEN: userGithubToken || '',
        // ...
      },
    },
  })) {
    // Handle events
  }
}
```

**Pros**:
- Retains all Claude Agent SDK features
- Agentic capabilities (tools, loops, MCP servers)
- Session continuation support
- Your existing code structure works

**Cons**:
- SDK spawns subprocesses (more resource overhead)
- Must pass all credentials via env per request
- Subprocess inherits server environment if not fully overridden

**When to Use**:
- When you need agentic capabilities
- Tool use and MCP server integration
- Complex multi-step workflows

---

### Option C: Hybrid Approach (Recommended)

**Use Direct SDK for simple chat, Agent SDK for complex agent operations**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { query } from '@anthropic-ai/claude-agent-sdk';

export async function POST(request: NextRequest) {
  const { message, userApiKey, mode = 'chat' } = await request.json();

  if (mode === 'chat') {
    // Simple chat - use direct SDK
    const client = new Anthropic({ apiKey: userApiKey });
    return streamDirectChat(client, message);
  } else {
    // Agent mode - use Agent SDK with env injection
    return streamAgentChat(userApiKey, message);
  }
}
```

---

## Multi-User Architecture

### User Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Frontend)                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. User logs in via OAuth (Google, GitHub, etc.) or email/password │
│  2. User provides their Anthropic API key (stored encrypted in DB)  │
│  3. API key retrieved from session/cookie for each request          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                             │
├─────────────────────────────────────────────────────────────────────┤
│  1. Validate user session (NextAuth, Clerk, Auth.js, etc.)          │
│  2. Retrieve user's encrypted API key from database                 │
│  3. Decrypt and pass to Anthropic SDK/Agent SDK                     │
│  4. NEVER log or expose the API key                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Anthropic API                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Each request authenticated with user's own API key                 │
│  Usage billed to user's Anthropic account                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Database Schema (Prisma Example)

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Encrypted API keys
  anthropicApiKey   String?  @db.Text  // Encrypted
  githubToken       String?  @db.Text  // Encrypted
  // ... other per-user service credentials

  settings          Json?    // User preferences
  sessions          Session[]
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  expiresAt    DateTime
  createdAt    DateTime @default(now())
}
```

### Encryption for API Keys

```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

---

## Implementation Plan

### Phase 1: Immediate Fix (Get Current Code Working)

**Goal**: Fix the OAuth token expiration issue for single-user deployment

1. Ensure `ANTHROPIC_API_KEY` environment variable is set correctly on the server
2. Verify the `env` option in `query()` is properly passing the API key
3. Test that MCP servers receive the API key via their env configuration

**Files to modify**:
- `app/api/chat/route.ts` - Already has correct pattern
- `app/api/agents/[agentId]/chat/route.ts` - Already has correct pattern

**The current code should work if**:
- `ANTHROPIC_API_KEY` is set in `.env.local` or production environment
- The server has access to this environment variable at runtime

### Phase 2: Add User Authentication (Required for Multi-User)

**Goal**: Add user login and per-user API key storage

1. **Add Authentication Provider** (choose one):
   - NextAuth.js (Auth.js) - Most popular
   - Clerk - Managed, easy setup
   - Custom JWT - Full control

2. **Add Database Schema**:
   - User table with encrypted API key storage
   - Session management

3. **Add API Key Management UI**:
   - Settings page for users to input their Anthropic API key
   - Encrypted storage in database

### Phase 3: Per-User API Key Injection

**Goal**: Pass user's API key to each request

```typescript
// app/api/chat/route.ts
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  // 1. Get authenticated user
  const session = await getServerSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get user's encrypted API key from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { anthropicApiKey: true },
  });

  if (!user?.anthropicApiKey) {
    return Response.json(
      { error: 'Please add your Anthropic API key in settings' },
      { status: 400 }
    );
  }

  // 3. Decrypt and use
  const apiKey = decrypt(user.anthropicApiKey);

  // 4. Pass to SDK
  for await (const event of query({
    prompt: message,
    options: {
      env: {
        ANTHROPIC_API_KEY: apiKey,
        // ... other per-user credentials
      },
      // ... other options
    },
  })) {
    // Handle events
  }
}
```

### Phase 4: Sub-Agent Authentication

**Goal**: Ensure spawned agents inherit the correct API key

The `env` option in the parent `query()` call should propagate to child processes. However, verify:

1. MCP server subprocesses receive the env variables
2. Task tool (sub-agent spawning) passes env correctly
3. Session resumption maintains correct authentication

---

## Security Best Practices

### DO:
- ✅ Encrypt API keys at rest in database
- ✅ Use HTTPS for all communications
- ✅ Validate user session before accessing their API key
- ✅ Rate limit API requests per user
- ✅ Log API usage for billing/audit (without logging the key)
- ✅ Rotate encryption keys periodically
- ✅ Use environment variables on server only

### DON'T:
- ❌ Log API keys anywhere
- ❌ Send API keys to the frontend
- ❌ Store API keys in localStorage or cookies
- ❌ Hardcode API keys in code
- ❌ Commit API keys to git
- ❌ Share API keys across users

---

## Troubleshooting Current Issue

### "OAuth token expired" Error

**Root Cause Analysis**:

1. The Claude Agent SDK spawns a subprocess (Node.js)
2. This subprocess may try to use OAuth authentication if:
   - `ANTHROPIC_API_KEY` is not properly set
   - The subprocess inherits OAuth credentials from somewhere
   - There's a Claude Code config file with OAuth credentials

**Immediate Fixes to Try**:

1. **Ensure clean env override**:
```typescript
env: {
  // Override ALL potentially conflicting env vars
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  // Explicitly unset OAuth-related vars
  CLAUDE_CODE_OAUTH_TOKEN: '',
  CLAUDE_CODE_USE_OAUTH: '',
  // Don't inherit from process.env blindly
}
```

2. **Check for config file interference**:
```bash
# Check if there's a .claude.json with OAuth credentials
cat ~/.claude.json
# Remove or rename if it contains OAuth tokens
```

3. **Force API key mode**:
```typescript
env: {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  // Some SDKs check this
  ANTHROPIC_AUTH_MODE: 'api_key',
}
```

4. **Verify environment on server**:
```bash
# In production, verify the env var is set
echo $ANTHROPIC_API_KEY
# Should show your API key (or at least not be empty)
```

---

## Recommended Solution Summary

For a production multi-user web application:

### Short-term (Fix Current Issue):
1. Verify `ANTHROPIC_API_KEY` is set in production environment
2. Don't spread `...process.env` - explicitly set only needed vars
3. Unset any OAuth-related environment variables

### Long-term (Multi-User Support):
1. Add user authentication (NextAuth.js recommended)
2. Store encrypted per-user API keys in database
3. Retrieve and inject user's API key per request
4. Consider hybrid approach: Direct SDK for chat, Agent SDK for complex operations

---

## References

- [Anthropic API Getting Started](https://platform.claude.com/docs/en/api/getting-started)
- [Claude Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Secure Agent Deployment Guide](https://platform.claude.com/docs/en/agent-sdk/secure-deployment)
- [API Key Best Practices](https://support.claude.com/en/articles/9767949-api-key-best-practices-keeping-your-keys-safe-and-secure)
- [GitHub Issue #6536 - OAuth Token with SDK](https://github.com/anthropics/claude-code/issues/6536)
- [GitHub Issue #441 - API Key Without Sign In](https://github.com/anthropics/claude-code/issues/441)

---

## Next Steps

1. [ ] Verify `ANTHROPIC_API_KEY` is correctly set in production
2. [ ] Modify env injection to be explicit (not spread process.env)
3. [ ] Test with clean environment (no OAuth tokens)
4. [ ] Plan user authentication implementation
5. [ ] Design API key management UI for users
6. [ ] Implement encrypted API key storage
