# MCP Hub Server Dockerfile
FROM node:22-slim

# Install Python (needed for some MCP servers like prometheus, snowflake)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    pipx \
    && rm -rf /var/lib/apt/lists/*

# Add pipx to PATH
ENV PATH="/root/.local/bin:$PATH"

# Install uvx (Python package runner, like npx for Python)
RUN pipx install uv

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source
COPY src ./src

# Build TypeScript
RUN npm run build

# Environment variables (override at runtime)
ENV PORT=3001
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["node", "dist/index.js"]
