import { NextRequest, NextResponse } from "next/server"
import {
  requireAuth,
  hasUserApiKey,
  setUserApiKey,
  removeUserApiKey,
} from "@/lib/auth"

/**
 * GET /api/user/api-key
 * Check if user has an API key configured
 */
export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error

  const hasKey = await hasUserApiKey(user!.id)
  return NextResponse.json({ hasApiKey: hasKey })
}

/**
 * POST /api/user/api-key
 * Set user's Anthropic API key
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      )
    }

    // Basic validation: Anthropic API keys start with "sk-ant-"
    if (!apiKey.startsWith("sk-ant-")) {
      return NextResponse.json(
        { error: "Invalid API key format. Anthropic keys start with 'sk-ant-'" },
        { status: 400 }
      )
    }

    await setUserApiKey(user!.id, apiKey)

    return NextResponse.json({ success: true, message: "API key saved" })
  } catch (err) {
    console.error("Error saving API key:", err)
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/api-key
 * Remove user's Anthropic API key
 */
export async function DELETE() {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    await removeUserApiKey(user!.id)
    return NextResponse.json({ success: true, message: "API key removed" })
  } catch (err) {
    console.error("Error removing API key:", err)
    return NextResponse.json(
      { error: "Failed to remove API key" },
      { status: 500 }
    )
  }
}
