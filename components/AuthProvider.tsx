'use client'

/**
 * Authentication Provider Wrapper
 * Wraps the app with NextAuth SessionProvider
 */

import { SessionProvider } from 'next-auth/react'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
