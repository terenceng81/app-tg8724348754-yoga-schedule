'use client'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppShell({ children }) {
  const { data: session } = authClient.useSession()
  const pathname = usePathname()

  const navItems = [
    { href: '/schedule', label: 'Schedule' },
    { href: '/instructors', label: 'Instructors' },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <div>
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/schedule" className="nav-brand">Yoga</Link>
          <div className="nav-links">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}>
                {item.label}
              </Link>
            ))}
            {session?.user?.role === 'admin' && (
              <Link href="/admin" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>
                Admin
              </Link>
            )}
          </div>
        </div>
        <div className="nav-actions">
          {session ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session.user?.name || session.user?.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={async () => { await authClient.signOut(); window.location.href = '/' }}>
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </nav>
      <div className="page">
        {children}
      </div>
    </div>
  )
}
