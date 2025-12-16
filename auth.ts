import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GitHub from "next-auth/providers/github"
import { prisma } from "@/lib/db"

// Build providers array - GitHub only
const providers = []

// GitHub OAuth (required for authentication)
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
})

// Type augmentation for session user with id
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
