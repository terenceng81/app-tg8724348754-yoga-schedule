'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

export default function InstructorsPage() {
  const { data: session } = authClient.useSession()
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const res = await fetch('/api/instructors')
      const data = await res.json()
      setInstructors(data.instructors || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <TopNav session={session} />
      <div className="page">
        <h1 style={{ marginBottom: 20, fontFamily: "'DM Serif Display', serif" }}>Our Instructors</h1>
        {loading ? <div className="spinner" /> : (
          <div className="instructor-grid">
            {instructors.map(inst => (
              <Link key={inst.id} href={`/instructors/${inst.id}`} className="instructor-card">
                <div className="instructor-name">{inst.name}</div>
                {inst.bio && <div className="instructor-bio">{inst.bio.slice(0, 120)}{inst.bio.length > 120 ? '...' : ''}</div>}
                {inst.specialties && inst.specialties.length > 0 && (
                  <div className="specialty-tags">
                    {inst.specialties.map(s => <span key={s} className="chip chip-primary">{s}</span>)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TopNav({ session }) {
  const [pathname, setPathname] = useState('')
  useEffect(() => { setPathname(window.location.pathname) }, [])
  const nav = [
    { href: '/schedule', label: 'Schedule' },
    { href: '/instructors', label: 'Instructors' },
    { href: '/dashboard', label: 'Dashboard' },
  ]
  return (
    <nav className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/schedule" className="nav-brand">Yoga</Link>
        <div className="nav-links">
          {nav.map(item => (
            <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}>{item.label}</Link>
          ))}
        </div>
      </div>
      <div className="nav-actions">
        {session ? (
          <>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session.user?.name || session.user?.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={async () => { await authClient.signOut(); window.location.href = '/' }}>Sign Out</button>
          </>
        ) : <Link href="/" className="btn btn-primary btn-sm">Sign In</Link>}
      </div>
    </nav>
  )
}
