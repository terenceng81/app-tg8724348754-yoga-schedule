'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { format, parseISO } from 'date-fns'

export default function DashboardPage() {
  const { data: session } = authClient.useSession()
  const [upcoming, setUpcoming] = useState([])
  const [waitlist, setWaitlist] = useState([])
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (session) loadData() }, [session])

  async function loadData() {
    try {
      const [uRes, wRes, hRes] = await Promise.all([
        fetch('/api/dashboard/upcoming').then(r => r.json()),
        fetch('/api/dashboard/waitlist').then(r => r.json()),
        fetch('/api/dashboard/history').then(r => r.json()),
      ])
      setUpcoming(uRes.bookings || [])
      setWaitlist(wRes.entries || [])
      setHistory(hRes.bookings || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function handleCancel(bookingId) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
      if (res.ok) setUpcoming(prev => prev.filter(b => b.id !== bookingId))
    } catch (e) { console.error(e) }
  }

  if (!session) return <div className="spinner" />

  return (
    <div>
      <TopNav session={session} />
      <div className="page">
        <h1 style={{ fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>My Dashboard</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button className={`filter-pill ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>📅 Upcoming ({upcoming.length})</button>
          <button className={`filter-pill ${tab === 'waitlist' ? 'active' : ''}`} onClick={() => setTab('waitlist')}>⏳ Waitlist ({waitlist.length})</button>
          <button className={`filter-pill ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>📋 History</button>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {tab === 'upcoming' && (
              <div>
                <div className="section-title">Upcoming Classes</div>
                {upcoming.length === 0 ? <Empty msg="No upcoming classes. Browse the schedule to book!" /> : (
                  upcoming.map(b => (
                    <div key={b.booking_id} className="booking-row">
                      <div className="booking-info">
                        <div className="booking-title">{b.class_type}</div>
                        <div className="booking-detail">{format(parseISO(b.starts_at), 'EEE, MMM d · h:mm a')} · {b.duration}min · {b.instructor_name} · {b.location_name}</div>
                        <div style={{ marginTop: 4 }}>
                          <span className={`chip ${b.payment_status === 'paid' ? 'chip-success' : b.payment_status === 'comped' ? 'chip-accent' : 'chip-warning'}`}>{b.payment_status}</span>
                        </div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.booking_id)}>Cancel</button>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === 'waitlist' && (
              <div>
                <div className="section-title">Active Waitlists</div>
                {waitlist.length === 0 ? <Empty msg="No active waitlists." /> : (
                  waitlist.map(w => (
                    <div key={w.id} className="booking-row">
                      <div className="booking-info">
                        <div className="booking-title">{w.class_type}</div>
                        <div className="booking-detail">{format(parseISO(w.starts_at), 'EEE, MMM d · h:mm a')} · {w.instructor_name}</div>
                      </div>
                      <span className="chip chip-accent">#{w.position}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === 'history' && (
              <div>
                <div className="section-title">Attendance History (90 days)</div>
                {history.length === 0 ? <Empty msg="No past classes yet." /> : (
                  history.map(b => (
                    <div key={b.id} className="booking-row">
                      <div className="booking-info">
                        <div className="booking-title">{b.class_type}</div>
                        <div className="booking-detail">{format(parseISO(b.starts_at), 'MMM d, yyyy · h:mm a')} · {b.instructor_name}</div>
                      </div>
                      <span className="chip chip-success">{b.status === 'confirmed' ? 'Confirmed' : 'Past'}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Empty({ msg }) {
  return <div className="empty-state"><div className="empty-state-icon">🧘</div><div className="empty-state-text">{msg}</div></div>
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
