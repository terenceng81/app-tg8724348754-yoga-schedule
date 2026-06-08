'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

export default function AdminPage() {
  const { data: session } = authClient.useSession()
  const [tab, setTab] = useState('classes')
  const [classes, setClasses] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadTab() }, [tab])

  async function loadTab() {
    setLoading(true)
    try {
      if (tab === 'classes') {
        const res = await fetch('/api/admin/classes').then(r => r.json())
        setClasses(res.classes || [])
      } else if (tab === 'bookings') {
        const res = await fetch('/api/admin/bookings').then(r => r.json())
        setBookings(res.bookings || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function updatePayment(bookingId, status) {
    await fetch(`/api/admin/bookings/${bookingId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: status }),
    })
    loadTab()
  }

  if (!session) return <div className="spinner" />

  return (
    <Shell session={session}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>Admin Panel</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`filter-pill ${tab === 'classes' ? 'active' : ''}`} onClick={() => setTab('classes')}>📅 Classes</button>
        <button className={`filter-pill ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>📋 Bookings</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          {tab === 'classes' && (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Class</th><th>Instructor</th><th>Location</th><th>Date</th><th>Spots</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.class_type}</td>
                      <td>{c.instructor_name}</td>
                      <td>{c.location_name}</td>
                      <td>{new Date(c.starts_at).toLocaleDateString()}</td>
                      <td>{c.confirmed_count}/{c.capacity}</td>
                      <td><span className={`chip ${c.status === 'scheduled' ? 'chip-success' : 'chip-error'}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'bookings' && (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th><th>Class</th><th>Date</th><th>Status</th><th>Payment</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>{b.user_email}</td>
                      <td style={{ fontWeight: 500 }}>{b.class_type}</td>
                      <td>{new Date(b.starts_at).toLocaleDateString()}</td>
                      <td><span className={`chip ${b.status === 'confirmed' ? 'chip-success' : 'chip-error'}`}>{b.status}</span></td>
                      <td><span className={`chip ${b.payment_status === 'paid' ? 'chip-success' : b.payment_status === 'comped' ? 'chip-accent' : 'chip-warning'}`}>{b.payment_status}</span></td>
                      <td>
                        <select
                          value={b.payment_status}
                          onChange={e => updatePayment(b.booking_id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 13 }}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="comped">Comped</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
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
            <Link href="/admin" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>Admin</Link>
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
