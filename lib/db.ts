import { PrismaClient } from '@prisma/client';

// Prevent multiple instances during hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper functions for common operations

// Conversations
export async function createConversation(userId: string, title?: string) {
  return prisma.conversation.create({
    data: { userId, title },
  });
}

export async function getConversation(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function listConversations(limit = 20) {
  return prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

// Messages
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  toolsUsed?: string[]
) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      toolsUsed: toolsUsed ? JSON.stringify(toolsUsed) : null,
    },
  });
}

// Memory (key-value store)
export async function setMemory(key: string, value: unknown, category?: string) {
  return prisma.memory.upsert({
    where: { key },
    update: { value: JSON.stringify(value), category },
    create: { key, value: JSON.stringify(value), category },
  });
}

export async function getMemory(key: string) {
  const memory = await prisma.memory.findUnique({ where: { key } });
  return memory ? JSON.parse(memory.value) : null;
}

export async function getMemoryByCategory(category: string) {
  const memories = await prisma.memory.findMany({ where: { category } });
  return memories.map((m) => ({ key: m.key, value: JSON.parse(m.value) }));
}

// Incidents
export async function upsertIncident(data: {
  externalId?: string;
  title: string;
  severity?: string;
  status?: string;
  summary?: string;
  rootCause?: string;
  resolution?: string;
  tags?: string[];
  resolvedAt?: Date;
}) {
  const { tags, ...rest } = data;
  const incidentData = {
    ...rest,
    tags: tags ? JSON.stringify(tags) : null,
  };

  if (data.externalId) {
    return prisma.incident.upsert({
      where: { externalId: data.externalId },
      update: incidentData,
      create: incidentData,
    });
  }

  return prisma.incident.create({ data: incidentData });
}

export async function getRecentIncidents(limit = 10) {
  return prisma.incident.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function searchIncidents(query: string) {
  return prisma.incident.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { summary: { contains: query } },
        { rootCause: { contains: query } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Agents
export async function getAgentsByRole(role: string) {
  return prisma.agent.findMany({
    where: { role },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getAgent(slug: string, role: string) {
  return prisma.agent.findUnique({
    where: { slug_role: { slug, role } },
  });
}
