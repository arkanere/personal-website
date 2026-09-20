'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <h2 className="auth-title">
            Authentication Error
          </h2>
        </div>

        <div className="auth-error">
          <p>
            {error === 'Configuration' && 'There is a problem with the server configuration.'}
            {error === 'AccessDenied' && 'You do not have permission to access this page.'}
            {error === 'Verification' && 'The sign in link is no longer valid.'}
            {!['Configuration', 'AccessDenied', 'Verification'].includes(error || '') &&
              'An unexpected error occurred during authentication.'}
          </p>
        </div>

        <div className="auth-link">
          <Link href="/auth/signin">
            Try signing in again
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="auth-loading">Loading...</div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
