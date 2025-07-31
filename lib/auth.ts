import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true, purpose: true, gmailEmail: true, gmailPassword: true }
        })
        session.user.id = user?.id || undefined
        session.user.purpose = user?.purpose || undefined
        session.user.hasGmailConfig = Boolean(user?.gmailEmail && user?.gmailPassword && user.gmailPassword.length > 0)
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
  },
}