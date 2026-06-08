'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, parseISO, isSameDay } from 'date-fns'

const CLASS_TYPES = ['All', 'Hatha', 'Vinyasa', 'Yin', 'Ashtanga', 'Restorative']

export default function SchedulePage() {
  const { data: session } = authClient.useSession()
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [classes, setClasses] = useState([])
  const [locations, setLocations] = useState([])
  const [typeFilter, setTypeFilter] = useState('All')
  const [locFilter, setLocFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [booking, setBooking] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadData() }, [weekStart])

  async function loadData() {
    setLoading(true)
    try {
      const from = format(weekStart, 'yyyy-MM-dd')
      const to = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const [cRes, lRes] = await Promise.all([
        fetch(`/api/classes?from=${from}&to=${to}`).then(r => r.json()),
        fetch('/api/locations').then(r => r.json()),
      ])
      setClasses(cRes.classes || [])
      setLocations(lRes.locations || [])
    } catch (e) { console.error('Load failed', e) }
    finally { setLoading(false) }
  }

  async function handleBook(classId) {
    if (!session) { window.location.href = '/'; return }
    setBooking(true)
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ class_id: classId }) })
      const data = await res.json()
      if (res.ok) {
        showToast(data.waitlisted ? `You're #${data.position} on the waitlist` : 'Class booked!')
        setSelected(null)
        loadData()
      } else {
        showToast(data.error || 'Booking failed', true)
      }
    } catch (e) { showToast('Something went wrong', true) }
    finally { setBooking(false) }
  }

  function showToast(msg, isError) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = classes.filter(c => {
    if (typeFilter !== 'All' && c.class_type !== typeFilter) return false
    if (locFilter !== 'All' && c.location_name !== locFilter) return false
    return true
  })

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()

  return (
    <div>
      <TopNav session={session} />
      <div className="page">
        <div className="week-nav">
          <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => subWeeks(w, 1))}>←</button>
          <h2>{format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(w => addWeeks(w, 1))}>→</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</button>
        </div>

        <div className="filter-bar">
          {CLASS_TYPES.map(t => (
            <button key={t} className={`filter-pill ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>{t}</button>
          ))}
          <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>
          <button className={`filter-pill ${locFilter === 'All' ? 'active' : ''}`} onClick={() => setLocFilter('All')}>All Studios</button>
          {locations.map(l => (
            <button key={l.name} className={`filter-pill ${locFilter === l.name ? 'active' : ''}`} onClick={() => setLocFilter(l.name)}>{l.name}</button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="week-grid">
            {days.map(day => {
              const dayClasses = filtered.filter(c => isSameDay(parseISO(c.starts_at), day))
              const isToday = isSameDay(day, today)
              return (
                <div key={day.toISOString()} className="day-column">
                  <div className={`day-header ${isToday ? 'today' : ''}`}>
                    {format(day, 'EEE')}<br />{format(day, 'd')}
                  </div>
                  <div className="day-body">
                    {dayClasses.length === 0 && <div style={{ padding: 12, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>—</div>}
                    {dayClasses.map(cls => {
                      const full = cls.confirmed_count >= cls.capacity
                      return (
                        <div key={cls.id} className={`class-card ${full ? 'full' : ''}`} onClick={() => setSelected(cls)}>
                          <div className="class-card-name">{cls.class_type}</div>
                          <div className="class-card-time">{format(parseISO(cls.starts_at), 'h:mm a')} · {cls.duration}min</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cls.instructor_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cls.location_name}</div>
                          <div className="class-card-spots" style={{ color: full ? 'var(--error)' : 'var(--success)' }}>
                            {full ? 'Full' : `${cls.capacity - cls.confirmed_count} spots left`}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selected && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
            <div className="modal">
              <div className="modal-title">{selected.class_type}</div>
              <div className="detail-meta">
                <span className="chip chip-primary">{selected.class_type}</span>
                <span className="chip" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>{selected.duration} minutes</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div className="detail-row">🧘 {selected.instructor_name}</div>
                <div className="detail-row">📍 {selected.location_name}</div>
                <div className="detail-row">🕐 {format(parseISO(selected.starts_at), 'EEEE, MMM d · h:mm a')}</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  {selected.confirmed_count >= selected.capacity
                    ? <span style={{ color: 'var(--error)' }}>Class Full</span>
                    : <span style={{ color: 'var(--success)' }}>{selected.capacity - selected.confirmed_count} of {selected.capacity} spots available</span>}
                </div>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (selected.confirmed_count / selected.capacity) * 100)}%`, background: selected.confirmed_count >= selected.capacity ? 'var(--error)' : 'var(--primary)', borderRadius: 3 }} />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
                <button className={`btn ${selected.confirmed_count >= selected.capacity ? 'btn-accent' : 'btn-primary'} btn-lg`} onClick={() => handleBook(selected.id)} disabled={booking}>
                  {booking ? 'Booking...' : selected.confirmed_count >= selected.capacity ? 'Join Waitlist' : 'Book Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <div className={`toast ${toast.isError ? 'error' : 'success'}`}>{toast.msg}</div>}
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

  async function signOut() {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/schedule" className="nav-brand">Yoga</Link>
        <div className="nav-links">
          {nav.map(item => (
            <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}>{item.label}</Link>
          ))}
          {session?.user?.role === 'admin' && <Link href="/admin" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>Admin</Link>}
        </div>
      </div>
      <div className="nav-actions">
        {session ? (
          <>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session.user?.name || session.user?.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign Out</button>
          </>
        ) : (
          <Link href="/" className="btn btn-primary btn-sm">Sign In</Link>
        )}
      </div>
    </nav>
  )
}
