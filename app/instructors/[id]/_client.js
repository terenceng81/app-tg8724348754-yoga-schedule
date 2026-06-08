'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { format, parseISO } from 'date-fns'

export default function InstructorDetail() {
  const { id } = useParams()
  const { data: session } = authClient.useSession()
  const [instructor, setInstructor] = useState(null)
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    try {
      const [iRes, cRes] = await Promise.all([
        fetch(`/api/instructors/${id}`).then(r => r.json()),
        fetch(`/api/classes?instructor=${id}`).then(r => r.json()),
      ])
      setInstructor(iRes.instructor)
      setClasses(cRes.classes || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return <Shell session={session}><div className="spinner" /></Shell>
  if (!instructor) return <Shell session={session}><div className="empty-state"><div className="empty-state-icon">🧘</div><div className="empty-state-text">Instructor not found</div></div></Shell>

  return (
    <Shell session={session}>
      <Link href="/instructors" style={{ color: 'var(--primary)', fontSize: 14 }}>← Back to Instructors</Link>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", marginTop: 16 }}>{instructor.name}</h1>
      {instructor.specialties && (
        <div className="specialty-tags" style={{ marginTop: 8 }}>
          {instructor.specialties.map(s => <span key={s} className="chip chip-primary">{s}</span>)}
        </div>
      )}
      {instructor.bio && <p style={{ marginTop: 16, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{instructor.bio}</p>}
      <h2 style={{ marginTop: 32, marginBottom: 16, fontFamily: "'DM Serif Display', serif" }}>Upcoming Classes</h2>
      {classes.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No upcoming classes scheduled.</p> : (
        <div style={{ display: 'grid', gap: 8 }}>
          {classes.map(cls => (
            <div key={cls.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{cls.class_type}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{format(parseISO(cls.starts_at), 'EEE, MMM d · h:mm a')} · {cls.duration}min · {cls.location_name}</div>
              </div>
              <span className={`chip ${cls.confirmed_count >= cls.capacity ? 'chip-error' : 'chip-success'}`}>
                {cls.confirmed_count >= cls.capacity ? 'Full' : `${cls.capacity - cls.confirmed_count} spots`}
              </span>
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}

function Shell({ children, session }) {
  const [pathname, setPathname] = useState('')
  useEffect(() => { setPathname(window.location.pathname) }, [])
  const nav = [
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
      <div className="page">{children}</div>
    </div>
  )
}
