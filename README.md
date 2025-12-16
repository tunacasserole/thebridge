# TheBridge

TheBridge is an AI-powered SRE Command Center built with Next.js 15, featuring a chat interface with Claude AI integration and dashboards for monitoring infrastructure.

## Features

- Chat interface with Claude AI (using Anthropic's Claude Agent SDK)
- Dashboard with integration panels (Rootly, New Relic, Coralogix, etc.)
- Multi-agent orchestration capabilities
- OAuth authentication (GitHub, Google)
- User-specific API key management

## Quick Start

Get up and running in 5 minutes:

1. **Clone the repository**
   ```bash
   git clone https://github.com/tunacasserole/thebridge.git
   cd thebridge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database URL, API keys, and OAuth credentials.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Anthropic API key
- OAuth credentials (GitHub and/or Google)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/tunacasserole/thebridge.git
   cd thebridge
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration (see [Environment Variables](#environment-variables)).

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (with connection pooling) |
| `DIRECT_URL` | PostgreSQL direct connection string (for migrations) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `AUTH_SECRET` | Secret for NextAuth.js (generate with `openssl rand -base64 32`) |
| `AUTH_URL` | Your app's canonical URL (auto-set on Vercel) |

### OAuth Configuration

You need at least one OAuth provider configured:

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set the **Authorization callback URL** to:
   - Local: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://your-domain.com/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env.local`:
   ```env
   GITHUB_ID=your-client-id
   GITHUB_SECRET=your-client-secret
   ```

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID
3. Add the **Authorized redirect URI**:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
4. Copy the Client ID and Client Secret to your `.env.local`:
   ```env
   GOOGLE_ID=your-client-id
   GOOGLE_SECRET=your-client-secret
   ```

### Troubleshooting OAuth

**"redirect_uri is not associated with this application"**

This error occurs when the callback URL in your OAuth provider doesn't match your app's URL. To fix:

1. Ensure `AUTH_URL` is set correctly in your `.env.local`:
   ```env
   AUTH_URL=http://localhost:3000
   ```
2. Verify the callback URL in your OAuth provider matches exactly:
   - GitHub: `{AUTH_URL}/api/auth/callback/github`
   - Google: `{AUTH_URL}/api/auth/callback/google`
3. For Vercel deployments, `AUTH_URL` is set automatically - just ensure your OAuth provider has the production callback URL.

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Database migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Update OAuth callback URLs to use your Vercel domain

Vercel automatically sets `AUTH_URL` for you.

### Other Platforms

Ensure you set `AUTH_URL` to your deployment URL and update OAuth callback URLs accordingly.

## License

MIT
