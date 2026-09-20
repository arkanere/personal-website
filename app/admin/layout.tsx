'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './admin.css'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-header-left">
            <Link href="/" className="admin-logo">
              Personal Website
            </Link>
            <nav className="admin-nav">
              <Link
                href="/admin/blogs"
                className={`admin-nav-link${isActive('/admin/blogs') ? ' active' : ''}`}
              >
                Blogs
              </Link>
            </nav>
          </div>

          <div className="admin-header-right">
            {session?.user && (
              <>
                <div className="admin-user">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || ''}
                      className="admin-avatar"
                    />
                  )}
                  <span className="admin-username">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="admin-signout"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
