# TheBridge Vercel Deployment Plan

## Executive Summary

This plan outlines deploying TheBridge to Vercel with Supabase PostgreSQL. SQLite is incompatible with Vercel's serverless architecture because serverless functions have ephemeral storage and can't share a persistent filesystem.

---

## Phase 1: Database Setup (Supabase PostgreSQL)

### Why Supabase?
- **Generous free tier**: 500MB database, unlimited API requests
- **Realtime subscriptions**: Perfect for chat/agent streaming in TheBridge
- **Built-in auth**: Ready for future user authentication
- **Row Level Security**: Enterprise-grade data protection
- **Open source**: Can self-host later if needed
- **Prisma Compatible**: Full support with connection pooling

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Create a new project: `thebridge`
3. Select region closest to your users (e.g., `us-east-1`)
4. Set a secure database password (save this!)
5. Wait for project to provision (~2 minutes)

### Step 1.2: Get Connection Strings

1. Go to **Project Settings** → **Database**
2. Scroll to **Connection string** section
3. Copy both strings:

**Transaction pooler (port 6543)** - for application:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Session pooler (port 5432)** - for migrations:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Step 1.3: Update Local Environment

Add to your `.env.local`:
```bash
# Supabase Database
DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR_PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[YOUR_PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### Step 1.4: Push Schema to Supabase

```bash
# Remove old SQLite migrations
rm -rf prisma/migrations

# Reinstall dependencies (SQLite removed)
npm install

# Push schema directly to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed initial data (agents, etc.)
npm run db:seed
```

### Step 1.5: Verify Connection

```bash
# Test the connection
npx prisma studio
# Opens browser at localhost:5555 - you should see your tables
```

---

## Phase 2: Environment Variables for Vercel

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Supabase pooled connection (port 6543) | Yes |
| `DIRECT_URL` | Supabase direct connection (port 5432) | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes |

### Optional Integration Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub personal access token |
| `GITHUB_OWNER` | GitHub org/user for PR panels |
| `GITHUB_REPOS` | Comma-separated repo list |
| `SLACK_BOT_TOKEN` | Slack bot token |
| `JIRA_BASE_URL` | Jira instance URL |
| `JIRA_EMAIL` | Jira account email |
| `JIRA_API_TOKEN` | Jira API token |
| `JIRA_PROJECT_KEY` | Default Jira project |
| `ROOTLY_API_KEY` | Rootly API key |
| `NEW_RELIC_API_KEY` | New Relic API key |
| `NEW_RELIC_ACCOUNT_ID` | New Relic account ID |
| `METABASE_URL` | Metabase instance URL |
| `METABASE_API_KEY` | Metabase API key |
| `CORALOGIX_API_KEY` | Coralogix API key |
| `CORALOGIX_REGION` | Coralogix region (e.g., US1) |

---

## Phase 3: Vercel Deployment

### Step 3.1: Install Vercel CLI

```bash
npm i -g vercel
vercel login
```

### Step 3.2: Link Project

```bash
cd /Users/ahenderson/dev/thebridge
vercel link
# Select: Create new project
# Project name: thebridge
# Framework: Next.js (auto-detected)
```

### Step 3.3: Set Environment Variables

```bash
# Required
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add ANTHROPIC_API_KEY production

# Optional integrations (add as needed)
vercel env add ROOTLY_API_KEY production
vercel env add NEW_RELIC_API_KEY production
# ... etc
```

Or use Vercel Dashboard: **Project → Settings → Environment Variables**

### Step 3.4: Deploy

```bash
# Preview deployment (creates preview URL)
vercel

# Production deployment
vercel --prod
```

---

## Phase 4: Post-Deployment

### Verify Deployment

- [ ] Visit production URL
- [ ] Test chat interface sends/receives messages
- [ ] Verify database connectivity (messages persist)
- [ ] Check dashboard panels load

### Enable Supabase Features (Optional)

1. **Realtime for live updates**:
   - Supabase Dashboard → Database → Replication
   - Enable realtime for `Message` and `Conversation` tables
   - Useful for multi-user or multi-tab scenarios

2. **Row Level Security** (if adding auth later):
   - Supabase Dashboard → Authentication → Policies
   - Define access rules per table

---

## Quick Deploy Commands

```bash
# 1. Install dependencies
npm install

# 2. Set up local env (copy from Supabase dashboard)
# Edit .env.local with your DATABASE_URL and DIRECT_URL

# 3. Push schema to Supabase
npx prisma db push
npx prisma generate
npm run db:seed

# 4. Test locally
npm run dev

# 5. Deploy to Vercel
vercel link
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

---

## Cost Estimates

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel** | 100GB bandwidth, 100 hrs serverless | $20/mo Pro |
| **Supabase** | 500MB database, 2 projects | $25/mo Pro |
| **Anthropic** | N/A | Pay per token (~$3-15/MTok) |

**Projected Monthly Cost**: $0 (free tier) to ~$50/mo (moderate usage)

---

## Troubleshooting

### "Connection refused" error
- Verify you're using the correct port (6543 for pooled, 5432 for direct)
- Check password doesn't have special characters that need URL encoding

### "Prisma migrate" fails
- Use `prisma db push` instead for Supabase (direct schema sync)
- Supabase manages migrations differently than traditional Postgres

### Slow cold starts
- Enable Vercel's "Fluid Compute" for faster serverless boots
- Consider Supabase's connection pooler (already configured)

---

## References

- [Supabase + Prisma Guide](https://supabase.com/docs/guides/integrations/prisma)
- [Vercel + Supabase Integration](https://vercel.com/integrations/supabase)
- [Prisma Connection Pooling](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
