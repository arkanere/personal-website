/**
 * NextAuth Configuration
 */

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

/** The admin whitelist, from ADMIN_EMAILS. An unset list admits nobody. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false

  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  if (allowed.length === 0) {
    console.warn('⚠️  No ADMIN_EMAILS configured, so no one can sign in.')
    return false
  }

  return allowed.includes(email.toLowerCase())
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Uncomment if you want to use GitHub OAuth
    // GitHubProvider({
    //   clientId: process.env.GITHUB_ID!,
    //   clientSecret: process.env.GITHUB_SECRET!,
    // }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user }) {
      if (!isAdminEmail(user.email)) {
        console.log(`❌ Access denied for ${user.email}`)
        return false
      }

      console.log(`✅ Access granted for ${user.email}`)
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
