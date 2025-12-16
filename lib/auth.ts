import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { NextResponse } from "next/server"

/**
 * Get the authenticated user from the session
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  return session.user
}

/**
 * Require authentication for an API route
 * Returns error response if not authenticated
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      ),
    }
  }
  return { user, error: null }
}

/**
 * Get the user's decrypted Anthropic API key
 * Falls back to server API key if user hasn't set one
 */
export async function getUserApiKey(userId: string): Promise<string | null> {
  // First try to get user's personal API key
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { anthropicApiKey: true },
  })

  if (user?.anthropicApiKey) {
    try {
      return decrypt(user.anthropicApiKey)
    } catch (error) {
      console.error("Failed to decrypt user API key:", error)
      // Fall through to server key
    }
  }

  // Fall back to server API key (for development or single-tenant deployments)
  return process.env.ANTHROPIC_API_KEY || null
}

/**
 * Set the user's Anthropic API key (encrypted)
 */
export async function setUserApiKey(
  userId: string,
  apiKey: string
): Promise<void> {
  const { encrypt } = await import("@/lib/encryption")
  const encryptedKey = encrypt(apiKey)

  await prisma.user.update({
    where: { id: userId },
    data: { anthropicApiKey: encryptedKey },
  })
}

/**
 * Remove the user's Anthropic API key
 */
export async function removeUserApiKey(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { anthropicApiKey: null },
  })
}

/**
 * Check if user has an API key configured
 */
export async function hasUserApiKey(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { anthropicApiKey: true },
  })
  return !!user?.anthropicApiKey
}
