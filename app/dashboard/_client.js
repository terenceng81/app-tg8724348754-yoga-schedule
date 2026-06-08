1|'use client'
2|import { useState, useEffect } from 'react'
3|import Link from 'next/link'
4|import { authClient } from '@/lib/auth-client'
5|import { format, parseISO } from 'date-fns'
6|
7|export default function DashboardPage() {
8|  const { data: session } = authClient.useSession()
9|  const [upcoming, setUpcoming] = useState([])
10|  const [waitlist, setWaitlist] = useState([])
11|  const [history, setHistory] = useState([])
12|  const [tab, setTab] = useState('upcoming')
13|  const [loading, setLoading] = useState(true)
14|
15|  useEffect(() => { if (session) loadData() }, [session])
16|
17|  async function loadData() {
18|    try {
19|      const [uRes, wRes, hRes] = await Promise.all([
20|        fetch('/api/dashboard/upcoming').then(r => r.json()),
21|        fetch('/api/dashboard/waitlist').then(r => r.json()),
22|        fetch('/api/dashboard/history').then(r => r.json()),
23|      ])
24|      setUpcoming(uRes.bookings || [])
25|      setWaitlist(wRes.entries || [])
26|      setHistory(hRes.bookings || [])
27|    } catch (e) { console.error(e) }
28|    finally { setLoading(false) }
29|  }
30|
31|  async function handleCancel(bookingId) {
32|    try {
33|      const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
34|      if (res.ok) {
35|        setUpcoming(prev => prev.filter(b => b.id !== bookingId))
36|      }
37|    } catch (e) { console.error(e) }
38|  }
39|
40|  if (!session) return <div className="spinner" />
41|
42|  return (
43|    <Shell session={session}>
44|      <h1 style={{ fontFamily: "'DM Serif Display', serif", marginBottom: 20 }}>My Dashboard</h1>
45|
46|      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
47|        <button className={`filter-pill ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>📅 Upcoming ({upcoming.length})</button>
48|        <button className={`filter-pill ${tab === 'waitlist' ? 'active' : ''}`} onClick={() => setTab('waitlist')}>⏳ Waitlist ({waitlist.length})</button>
49|        <button className={`filter-pill ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>📋 History</button>
50|      </div>
51|
52|      {loading ? <div className="spinner" /> : (
53|        <>
54|          {tab === 'upcoming' && (
55|            <div>
56|              <div className="section-title">Upcoming Classes</div>
57|              {upcoming.length === 0 ? <Empty msg="No upcoming classes. Browse the schedule to book!" /> : (
58|                upcoming.map(b => (
59|                  <div key={b.id} className="booking-row">
60|                    <div className="booking-info">
61|                      <div className="booking-title">{b.class_type}</div>
62|                      <div className="booking-detail">
63|                        {format(parseISO(b.starts_at), 'EEE, MMM d · h:mm a')} · {b.duration}min · {b.instructor_name} · {b.location_name}
64|                      </div>
65|                      <div style={{ marginTop: 4 }}>
66|                        <span className={`chip ${b.payment_status === 'paid' ? 'chip-success' : b.payment_status === 'comped' ? 'chip-accent' : 'chip-warning'}`}>
67|                          {b.payment_status}
68|                        </span>
69|                      </div>
70|                    </div>
71|                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.booking_id)}>Cancel</button>
72|                  </div>
73|                ))
74|              )}
75|            </div>
76|          )}
77|
78|          {tab === 'waitlist' && (
79|            <div>
80|              <div className="section-title">Active Waitlists</div>
81|              {waitlist.length === 0 ? <Empty msg="No active waitlists." /> : (
82|                waitlist.map(w => (
83|                  <div key={w.id} className="booking-row">
84|                    <div className="booking-info">
85|                      <div className="booking-title">{w.class_type}</div>
86|                      <div className="booking-detail">
87|                        {format(parseISO(w.starts_at), 'EEE, MMM d · h:mm a')} · {w.instructor_name}
88|                      </div>
89|                    </div>
90|                    <span className="chip chip-accent">#{w.position}</span>
91|                  </div>
92|                ))
93|              )}
94|            </div>
95|          )}
96|
97|          {tab === 'history' && (
98|            <div>
99|              <div className="section-title">Attendance History (90 days)</div>
100|              {history.length === 0 ? <Empty msg="No past classes yet." /> : (
101|                history.map(b => (
102|                  <div key={b.id} className="booking-row">
103|                    <div className="booking-info">
104|                      <div className="booking-title">{b.class_type}</div>
105|                      <div className="booking-detail">
106|                        {format(parseISO(b.starts_at), 'MMM d, yyyy · h:mm a')} · {b.instructor_name}
107|                      </div>
108|                    </div>
109|                    <span className="chip chip-success">{b.status ? 'Confirmed' : 'Past'}</span>
110|                  </div>
111|                ))
112|              )}
113|            </div>
114|          )}
115|        </>
116|      )}
117|    </Shell>
118|  )
119|}
120|
121|function Empty({ msg }) {
122|  return <div className="empty-state"><div className="empty-state-icon">🧘</div><div className="empty-state-text">{msg}</div></div>
123|}
124|
125|function Shell({ children, session }) {
126|  const [pathname, setPathname] = useState('')
127|  useEffect(() => { setPathname(window.location.pathname) }, [])
128|  const nav = [
129|    { href: '/schedule', label: 'Schedule' },
130|    { href: '/instructors', label: 'Instructors' },
131|    { href: '/dashboard', label: 'Dashboard' },
132|  ]
133|  return (
134|    <div>
135|      <nav className="top-nav">
136|        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
137|          <Link href="/schedule" className="nav-brand">Yoga</Link>
138|          <div className="nav-links">
139|            {nav.map(item => (
140|              <Link key={item.href} href={item.href} className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}>{item.label}</Link>
141|            ))}
142|          </div>
143|        </div>
144|        <div className="nav-actions">
145|          {session ? (
146|            <>
147|              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{session.user?.name || session.user?.email}</span>
148|              <button className="btn btn-ghost btn-sm" onClick={async () => { await authClient.signOut(); window.location.href = '/' }}>Sign Out</button>
149|            </>
150|          ) : <Link href="/" className="btn btn-primary btn-sm">Sign In</Link>}
151|        </div>
152|      </nav>
153|      <div className="page">{children}</div>
154|    </div>
155|  )
156|}
157|