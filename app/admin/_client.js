1|'use client'
2|import { useState, useEffect } from 'react'
3|import Link from 'next/link'
4|import { authClient } from '@/lib/auth-client'
5|
6|export default function AdminPage() {
7|  const { data: session } = authClient.useSession()
8|  const [tab, setTab] = useState('classes')
9|  const [classes, setClasses] = useState([])
10|  const [bookings, setBookings] = useState([])
11|  const [loading, setLoading] = useState(false)
12|
13|  useEffect(() => { loadTab() }, [tab])
14|
15|  async function loadTab() {
16|    setLoading(true)
17|    try {
18|      if (tab === 'classes') {
19|        const res = await fetch('/api/admin/classes').then(r => r.json())
20|        setClasses(res.classes || [])
21|      } else if (tab === 'bookings') {
22|        const res = await fetch('/api/admin/bookings').then(r => r.json())
23|        setBookings(res.bookings || [])
24|      }
25|    } catch (e) { console.error(e) }
26|    finally { setLoading(false) }
27|  }
28|
29|  async function updatePayment(bookingId, status) {
30|    await fetch(`/api/admin/bookings/${bookingId}/payment`, {
31|      method: 'PATCH',
32|      headers: { 'Content-Type': 'application/json' },
33|      body: JSON.stringify({ payment_status: status }),
34|    })
35|    loadTab()
36|  }
37|
38|  if (!session) return <div className="spinner" />
39|
40|  return (
41|    <Shell session={session}>
42|      <h1 style={{ fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>Admin Panel</h1>
43|
44|      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
45|        <button className={`filter-pill ${tab === 'classes' ? 'active' : ''}`} onClick={() => setTab('classes')}>📅 Classes</button>
46|        <button className={`filter-pill ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>📋 Bookings</button>
47|      </div>
48|
49|      {loading ? <div className="spinner" /> : (
50|        <>
51|          {tab === 'classes' && (
52|            <div className="card" style={{ overflowX: 'auto' }}>
53|              <table className="admin-table">
54|                <thead>
55|                  <tr>
56|                    <th>Class</th><th>Instructor</th><th>Location</th><th>Date</th><th>Spots</th><th>Status</th>
57|                  </tr>
58|                </thead>
59|                <tbody>
60|                  {classes.map(c => (
61|                    <tr key={c.id}>
62|                      <td style={{ fontWeight: 500 }}>{c.class_type}</td>
63|                      <td>{c.instructor_name}</td>
64|                      <td>{c.location_name}</td>
65|                      <td>{new Date(c.starts_at).toLocaleDateString()}</td>
66|                      <td>{c.confirmed_count}/{c.capacity}</td>
67|                      <td><span className={`chip ${c.status === 'scheduled' ? 'chip-success' : 'chip-error'}`}>{c.status}</span></td>
68|                    </tr>
69|                  ))}
70|                </tbody>
71|              </table>
72|            </div>
73|          )}
74|
75|          {tab === 'bookings' && (
76|            <div className="card" style={{ overflowX: 'auto' }}>
77|              <table className="admin-table">
78|                <thead>
79|                  <tr>
80|                    <th>User</th><th>Class</th><th>Date</th><th>Status</th><th>Payment</th><th>Actions</th>
81|                  </tr>
82|                </thead>
83|                <tbody>
84|                  {bookings.map(b => (
85|                    <tr key={b.id}>
86|                      <td>{b.user_email}</td>
87|                      <td style={{ fontWeight: 500 }}>{b.class_type}</td>
88|                      <td>{new Date(b.starts_at).toLocaleDateString()}</td>
89|                      <td><span className={`chip ${b.status === 'confirmed' ? 'chip-success' : 'chip-error'}`}>{b.status}</span></td>
90|                      <td><span className={`chip ${b.payment_status === 'paid' ? 'chip-success' : b.payment_status === 'comped' ? 'chip-accent' : 'chip-warning'}`}>{b.payment_status}</span></td>
91|                      <td>
92|                        <select
93|                          value={b.payment_status}
94|                          onChange={e => updatePayment(b.booking_id, e.target.value)}
95|                          style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 13 }}
96|                        >
97|                          <option value="pending">Pending</option>
98|                          <option value="paid">Paid</option>
99|                          <option value="comped">Comped</option>
100|                        </select>
101|                      </td>
102|                    </tr>
103|                  ))}
104|                </tbody>
105|              </table>
106|            </div>
107|          )}
108|        </>
109|      )}
110|    </Shell>
111|  )
112|}
113|
114|function Shell({ children, session }) {
115|  const [pathname, setPathname] = useState('')
116|  useEffect(() => { setPathname(window.location.pathname) }, [])
117|  const nav = [
118|    { href: '/schedule', label: 'Schedule' },
119|    { href: '/instructors', label: 'Instructors' },
120|    { href: '/dashboard', label: 'Dashboard' },
121|  ]
122|  return (
123|    <div>
124|      <nav className="top-nav">
125|        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
126|          <Link href="/schedule" className="nav-brand">Yoga</Link>
127|          <div className="nav-links">
128|            {nav.map(item => (
129|              <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}>{item.label}</Link>
130|            ))}
131|            <Link href="/admin" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>Admin</Link>
132|          </div>
133|        </div>
134|        <div className="nav-actions">
135|          {session ? (
136|            <>
137|              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session.user?.name || session.user?.email}</span>
138|              <button className="btn btn-ghost btn-sm" onClick={async () => { await authClient.signOut(); window.location.href = '/' }}>Sign Out</button>
139|            </>
140|          ) : <Link href="/" className="btn btn-primary btn-sm">Sign In</Link>}
141|        </div>
142|      </nav>
143|      <div className="page">{children}</div>
144|    </div>
145|  )
146|}
147|